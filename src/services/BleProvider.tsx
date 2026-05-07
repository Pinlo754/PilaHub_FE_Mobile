import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Device } from 'react-native-ble-plx';
import { PermissionsAndroid, Platform } from 'react-native';
import { getBleManager, resetBleManager } from './bleManager';
import { Buffer } from 'buffer';

type BleContextType = {
  connectedDevice: Device | null;
  hr: number | null;
  status: string;
  isIotDeviceConnected: boolean;
  startScanForPolar: () => void;
  stopScan: () => void;
  disconnect: () => void;
};

const BleContext = createContext<BleContextType | undefined>(undefined);

export const BleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // do NOT capture a single manager instance here; call getBleManager() inside functions
  const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);
  const [hr, setHr] = useState<number | null>(null);
  const [status, setStatus] = useState<string>('idle');
  const monitorRef = useRef<any>(null);
  const scanRef = useRef<any>(null);
  // keep simple reconnect attempts counter if needed later
  // const reconnectAttempts = useRef<number>(0);
  const isIotDeviceConnected = connectedDevice !== null && status === 'receiving';
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

  useEffect(() => {
    // Tự động scan khi mở App
    const autoConnect = async () => {
      // Nếu đã kết nối hoặc đang kết nối thì bỏ qua
      if (connectedDevice || status === 'connecting' || status === 'receiving') return;
      
      console.log("Global BLE: Starting auto-scan...");
      await startScanForPolar();
    };

    autoConnect();

    // Dọn dẹp khi đóng App hẳn
    return () => {
      stopScan();
      // Không gọi disconnect() ở đây để tránh mất kết nối khi reload component
    };
  }, []);

  function parseHeartRate(base64Value: string | null) {
    if (!base64Value) return null;
    try {
      const data = Buffer.from(base64Value, 'base64');
      const flags = data.readUInt8(0);
      const hrFormatUint16 = flags % 2 === 1;
      if (hrFormatUint16) return data.readUInt16LE(1);
      return data.readUInt8(1);
    } catch {
      return null;
    }
  }

  function stopMonitor() {
    try {
      monitorRef.current?.remove();
      monitorRef.current = null;
    } catch {}
  }

  function stopScan() {
    try {
      scanRef.current?.remove?.();
      getBleManager().stopDeviceScan();
    } catch {}
    // Chỉ set idle nếu đang scan dở, nếu đã connected thì giữ nguyên status đó
    setStatus(prev => (prev === 'scanning' ? 'idle' : prev));
  }

  async function connectAndMonitor(d: Device) {
    setStatus('connecting');
    try {
      const manager = getBleManager();
      const connected = await manager.connectToDevice(d.id, { timeout: 10000 });
      await connected.discoverAllServicesAndCharacteristics();
      setConnectedDevice(connected);
      setStatus('connected');

      // find HR measurement characteristic
      const services = await manager.servicesForDevice(connected.id);
      let hrFound = false;
      for (const s of services) {
        try {
          const chars = await manager.characteristicsForDevice(connected.id, s.uuid);
          const hrChar = chars.find(c => c.uuid.toLowerCase().includes('2a37'));
          if (hrChar) {
            hrFound = true;
            monitorRef.current = manager.monitorCharacteristicForDevice(
              connected.id,
              s.uuid,
              hrChar.uuid,
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
            break;
          }
        } catch {
          // continue
        }
      }

      if (!hrFound) setStatus('hr_char_not_found');

      // listen for unexpected disconnects and auto-reconnect
      try {
        const managerForDisconnect = getBleManager();
        managerForDisconnect.onDeviceDisconnected(connected.id, async (error, device) => {
          setStatus('disconnected');
          setConnectedDevice(null);
          // attempt reconnect with backoff
          for (let i = 0; i < 3; i++) {
            try {
              setStatus('reconnecting');
              await connectAndMonitor(device as Device);
              return;
            } catch {
              // retry
            }
            // wait with typed Promise
            await new Promise<void>((resolve) => setTimeout(resolve, 1000 * Math.pow(2, i)));
          }
          setStatus('disconnected_permanent');
        });
      } catch {
        // some versions may not support onDeviceDisconnected
      }
    } catch {
      setStatus('connect_error');
      try {
        await getBleManager().cancelDeviceConnection(d.id);
      } catch {
        // ignore
      }
    }
  }

  async function startScanForPolar() {
    const ok = await ensurePermissions();
    if (!ok) {
      setStatus('permission_denied');
      return;
    }
    setStatus('scanning');
    // call startDeviceScan on current manager instance
    try {
      const manager = getBleManager();
      scanRef.current = manager.startDeviceScan(null, null, (err, d) => {
        if (err) {
          setStatus('scan_error');
          return;
        }
        if (!d) return;
        const name = (d.name || d.localName || '').toLowerCase();
        if (name.includes('polar') || name.includes('h10')) {
          stopScan();
          connectAndMonitor(d);
        }
      });
    } catch (e: any) {
      // If manager was destroyed unexpectedly, reset and try once
      if (String(e?.message || '').toLowerCase().includes('destroy')) {
        resetBleManager();
        try {
          const manager = getBleManager();
          scanRef.current = manager.startDeviceScan(null, null, (err, d) => {
            if (err) {
              setStatus('scan_error');
              return;
            }
            if (!d) return;
            const name = (d.name || d.localName || '').toLowerCase();
            if (name.includes('polar') || name.includes('h10')) {
              stopScan();
              connectAndMonitor(d);
            }
          });
        } catch {
          setStatus('scan_error');
        }
      } else {
        setStatus('scan_error');
      }
    }
  }

  async function disconnect() {
    stopMonitor();
    if (connectedDevice) {
      try {
        await getBleManager().cancelDeviceConnection(connectedDevice.id);
      } catch {}
      setConnectedDevice(null);
      setHr(null);
      setStatus('idle');
    }
  }

  useEffect(() => {
    return () => {
      stopMonitor();
      stopScan();
    };
    // keep empty deps on purpose to start/stop scan on mount/unmount
  }, []);

  return (
    <BleContext.Provider
      value={{ connectedDevice, hr, status, isIotDeviceConnected, startScanForPolar, stopScan, disconnect }}
    >
      {children}
    </BleContext.Provider>
  );
};

export function useBle() {
  const ctx = useContext(BleContext);
  if (!ctx) throw new Error('useBle must be used inside BleProvider');
  return ctx;
}

export default BleContext;
