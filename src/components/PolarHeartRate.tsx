import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Button,
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

const HEART_RATE_SERVICE = '180D';
const HEART_RATE_MEASUREMENT = '2A37';

export default function PolarHeartRate() {
  const manager = getBleManager();
  const [scanning, setScanning] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [device, setDevice] = useState<Device | null>(null);
  const [hr, setHr] = useState<number | null>(null);
  const [status, setStatus] = useState<string>('idle');
  const monitorSub = useRef<Subscription | null>(null);
  const scanSub = useRef<Subscription | null>(null);

  useEffect(() => {
    return () => {
      stopScan();
      stopMonitor();
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
    } catch (e) {
      return false;
    }
  }

  function parseHeartRate(base64Value: string | null) {
    if (!base64Value) return null;
    try {
      const data = Buffer.from(base64Value, 'base64');
      const flags = data.readUInt8(0);
      const hrFormatUint16 = (flags & 0x01) === 0x01;
      let hrValue = null;
      if (hrFormatUint16) {
        hrValue = data.readUInt16LE(1);
      } else {
        hrValue = data.readUInt8(1);
      }
      return hrValue;
    } catch (e) {
      return null;
    }
  }

  async function startScan() {
    const ok = await ensurePermissions();
    if (!ok) {
      setStatus('permission_denied');
      return;
    }

    setScanning(true);
    setStatus('scanning');

    scanSub.current = manager.startDeviceScan([HEART_RATE_SERVICE], null, (err, d) => {
      if (err) {
        setStatus('scan_error');
        setScanning(false);
        return;
      }
      if (!d) return;
      const name = d.name || d.localName || '';
      if (name.toLowerCase().includes('polar') || name.toLowerCase().includes('h10')) {
        // found presumed Polar H10
        stopScan();
        connectToDevice(d);
      }
    });

    // fallback stop after 15s
    setTimeout(() => {
      if (scanning) {
        stopScan();
        setStatus('not_found');
      }
    }, 15000);
  }

  function stopScan() {
    try {
      scanSub.current?.remove();
      scanSub.current = null;
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

  async function connectToDevice(d: Device) {
    setConnecting(true);
    setStatus('connecting');
    try {
      const connected = await manager.connectToDevice(d.id, { timeout: 10000 });
      await connected.discoverAllServicesAndCharacteristics();
      setDevice(connected);
      setStatus('connected');
      // subscribe to heart rate measurement characteristic
      monitorSub.current = manager.monitorCharacteristicForDevice(
        connected.id,
        HEART_RATE_SERVICE,
        HEART_RATE_MEASUREMENT,
        (error, characteristic) => {
          if (error) {
            setStatus('monitor_error');
            return;
          }
          const bpm = parseHeartRate(characteristic?.value ?? null);
          if (bpm !== null) {
            setHr(bpm);
            setStatus('receiving');
          }
        },
      );
    } catch (err: any) {
      setStatus('connect_error');
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

      <View style={{ marginTop: 8 }}>
        <Text style={{ color: '#666' }}>
          Tip: run on a physical device. Ensure react-native-ble-plx is installed and Bluetooth
          enabled.
        </Text>
      </View>
    </View>
  );
}

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
});
