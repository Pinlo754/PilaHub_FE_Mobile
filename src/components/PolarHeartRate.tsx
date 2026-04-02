import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  PermissionsAndroid,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Device, Subscription } from 'react-native-ble-plx';
import { Buffer } from 'buffer';
import { getBleManager } from '../services/bleManager';
import Ionicons from '@react-native-vector-icons/ionicons';
import { colors } from '../theme/colors';

export default function PolarHeartRate({ compact = false, onHeartRate, autoStart = false, onStatusChange }: { compact?: boolean; onHeartRate?: (bpm: number) => void; autoStart?: boolean; onStatusChange?: (status: string) => void }) {
  const manager = getBleManager();
  const [scanning, setScanning] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [device, setDevice] = useState<Device | null>(null);
  const [hr, setHr] = useState<number | null>(null);
  const [status, setStatus] = useState<string>('idle');
  const monitorSub = useRef<Subscription | null>(null);
  const stopTimer = useRef<number | null>(null);
  const [servicesList, setServicesList] = useState<
    { uuid: string; characteristics: { uuid: string; isNotifiable?: boolean }[] }[]
  >([]);
  const reconnectTimer = useRef<number | null>(null);
  const lastDeviceId = useRef<string | null>(null);
  const isReconnecting = useRef<boolean>(false);

  useEffect(() => {
    return () => {
      stopScan();
      stopMonitor();
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current as unknown as number);
        reconnectTimer.current = null;
      }
      if (device) {
        try {
          manager.cancelDeviceConnection(device.id);
        } catch {
          // ignore
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [device]);

  async function ensurePermissions() {
    if (Platform.OS !== 'android') return true;

    try {
      if (Platform.Version >= 31) {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ]);
        return (
          granted[PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN] ===
            PermissionsAndroid.RESULTS.GRANTED &&
          granted[PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT] ===
            PermissionsAndroid.RESULTS.GRANTED
        );
      } else {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      }
    } catch {
      return false;
    }
  }

  function parseHeartRate(base64Value: string | null) {
    if (!base64Value) return null;
    try {
      const data = Buffer.from(base64Value, 'base64');
      const flags = data.readUInt8(0);
      // avoid bitwise lint rule by using modulo to check LSB
      const hrFormatUint16 = flags % 2 === 1;
      let hrValue: number | null = null;
      if (hrFormatUint16) {
        hrValue = data.readUInt16LE(1);
      } else {
        hrValue = data.readUInt8(1);
      }
      return hrValue;
    } catch {
      return null;
    }
  }

  async function startScan() {
    // Stop any existing scan first
    try {
      manager.stopDeviceScan();
    } catch {
      // ignore
    }

    const ok = await ensurePermissions();
    if (!ok) {
      setStatus('permission_denied');
      return;
    }

    setScanning(true);
    setStatus('scanning');
    console.log('[PolarHeartRate] startScan');

    try {
      // scan all devices (some Polar H10 may not advertise HR service in advertisement)
      manager.startDeviceScan(null, null, (err, d) => {
        if (err) {
          console.log('[PolarHeartRate] scan error', err);
          setStatus('scan_error');
          setScanning(false);
          return;
        }
        if (!d) return;
        console.log('[PolarHeartRate] found device', d.id, d.name, d.localName, d.serviceUUIDs);
        const name = (d.name || d.localName || '').toLowerCase();
        if (name.includes('polar') || name.includes('h10')) {
          // found presumed Polar H10
          stopScan();
          connectToDevice(d);
        }
      });

      // fallback stop after 15s
      stopTimer.current = setTimeout(() => {
        if (scanning) {
          stopScan();
          setStatus('not_found');
        }
      }, 15000);
    } catch (e) {
      console.log('[PolarHeartRate] startDeviceScan error:', e);
      setStatus('scan_error');
      setScanning(false);
    }
  }

  function stopScan() {
    try {
      if (stopTimer.current) {
        clearTimeout(stopTimer.current as unknown as number);
        stopTimer.current = null;
      }
      manager.stopDeviceScan();
    } catch {
      // ignore
    }
    setScanning(false);
  }

  function stopMonitor() {
    try {
      monitorSub.current?.remove();
      monitorSub.current = null;
    } catch {
      // ignore
    }
  }

  // Auto-reconnect when device disconnects unexpectedly
  const scheduleReconnect = (deviceId: string) => {
    // Prevent reconnect loop - only reconnect once
    if (isReconnecting.current) {
      console.log('[PolarHeartRate] already reconnecting, skipping duplicate reconnect');
      return;
    }
    
    isReconnecting.current = true;
    
    // Clear any pending reconnect
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current as unknown as number);
    }
    
    console.log('[PolarHeartRate] 🔄 scheduling reconnect for device:', deviceId);
    reconnectTimer.current = setTimeout(async () => {
      try {
        console.log('[PolarHeartRate] 🔄 attempting reconnect for device:', deviceId);
        
        // First, make sure we're disconnected
        try {
          await manager.cancelDeviceConnection(deviceId);
          console.log('[PolarHeartRate] cancelled previous connection');
        } catch (cancelErr) {
          console.log('[PolarHeartRate] cancelDeviceConnection:', cancelErr);
        }
        
        // Small delay to ensure disconnect completes
        await new Promise<void>(resolve => setTimeout(() => resolve(), 500));
        
        const d = await manager.connectToDevice(deviceId, { timeout: 10000 });
        console.log('[PolarHeartRate] ✅ reconnected to', d.id);
        isReconnecting.current = false;
        await connectToDevice(d);
      } catch (err) {
        console.log('[PolarHeartRate] ❌ reconnect failed:', err);
        isReconnecting.current = false;
        setStatus('reconnect_failed');
        // Don't retry automatically - let user manually reconnect
      }
    }, 2000) as unknown as number; // wait 2s before reconnect to let device stabilize
  };

  async function connectToDevice(d: Device) {
    setConnecting(true);
    setStatus('connecting');
    console.log('[PolarHeartRate] connectToDevice', d.id, d.name);
    try {
      const connected = await manager.connectToDevice(d.id, { timeout: 10000 });
      console.log('[PolarHeartRate] connected', connected.id);
      await connected.discoverAllServicesAndCharacteristics();
      console.log('[PolarHeartRate] discovered services/characteristics');
      setDevice(connected);
      setStatus('connected');

      // enumerate services & characteristics and pick proper HR characteristic dynamically
      try {
        const services = await manager.servicesForDevice(connected.id);
        console.log('[PolarHeartRate] 📋 services found:', services.length, services.map(s => s.uuid).join(', '));
        let found = false;
        // collect services + characteristics for UI
        const collected: { uuid: string; characteristics: { uuid: string; isNotifiable?: boolean }[] }[] = [];
        for (const s of services) {
          try {
            const chars = await manager.characteristicsForDevice(connected.id, s.uuid);
            // push service + its characteristics into collected for later UI display
            collected.push({ uuid: s.uuid, characteristics: chars.map(c => ({ uuid: c.uuid, isNotifiable: !!(c as any).isNotifiable })) });
            console.log('[PolarHeartRate] 📋 service:', s.uuid, '| characteristics:', chars.map(c => c.uuid).join(', '));
            const hrChar = chars.find(c => c.uuid.toLowerCase().includes('2a37'));
            if (hrChar) {
              found = true;
              try {
                // Enable notifications on the characteristic first
                console.log('[PolarHeartRate] enabling notifications for characteristic:', hrChar.uuid);
                try {
                  await manager.writeCharacteristicWithoutResponseForDevice(
                    connected.id,
                    s.uuid,
                    hrChar.uuid,
                    Buffer.from([0x01, 0x00]).toString('base64')
                  );
                } catch {
                  // Some devices don't need manual enable, continue
                  console.log('[PolarHeartRate] notification enable attempt completed (may not be needed)');
                }

                // Now setup monitor with delay to ensure device is ready
                console.log('[PolarHeartRate] setting up monitor for characteristic:', hrChar.uuid);
                
                // Delay monitor setup to ensure device is ready
                await new Promise<void>(resolve => setTimeout(() => resolve(), 200));
                
                monitorSub.current = manager.monitorCharacteristicForDevice(
                  connected.id,
                  s.uuid,
                  hrChar.uuid,
                  (error, characteristic) => {
                    if (error) {
                      console.log('[PolarHeartRate] ❌ monitor callback error:', error.message || error);
                      console.log('[PolarHeartRate] ⚠️ device disconnected, scheduling reconnect');
                      setStatus('disconnected');
                      stopMonitor();
                      lastDeviceId.current = connected.id;
                      scheduleReconnect(connected.id);
                      return;
                    }
                    console.log('[PolarHeartRate] ✅ characteristic update', characteristic?.uuid, characteristic?.value);
                    const bpm = parseHeartRate(characteristic?.value ?? null);
                    if (bpm !== null) {
                      console.log('[PolarHeartRate] ✅ parsed bpm', bpm);
                      setHr(bpm);
                      try {
                        onHeartRate?.(bpm);
                      } catch {}
                      setStatus('receiving');
                    }
                  },
                );
                console.log('[PolarHeartRate] ✅ monitor setup complete');
              } catch (monitorErr) {
                console.log('[PolarHeartRate] ❌ monitor setup error:', monitorErr);
                setStatus('monitor_setup_failed');
                // attempt a short retry
                setTimeout(async () => {
                  try {
                    console.log('[PolarHeartRate] retrying monitor setup for', connected.id, s.uuid, hrChar.uuid);
                    monitorSub.current = manager.monitorCharacteristicForDevice(
                      connected.id,
                      s.uuid,
                      hrChar.uuid,
                      (error, characteristic) => {
                        if (error) {
                          console.log('[PolarHeartRate] monitor retry callback error', error);
                          setStatus('monitor_error');
                          return;
                        }
                        const bpm = parseHeartRate(characteristic?.value ?? null);
                        if (bpm !== null) {
                          console.log('[PolarHeartRate] parsed bpm (retry)', bpm);
                          setHr(bpm);
                          try { onHeartRate?.(bpm); } catch {}
                          setStatus('receiving');
                        }
                      },
                    );
                  } catch (e) {
                    console.log('[PolarHeartRate] monitor retry failed', e);
                    // continue to fallback logic below if available
                  }
                  console.log('[PolarHeartRate] characteristic update', characteristic?.uuid, characteristic?.value);
                  const bpm = parseHeartRate(characteristic?.value ?? null);
                  if (bpm !== null) {
                    console.log('[PolarHeartRate] parsed bpm', bpm);
                    setHr(bpm);
                    setStatus('receiving');
                  }
                },
              );
              break;
            }
          } catch (e) {
            console.log('[PolarHeartRate] characteristicsForDevice error', e);
          }
        }

        if (!found) {
          console.log('[PolarHeartRate] HR characteristic not found');
          setStatus('hr_char_not_found');

          // fallback: subscribe to first notifiable characteristic we can find
          try {
            const allChars: Array<{ service: string; uuid: string; notifiable: boolean }> = [];
            for (const s of services) {
              try {
                const chars = await manager.characteristicsForDevice(connected.id, s.uuid);
                chars.forEach((c: any) => {
                  allChars.push({ service: s.uuid, uuid: c.uuid, notifiable: !!c.isNotifiable });
                });
              } catch {
                // ignore per-service errors
              }
            }

            const fallback = allChars.find(c => c.notifiable) || allChars[0];
            if (fallback) {
              console.log('[PolarHeartRate] using fallback char', fallback);
              monitorSub.current = manager.monitorCharacteristicForDevice(
                connected.id,
                fallback.service,
                fallback.uuid,
                (error, characteristic) => {
                  if (error) {
                    console.log('[PolarHeartRate] fallback monitor error', error);
                    setStatus('monitor_error');
                    return;
                  }
                  console.log('[PolarHeartRate] fallback characteristic update', characteristic?.uuid, characteristic?.value);
                  const bpm = parseHeartRate(characteristic?.value ?? null);
                  if (bpm !== null) {
                    console.log('[PolarHeartRate] parsed bpm (fallback)', bpm);
                    setHr(bpm);
                    setStatus('receiving');
                  }
                },
              );
            } else {
              console.log('[PolarHeartRate] no fallback characteristic available');
            }
          } catch (e) {
            console.log('[PolarHeartRate] fallback subscribe error', e);
          }
        }

        // Save the collected services/characteristics to state for UI display
        setServicesList(collected);
      } catch (e) {
        console.log('[PolarHeartRate] servicesForDevice error', e);
        setStatus('monitor_error');
      }
    } catch {
      setStatus('connect_error');
      console.log('[PolarHeartRate] connect error');
      // try to cancel any partial connection
      try {
        await manager.cancelDeviceConnection(d.id);
      } catch {
        // ignore
      }
    } finally {
      setConnecting(false);
    }
  }

  async function disconnect() {
    stopMonitor();
    isReconnecting.current = false;
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current as unknown as number);
      reconnectTimer.current = null;
    }
    if (device) {
      try {
        await manager.cancelDeviceConnection(device.id);
      } catch {
        // ignore
      }
      setDevice(null);
      setHr(null);
      setStatus('idle');
    }
  }

  if (compact) {
    return (
      <TouchableOpacity
        onPress={() => {
          if (scanning) stopScan();
          else startScan();
        }}
        disabled={connecting}
      >
        <View style={compactStyles.row}>
          <Ionicons name="fitness-outline" size={22} color={colors.danger.DEFAULT} />
          <Text style={compactStyles.compactText}>
            {hr === null ? '--' : hr}{' '}
            <Text style={compactStyles.compactUnit}>bpm</Text>
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Polar H10 Heart Rate</Text>

      <View style={styles.row}>
        <Text style={styles.label}>Status:</Text>
        <Text style={styles.value}>{status}</Text>
      </View>

      <View style={styles.hrBox}>
        {hr === null ? (
          <Text style={styles.hrValue}>--</Text>
        ) : (
          <Text style={styles.hrValue}>{hr} bpm</Text>
        )}
      </View>

      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.btn}
          onPress={() => {
            if (scanning) stopScan();
            else startScan();
          }}
          disabled={scanning || connecting}
        >
          {scanning ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Scan</Text>}
        </TouchableOpacity>

        {device ? (
          <TouchableOpacity style={[styles.btn, styles.disconnectBtn]} onPress={disconnect}>
            <Text style={styles.btnText}>Disconnect</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.tipBox}>
        <Text style={styles.tipText}>
          Tip: run on a physical device. Ensure react-native-ble-plx is installed and Bluetooth
          enabled.
        </Text>
      </View>

      <View style={styles.servicesList}>
        <Text style={styles.servicesListTitle}>Discovered Services & Characteristics:</Text>
        {servicesList.length === 0 ? (
          <Text style={styles.noServicesText}>No services found</Text>
        ) : (
          servicesList.map((service) => (
            <View key={service.uuid} style={styles.serviceItem}>
              <Text style={styles.serviceUuid}>{service.uuid}</Text>
              <View style={styles.characteristicsList}>
                {service.characteristics.map(char => (
                  <Text key={char.uuid} style={styles.characteristicItem}>
                    {char.uuid} {char.isNotifiable ? '(Notifiable)' : ''}
                  </Text>
                ))}
              </View>
            </View>
          ))
        )}
      </View>
    </View>
  );
}

const compactStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  compactText: { color: colors.foreground, fontWeight: '600', marginLeft: 8 },
  compactUnit: { color: colors.secondaryText, fontSize: 12, fontWeight: '600' },
});

const styles = StyleSheet.create({
  container: { padding: 16 },
  title: { fontSize: 18, fontWeight: '600', marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  label: { color: '#444', marginRight: 8 },
  value: { color: '#111', fontWeight: '500' },
  hrBox: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#fff',
    borderColor: '#eee',
    borderWidth: 1,
    marginBottom: 12,
  },
  hrValue: { fontSize: 34, fontWeight: '700' },
  controls: { flexDirection: 'row', gap: 8 },
  btn: {
    backgroundColor: '#0b84ff',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disconnectBtn: { backgroundColor: '#ff5c5c', marginLeft: 8 },
  btnText: { color: '#fff', fontWeight: '600' },
  tipBox: { marginTop: 8 },
  tipText: { color: '#666' },
  servicesList: { marginTop: 16 },
  servicesListTitle: { fontSize: 16, fontWeight: '500', marginBottom: 8 },
  noServicesText: { color: '#999' },
  serviceItem: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    borderColor: '#ddd',
    borderWidth: 1,
    marginBottom: 8,
  },
  serviceUuid: { fontWeight: '500' },
  characteristicsList: { marginTop: 4, paddingLeft: 8 },
  characteristicItem: { color: '#333' },
});
