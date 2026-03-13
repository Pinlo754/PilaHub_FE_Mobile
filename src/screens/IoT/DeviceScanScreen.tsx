import React, { useEffect, useRef, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert, Platform, PermissionsAndroid, TextInput } from 'react-native';
import { Device } from 'react-native-ble-plx';
import { getBleManager } from '../../services/bleManager';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createIoTDevice } from '../../hooks/iotClient';
// Types for optional bluetooth-classic library
type ClassicDevice = { id: string; name?: string; address?: string; rssi?: number };

const manager = getBleManager();

const requestAndroidPermissions = async () => {
  if (Platform.OS !== 'android') return true;
  try {
    // Android 12+ requires BLUETOOTH_SCAN / BLUETOOTH_CONNECT runtime permissions
    const sdk = Platform.Version as number;
    if (sdk >= 31) {
      const perms = [
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION, // still useful for some devices
      ];
      const result = await PermissionsAndroid.requestMultiple(perms as any);
      const granted = perms.every(p => result[p] === PermissionsAndroid.RESULTS.GRANTED);
      if (!granted) {
        Alert.alert('Quyền bị từ chối', 'Ứng dụng cần quyền Bluetooth để quét và kết nối thiết bị. Vui lòng cấp quyền.');
      }
      return granted;
    }

    // Pre-Android 12: location permission is required for BLE scanning
    const fine = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION, {
      title: 'Yêu cầu quyền Bluetooth',
      message: 'Ứng dụng cần quyền vị trí để quét thiết bị Bluetooth.',
      buttonPositive: 'OK',
    });
    return fine === PermissionsAndroid.RESULTS.GRANTED;
  } catch (err) {
    console.warn('Permission error', err);
    return false;
  }
};

const DeviceScanScreen: React.FC = () => {
  const [scanning, setScanning] = useState(false);
  const [devices, setDevices] = useState<Record<string, Device>>({});
  const [mode, setMode] = useState<'BLE' | 'CLASSIC' | 'MANUAL'>('BLE');
  const [classicDevices, setClassicDevices] = useState<Record<string, ClassicDevice>>({});
  const [classicScanning, setClassicScanning] = useState(false);
  const [manualName, setManualName] = useState('');
  const [manualIdentifier, setManualIdentifier] = useState('');
  const [manualType, setManualType] = useState('SMART_WATCH');
  const [connectedIds, setConnectedIds] = useState<Record<string, boolean>>({});
  const [connectingIds, setConnectingIds] = useState<Record<string, boolean>>({});
  const reconnectTimers = useRef<Record<string, any>>({});
  const retryCounts = useRef<Record<string, number>>({});
  const disconnectSubs = useRef<Record<string, any>>({});
  const scanTimeout = useRef<number | null>(null);

  useEffect(() => {
    const subsSnapshot = disconnectSubs.current;
    const timersSnapshot = reconnectTimers.current;
    return () => {
      if (scanTimeout.current) clearTimeout(scanTimeout.current);
      manager.stopDeviceScan();
      Object.keys(subsSnapshot).forEach((id) => {
        try { subsSnapshot[id]?.remove?.(); } catch {}
      });
      // clear reconnect timers
      Object.keys(timersSnapshot).forEach((id) => {
        try { clearTimeout(timersSnapshot[id]); } catch {}
      });
      // Do NOT destroy the global BleManager singleton here — keep it alive for the app.
      // manager.destroy();
    };
  }, []);

  const startScan = async () => {
    if (mode !== 'BLE') return;
    const ok = await requestAndroidPermissions();
    if (!ok) {
      Alert.alert('Quyền bị từ chối', 'Không thể quét thiết bị Bluetooth vì thiếu quyền.');
      return;
    }

    setDevices({});
    setScanning(true);

    manager.startDeviceScan(null, { allowDuplicates: false }, (error, device) => {
      if (error) {
        console.warn('Scan error', error);
        Alert.alert('Lỗi quét', error.message ?? 'Quét thiết bị thất bại');
        setScanning(false);
        return;
      }
      if (device && device.id) {
        setDevices(prev => ({ ...prev, [device.id]: device }));
      }
    });

    // Stop scan after 12 seconds
    scanTimeout.current = setTimeout(() => {
      manager.stopDeviceScan();
      setScanning(false);
    }, 12000) as unknown as number;
  };

  const handleRegister = async (device: Device) => {
    const deviceId = device.id;
    const deviceName = device.name ?? device.localName ?? `Device ${deviceId.slice(-6)}`;

    Alert.alert('Xác nhận thiết bị', `Đăng ký thiết bị: ${deviceName}\nID: ${deviceId}`, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Đăng ký',
        onPress: async () => {
          try {
            const payload = {
              deviceName,
              // Note: backend expects enum values like SMART_WATCH, SMART_SCALE, FITNESS_TRACKER, etc.
              iotDeviceType: 'SMART_WATCH',
              deviceIdentifier: deviceId,
              connectionMethod: 'BLUETOOTH',
            };
            const res = await createIoTDevice(payload as any);
            Alert.alert('Thành công', res?.message ?? 'Thiết bị đã được lưu');
          } catch (err: any) {
            const status = err?.response?.status;
            if (status === 409) {
              Alert.alert('Lỗi', 'Thiết bị đã tồn tại.');
            } else if (status === 401) {
              Alert.alert('Không xác thực', 'Vui lòng đăng nhập lại.');
            } else {
              Alert.alert('Lỗi', err?.response?.data?.message ?? err?.message ?? 'Không thể lưu thiết bị');
            }
            console.warn('createIoTDevice failed', err);
          }
        },
      },
    ]);
  };

  const setConnected = (id: string, v: boolean) => setConnectedIds(prev => ({ ...prev, [id]: v }));

  const handleConnect = async (device: Device) => {
    const deviceId = device.id;
    if (connectedIds[deviceId] || connectingIds[deviceId]) {
      Alert.alert('Thông tin', connectedIds[deviceId] ? 'Thiết bị đã được kết nối.' : 'Đang kết nối...');
      return;
    }

    setConnectingIds(prev => ({ ...prev, [deviceId]: true }));

    try {
      // Connect to device (real GATT connection)
      const connectedDevice = await manager.connectToDevice(deviceId);
      // Discover services & characteristics
      await connectedDevice.discoverAllServicesAndCharacteristics();

      // Mark connected in UI
      setConnected(deviceId, true);
      setConnectingIds(prev => ({ ...prev, [deviceId]: false }));

      // Subscribe to disconnect events to update UI
      try {
        const sub = manager.onDeviceDisconnected(deviceId, (_error, _dev) => {
          setConnected(deviceId, false);
          // remove subscription reference
          if (disconnectSubs.current[deviceId]) {
            try { disconnectSubs.current[deviceId].remove(); } catch {}
            delete disconnectSubs.current[deviceId];
          }
          // schedule auto-reconnect
          scheduleReconnect(deviceId);
        });
        disconnectSubs.current[deviceId] = sub;
      } catch {
        // ignore if subscription not available
      }

      // After successful connection, persist device to backend
      try {
        const deviceName = device.name ?? device.localName ?? `Device ${deviceId.slice(-6)}`;
        const payload = {
          deviceName,
          iotDeviceType: 'SMART_WATCH',
          deviceIdentifier: deviceId,
          connectionMethod: 'BLUETOOTH',
        };
        const res = await createIoTDevice(payload as any);
        Alert.alert('Thành công', res?.message ?? 'Thiết bị đã được kết nối và lưu');
      } catch (err: any) {
        const status = err?.response?.status;
        if (status === 409) {
          // Already exists — still consider connected
          Alert.alert('Thông báo', 'Thiết bị đã tồn tại trên server.');
        } else if (status === 401) {
          Alert.alert('Không xác thực', 'Vui lòng đăng nhập lại.');
        } else {
          Alert.alert('Lỗi', err?.response?.data?.message ?? err?.message ?? 'Không thể lưu thiết bị');
        }
      }
    } catch (err: any) {
      console.warn('BLE connect failed', err);
      setConnected(deviceId, false);
      setConnectingIds(prev => ({ ...prev, [deviceId]: false }));
      Alert.alert('Lỗi kết nối', err?.message ?? 'Không thể kết nối tới thiết bị');
    }
  };

  const attemptReconnect = async (deviceId: string) => {
    // get original device object if still available
    const device = Object.values(devices).find(d => d.id === deviceId);
    if (!device) return;
    try {
      setConnectingIds(prev => ({ ...prev, [deviceId]: true }));
      const connectedDevice = await manager.connectToDevice(deviceId);
      await connectedDevice.discoverAllServicesAndCharacteristics();
      setConnected(deviceId, true);
      setConnectingIds(prev => ({ ...prev, [deviceId]: false }));
      // reset retry count
      retryCounts.current[deviceId] = 0;
      // call backend persist if desired
      try {
        const deviceName = device.name ?? device.localName ?? `Device ${deviceId.slice(-6)}`;
        await createIoTDevice({ deviceName, iotDeviceType: 'SMART_WATCH', deviceIdentifier: deviceId, connectionMethod: 'BLUETOOTH' } as any);
      } catch { /* ignore backend error on reconnect */ }
    } catch {
      // failed reconnect
      setConnectingIds(prev => ({ ...prev, [deviceId]: false }));
      const tries = (retryCounts.current[deviceId] || 0) + 1;
      retryCounts.current[deviceId] = tries;
      if (tries <= 3) {
        scheduleReconnect(deviceId);
      }
    }
  };

  const scheduleReconnect = (deviceId: string) => {
    // clear existing timer
    if (reconnectTimers.current[deviceId]) {
      clearTimeout(reconnectTimers.current[deviceId]);
    }
    const tries = retryCounts.current[deviceId] || 0;
    const delay = 2000 * Math.pow(2, tries); // exponential backoff
    reconnectTimers.current[deviceId] = setTimeout(() => attemptReconnect(deviceId), delay);
  };

  // Bluetooth Classic (non-BLE) support using react-native-bluetooth-classic if available
  const startClassicScan = async () => {
    try {
      const RNBC = require('react-native-bluetooth-classic');
      setClassicDevices({});
      setClassicScanning(true);
      // get paired devices first
      const paired = await RNBC.list();
      const map: Record<string, ClassicDevice> = {};
      paired.forEach((d: any) => { map[d.address || d.id] = { id: d.address || d.id, name: d.name }; });
      setClassicDevices(map);
      // start discovery (scan)
      try {
        const discovered = await RNBC.startDiscovery();
        discovered.forEach((d: any) => { map[d.address || d.id] = { id: d.address || d.id, name: d.name }; });
        setClassicDevices({ ...map });
      } catch {
        // discovery may fail on some devices
      }
    } catch (e) {
      Alert.alert('Thiếu thư viện', 'react-native-bluetooth-classic chưa được cài hoặc không hỗ trợ trên nền tảng này.');
    } finally {
      setClassicScanning(false);
    }
  };

  const stopClassicScan = async () => {
    try {
      const RNBC = require('react-native-bluetooth-classic');
      await RNBC.cancelDiscovery?.();
    } catch {}
    setClassicScanning(false);
  };

  const handleClassicConnect = async (dev: ClassicDevice) => {
    try {
      const RNBC = require('react-native-bluetooth-classic');
      Alert.alert('Kết nối', `Kết nối tới ${dev.name ?? dev.id} ?`, [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Kết nối', onPress: async () => {
          try {
            const connected = await RNBC.connect(dev.id);
            if (connected) {
              // persist on backend
              const payload = { deviceName: dev.name ?? dev.id, iotDeviceType: manualType || 'SMART_WATCH', deviceIdentifier: dev.id, connectionMethod: 'BLUETOOTH_CLASSIC' };
              try { await createIoTDevice(payload as any); } catch { /* ignore */ }
              setConnected(dev.id, true);
              Alert.alert('Thành công', 'Thiết bị Classic đã kết nối');
            } else {
              Alert.alert('Lỗi', 'Không thể kết nối thiết bị Classic');
            }
          } catch (err: any) { Alert.alert('Lỗi', err?.message ?? 'Kết nối thất bại'); }
        } }
      ]);
    } catch {
      Alert.alert('Thiếu thư viện', 'react-native-bluetooth-classic chưa được cài hoặc lỗi runtime.');
    }
  };

  const handleManualSave = async () => {
    if (!manualName || !manualIdentifier) { Alert.alert('Thiếu thông tin', 'Vui lòng nhập tên và định danh thiết bị'); return; }
    try {
      const payload = { deviceName: manualName, iotDeviceType: manualType, deviceIdentifier: manualIdentifier, connectionMethod: 'MANUAL' };
      const res = await createIoTDevice(payload as any);
      Alert.alert('Thành công', res?.message ?? 'Thiết bị đã được lưu');
      // reset form
      setManualName(''); setManualIdentifier('');
    } catch (err: any) {
      Alert.alert('Lỗi', err?.response?.data?.message ?? err?.message ?? 'Không thể lưu thiết bị');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#FEF6ED]">
      <View className="p-4">
        <Text className="text-lg font-semibold text-[#A0522D]">Thêm thiết bị Bluetooth</Text>
        <Text className="mt-2 text-sm text-gray-600">Quét các thiết bị xung quanh và chọn thiết bị muốn kết nối</Text>
      </View>

      {/* Mode switch */}
      <View className="flex-row px-4 space-x-3">
        <TouchableOpacity className={`px-3 py-2 rounded-lg ${mode === 'BLE' ? 'bg-[#A0522D]' : 'bg-white'}`} onPress={() => setMode('BLE')}>
          <Text className={`${mode === 'BLE' ? 'text-white' : 'text-[#A0522D]'}`}>BLE</Text>
        </TouchableOpacity>
        <TouchableOpacity className={`px-3 py-2 rounded-lg ${mode === 'CLASSIC' ? 'bg-[#A0522D]' : 'bg-white'}`} onPress={() => setMode('CLASSIC')}>
          <Text className={`${mode === 'CLASSIC' ? 'text-white' : 'text-[#A0522D]'}`}>Classic</Text>
        </TouchableOpacity>
        <TouchableOpacity className={`px-3 py-2 rounded-lg ${mode === 'MANUAL' ? 'bg-[#A0522D]' : 'bg-white'}`} onPress={() => setMode('MANUAL')}>
          <Text className={`${mode === 'MANUAL' ? 'text-white' : 'text-[#A0522D]'}`}>Manual</Text>
        </TouchableOpacity>
      </View>

      {/* Actions for selected mode */}
      <View className="flex-row px-4 space-x-3 mt-3">
        {mode === 'BLE' && (
          <>
            <TouchableOpacity className={`flex-1 bg-[#A0522D] py-3 rounded-xl mr-2 items-center mb-2 ${scanning ? 'opacity-60' : ''}`} onPress={startScan} disabled={scanning}>
              {scanning ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-bold">Quét BLE</Text>}
            </TouchableOpacity>
            <TouchableOpacity className="flex-1 bg-[#A0522D] py-3 rounded-xl items-center mb-2" onPress={() => { setDevices({}); }}>
              <Text className="text-white font-bold">Xóa danh sách</Text>
            </TouchableOpacity>
          </>
        )}
        {mode === 'CLASSIC' && (
          <>
            <TouchableOpacity className={`flex-1 bg-[#A0522D] py-3 rounded-xl mr-2 items-center mb-2 ${classicScanning ? 'opacity-60' : ''}`} onPress={startClassicScan} disabled={classicScanning}>
              {classicScanning ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-bold">Quét Classic</Text>}
            </TouchableOpacity>
            <TouchableOpacity className="flex-1 bg-[#A0522D] py-3 rounded-xl items-center mb-2" onPress={stopClassicScan}>
              <Text className="text-white font-bold">Dừng</Text>
            </TouchableOpacity>
          </>
        )}
        {mode === 'MANUAL' && (
          <TouchableOpacity className="flex-1 bg-[#A0522D] py-3 rounded-xl items-center mb-2" onPress={handleManualSave}>
            <Text className="text-white font-bold">Lưu thiết bị</Text>
          </TouchableOpacity>
        )}
      </View>

      <View className="flex-1 p-3">
        {/* MANUAL mode */}
        {mode === 'MANUAL' && (
          <View className="p-4 bg-white rounded-lg">
            <Text className="font-semibold mb-2">Đăng ký thủ công</Text>
            <Text className="text-sm text-gray-500 mb-2">Tên thiết bị</Text>
            <View className="mb-2">
              <TextInput className="border p-2 rounded" value={manualName} onChangeText={setManualName} placeholder="Tên thiết bị" />
            </View>
            <Text className="text-sm text-gray-500 mb-2">Định danh (MAC hoặc ID)</Text>
            <View className="mb-2">
              <TextInput className="border p-2 rounded" value={manualIdentifier} onChangeText={setManualIdentifier} placeholder="AB:CD:EF:12:34:56" />
            </View>
            <Text className="text-sm text-gray-500 mb-2">Loại</Text>
            <View className="mb-2">
              <TextInput className="border p-2 rounded" value={manualType} onChangeText={setManualType} placeholder="SMART_WATCH" />
            </View>
          </View>
        )}

        {/* CLASSIC mode */}
        {mode === 'CLASSIC' && (
          (Object.keys(classicDevices).length === 0) ? (
            <View className="h-56 justify-center items-center">
              <Text className="text-gray-500">{classicScanning ? 'Đang quét Classic...' : 'Chưa có thiết bị Classic. Nhấn Quét để bắt đầu.'}</Text>
            </View>
          ) : (
            <FlatList
              data={Object.values(classicDevices)}
              keyExtractor={(d) => d.id}
              renderItem={({ item }) => (
                <TouchableOpacity className="flex-row justify-between p-3 bg-white rounded-xl mb-2 items-center" onPress={() => handleClassicConnect(item as ClassicDevice)}>
                  <View className="flex-1">
                    <Text className="text-base font-semibold">{item.name ?? 'Unknown'}</Text>
                    <Text className="mt-1 text-gray-500 text-xs">{item.id}</Text>
                  </View>
                  <View className="flex-row items-center space-x-3">
                    {connectedIds[item.id] ? (
                      <View className="bg-green-100 px-3 py-1 rounded-full"><Text className="text-green-700 font-semibold text-sm">Đã kết nối</Text></View>
                    ) : (
                      <TouchableOpacity className="bg-[#A0522D] px-3 py-1 rounded-full" onPress={() => handleClassicConnect(item as ClassicDevice)}>
                        <Text className="text-white font-semibold text-sm">Kết nối</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </TouchableOpacity>
              )}
            />
          )
        )}

        {/* BLE mode */}
        {mode === 'BLE' && (
          (Object.keys(devices).length === 0) ? (
            <View className="h-56 justify-center items-center">
              <Text className="text-gray-500">{scanning ? 'Đang quét...' : 'Chưa có thiết bị. Nhấn Quét để bắt đầu.'}</Text>
            </View>
          ) : (
            <FlatList
              data={Object.values(devices)}
              keyExtractor={(d) => d.id}
              renderItem={({ item }) => (
                <TouchableOpacity className="flex-row justify-between p-3 bg-white rounded-xl mb-2 items-center" onPress={() => handleRegister(item)}>
                  <View className="flex-1">
                    <Text className="text-base font-semibold">{item.name ?? item.localName ?? 'Unknown'}</Text>
                    <Text className="mt-1 text-gray-500 text-xs">{item.id}</Text>
                  </View>
                  <View className="flex-row items-center space-x-3">
                    <Text className="text-green-500 font-semibold">{item.rssi ?? '-'}</Text>
                    {connectedIds[item.id] ? (
                      <View className="bg-green-100 px-3 py-1 rounded-full">
                        <Text className="text-green-700 font-semibold text-sm">Đã kết nối</Text>
                      </View>
                    ) : connectingIds[item.id] ? (
                      <View className="bg-amber-100 px-3 py-1 rounded-full flex-row items-center space-x-2">
                        <ActivityIndicator size="small" color="#92400E" />
                        <Text className="text-amber-800 font-semibold text-sm">Đang kết nối…</Text>
                      </View>
                    ) : (
                      <TouchableOpacity className="bg-[#A0522D] px-3 py-1 rounded-full" onPress={() => handleConnect(item)}>
                        <Text className="text-white font-semibold text-sm">Kết nối</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </TouchableOpacity>
              )}
            />
          )
        )}
      </View>

      <View className="p-3">
        <Text className="text-gray-500 text-xs">Lưu ý: cần bật Bluetooth trên thiết bị và cho phép quyền truy cập vị trí (Android).</Text>
      </View>
    </SafeAreaView>
  );
};

export default DeviceScanScreen;
