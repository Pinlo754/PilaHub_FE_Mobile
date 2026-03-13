import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, FlatList, Pressable, ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/ionicons';
import { getMyIoTDevices } from '../../hooks/iotClient';

const MyDevicesScreen: React.FC = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [devices, setDevices] = useState<any[]>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await getMyIoTDevices();
        if (mounted) setDevices(res ?? []);
      } catch (err) {
        console.warn('getMyIoTDevices failed', err);
        Alert.alert('Lỗi', 'Không thể tải danh sách thiết bị');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-[#FEF6ED]">
      <View className="flex-row items-center justify-between px-4 py-3 bg-white border-b border-gray-100">
        <Pressable onPress={() => (navigation as any).goBack()} className="p-2"><Text className="text-xl">‹</Text></Pressable>
        <Text className="text-lg font-semibold">Thiết bị của tôi</Text>
        <View className="w-8" />
      </View>

      <View className="p-4 flex-1">
        {loading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator />
            <Text className="mt-2 text-gray-500">Đang tải thiết bị...</Text>
          </View>
        ) : devices.length === 0 ? (
          <View className="flex-1 justify-center items-center">
            <Text className="text-gray-500">Bạn chưa có thiết bị nào.</Text>
            <Pressable className="mt-4 bg-[#A0522D] px-4 py-2 rounded" onPress={() => (navigation as any).navigate('DeviceScan')}>
              <Text className="text-white font-semibold">Thêm thiết bị</Text>
            </Pressable>
          </View>
        ) : (
          <FlatList
            data={devices}
            keyExtractor={(d) => d.iotDeviceId ?? d.deviceIdentifier ?? d.iotDeviceId}
            renderItem={({ item }) => (
              <View className="bg-white rounded-xl p-4 mb-3">
                <View className="flex-row justify-between items-start">
                  <View style={{ flex: 1 }}>
                    <Text className="font-semibold text-base">{item.deviceName}</Text>
                    <Text className="text-xs text-gray-500 mt-1">{item.iotDeviceType} • {item.connectionMethod}</Text>
                    <Text className="text-xs text-gray-500 mt-1">ID: {item.deviceIdentifier}</Text>
                  </View>
                  <View className="items-end">
                    <Text className="font-semibold text-sm {item.status === 'CONNECTED' ? 'text-green-600' : 'text-gray-600'}">{item.status ?? 'UNKNOWN'}</Text>
                    <Text className="text-xs text-gray-400 mt-1">{item.lastSyncAt ? new Date(item.lastSyncAt).toLocaleString() : ''}</Text>
                  </View>
                </View>
              </View>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

export default MyDevicesScreen;
