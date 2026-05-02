import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Ionicons from '@react-native-vector-icons/ionicons';

import { getMyIoTDevices } from '../../hooks/iotClient';
import ModalPopup from '../../components/ModalPopup';

const COLORS = {
  bg: '#FFF9F3',
  card: '#FFFFFF',
  text: '#0F172A',
  muted: '#64748B',
  primary: '#8B3F2D',
  accent: '#CD853F',
  border: '#F1E7DC',
  success: '#047857',
  successBg: '#ECFDF5',
  danger: '#B91C1C',
  dangerBg: '#FEE2E2',
  warning: '#C2410C',
  warningBg: '#FFEDD5',
  soft: '#FFF7ED',
};

function getDeviceStatusInfo(status?: string | null) {
  const normalized = String(status ?? '').toUpperCase();

  switch (normalized) {
    case 'CONNECTED':
    case 'ACTIVE':
    case 'ONLINE':
      return {
        label: 'Đang kết nối',
        bg: COLORS.successBg,
        color: COLORS.success,
        icon: 'checkmark-circle-outline',
      };

    case 'DISCONNECTED':
    case 'OFFLINE':
      return {
        label: 'Mất kết nối',
        bg: COLORS.dangerBg,
        color: COLORS.danger,
        icon: 'close-circle-outline',
      };

    case 'PENDING':
    case 'PAIRING':
      return {
        label: 'Đang ghép nối',
        bg: COLORS.warningBg,
        color: COLORS.warning,
        icon: 'time-outline',
      };

    default:
      return {
        label: status || 'Không rõ',
        bg: '#F1F5F9',
        color: COLORS.muted,
        icon: 'help-circle-outline',
      };
  }
}


function DeviceCard({ item }: { item: any }) {
  const statusInfo = getDeviceStatusInfo(item.status);

  return (
    <View className="bg-white rounded-3xl p-4 mb-3 border border-[#F1E7DC] shadow-sm">
      <View className="flex-row items-start">
        <View className="w-12 h-12 rounded-2xl bg-[#FFF7ED] items-center justify-center mr-3">
          <Ionicons name="hardware-chip-outline" size={24} color={COLORS.primary} />
        </View>

        <View className="flex-1">
          <Text className="text-[#0F172A] font-black text-base" numberOfLines={1}>
            {item.deviceName || 'Thiết bị chưa đặt tên'}
          </Text>

          <Text className="text-[#64748B] text-xs mt-1 font-semibold" numberOfLines={1}>
            {item.iotDeviceType || 'Thiết bị'} • {item.connectionMethod || 'Không rõ kết nối'}
          </Text>

          <View className="mt-3 bg-[#F8FAFC] rounded-2xl p-3">
            <View className="flex-row items-start">
              <Ionicons name="finger-print-outline" size={15} color={COLORS.muted} />
              <Text className="text-[#64748B] text-xs ml-2 flex-1" numberOfLines={2}>
                ID: {item.deviceIdentifier || item.iotDeviceId || '—'}
              </Text>
            </View>

            
          </View>
        </View>

        <View
          className="px-2.5 py-1.5 rounded-full flex-row items-center ml-2"
          style={{ backgroundColor: statusInfo.bg }}
        >
          <Ionicons name={statusInfo.icon as any} size={13} color={statusInfo.color} />
          <Text
            className="text-[10px] font-black ml-1"
            style={{ color: statusInfo.color }}
          >
            {statusInfo.label}
          </Text>
        </View>
      </View>
    </View>
  );
}

function EmptyDevices({ onAdd }: { onAdd: () => void }) {
  return (
    <View className="flex-1 items-center justify-center px-8">
      <View className="w-24 h-24 rounded-full bg-[#FFF7ED] items-center justify-center mb-5">
        <Ionicons name="hardware-chip-outline" size={46} color={COLORS.accent} />
      </View>

      <Text className="text-[#0F172A] text-xl font-black text-center">
        Chưa có thiết bị nào
      </Text>

      <Text className="text-[#64748B] text-sm text-center mt-2 leading-5">
        Thêm thiết bị IoT để theo dõi dữ liệu và đồng bộ với tài khoản của bạn.
      </Text>

      <TouchableOpacity
        onPress={onAdd}
        className="mt-6 px-5 py-3 rounded-2xl bg-[#8B3F2D] flex-row items-center"
      >
        <Ionicons name="add" size={18} color="#fff" />
        <Text className="text-white font-black ml-2">Thêm thiết bị</Text>
      </TouchableOpacity>
    </View>
  );
}

const MyDevicesScreen: React.FC = () => {
  const navigation = useNavigation<any>();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [devices, setDevices] = useState<any[]>([]);
  const [modalState, setModalState] = useState<any>({ visible: false, title: '', message: '' });

  const showModal = (opts: { title?: string; message: string; onConfirm?: () => void }) => {
    setModalState({
      visible: true,
      title: opts.title ?? '',
      message: opts.message,
      onConfirm: () => {
        try { setModalState((s:any) => ({ ...s, visible: false })); } catch {}
        if (opts.onConfirm) opts.onConfirm();
      },
    });
  };

  const closeModal = () => setModalState((s:any) => ({ ...s, visible: false }));

  const loadDevices = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);

    try {
      const res = await getMyIoTDevices();
      setDevices(Array.isArray(res) ? res : []);
    } catch (err) {
      console.warn('getMyIoTDevices failed', err);
      showModal({ title: 'Lỗi', message: 'Không thể tải danh sách thiết bị' });
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDevices(true);
  }, [loadDevices]);

  const onRefresh = async () => {
    setRefreshing(true);

    try {
      await loadDevices(false);
    } finally {
      setRefreshing(false);
    }
  };

  const goAddDevice = () => {
    navigation.navigate('DeviceScan');
  };

  return (
    <SafeAreaView className="flex-1 bg-[#FFF9F3]">
      <View className="px-4 pt-2 pb-4 border-b border-[#F1E7DC]">
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="w-[42px] h-[42px] rounded-full bg-white border border-[#F1E7DC] items-center justify-center"
          >
            <Ionicons name="arrow-back" size={22} color="#0F172A" />
          </TouchableOpacity>

          <View className="flex-1 mx-3">
            <Text className="text-[#0F172A] text-xl font-black">
              Thiết bị của tôi
            </Text>
            <Text className="text-[#64748B] text-xs mt-1 font-semibold">
              {devices.length > 0
                ? `${devices.length} thiết bị đã liên kết`
                : 'Quản lý thiết bị IoT'}
            </Text>
          </View>

          <TouchableOpacity
            onPress={goAddDevice}
            className="w-[42px] h-[42px] rounded-full bg-[#8B3F2D] items-center justify-center"
          >
            <Ionicons name="add" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator color={COLORS.primary} />
          <Text className="mt-3 text-[#64748B] font-semibold">
            Đang tải thiết bị...
          </Text>
        </View>
      ) : (
        <FlatList
          data={devices}
          keyExtractor={(item, index) =>
            String(item.iotDeviceId ?? item.deviceIdentifier ?? index)
          }
          renderItem={({ item }) => <DeviceCard item={item} />}
          contentContainerStyle={{
            padding: 16,
            paddingBottom: 32,
            flexGrow: devices.length === 0 ? 1 : undefined,
          }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={<EmptyDevices onAdd={goAddDevice} />}
          showsVerticalScrollIndicator={false}
        />
      )}
      <ModalPopup
        {...(modalState as any)}
        titleText={modalState.title}
        contentText={modalState.message}
        onClose={closeModal}
      />
    </SafeAreaView>
  );
};

export default MyDevicesScreen;