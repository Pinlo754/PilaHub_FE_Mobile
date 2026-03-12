import React, { useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, Share } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

export default function DepositResultScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { success = false, data = null } = route.params ?? {};

  // helper to safely read VNPay params or returned data
  const params = React.useMemo(() => (data && (data.params ?? data)) || {}, [data]);

  const txnId = useMemo(() => {
    return data?.transactionId ?? data?.transaction_id ?? params.vnp_TxnRef ?? params.vnp_TxnRef ?? params.transactionId ?? params.orderCode ?? '-';
  }, [data, params]);

  const amount = useMemo(() => {
    const amtRaw = Number(params.vnp_Amount ?? params.amount ?? params.vnpAmount ?? 0) || 0;
    if (!amtRaw) return '-';
    const normalized = amtRaw >= 1000000 && amtRaw % 100 === 0 ? Math.round(amtRaw / 100) : amtRaw; // VNPay sometimes sends amount*100
    return new Intl.NumberFormat('vi-VN').format(normalized) + '₫';
  }, [params]);

  const payDate = useMemo(() => {
    const raw = params.vnp_PayDate ?? params.payDate ?? params.vnp_PayDate ?? null;
    if (!raw) return '-';
    const s = String(raw);
    if (/^\d{14}$/.test(s)) {
      const y = s.slice(0, 4);
      const m = s.slice(4, 6);
      const d = s.slice(6, 8);
      const hh = s.slice(8, 10);
      const mm = s.slice(10, 12);
      return `${hh}:${mm}, ${d}/${m}/${y}`;
    }
    return String(raw);
  }, [params]);

  const method = useMemo(() => params.vnp_BankCode ?? params.vnp_CardType ?? params.method ?? 'VNPay', [params]);

  const onShare = useCallback(async () => {
    try {
      const text = `Giao dịch ${txnId}\nSố tiền: ${amount}\nThời gian: ${payDate}`;
      await Share.share({ message: text });
    } catch (e) {
      console.warn('share err', e);
    }
  }, [txnId, amount, payDate]);

  return (
    <View className="flex-1 bg-[#FFFAF0] p-6">
      <View className="flex-row items-center">
        <TouchableOpacity onPress={() => navigation.goBack()} className="bg-white p-2 rounded-full shadow">
          <Text className="text-lg">←</Text>
        </TouchableOpacity>
      </View>

      <View className="items-center mt-8">
        <View className={`w-24 h-24 rounded-full items-center justify-center ${success ? 'bg-gradient-to-br from-green-400 to-green-600' : 'bg-red-400'} shadow-lg`}>
          <Text className="text-3xl text-white">{success ? '✓' : '✕'}</Text>
        </View>

        <Text className="text-2xl font-bold mt-5 text-[#8B3A2C]">{success ? 'Thanh toán thành công!' : 'Thanh toán thất bại'}</Text>
        <Text className="text-center text-gray-600 mt-3 px-6">
          {success
            ? 'Giao dịch của bạn đã được xử lý thành công. Cảm ơn bạn đã sử dụng dịch vụ.'
            : 'Giao dịch không hoàn tất. Vui lòng thử lại hoặc liên hệ bộ phận hỗ trợ.'}
        </Text>
      </View>

      <View className="bg-white rounded-xl p-4 mt-6 shadow">
        <View className="flex-row justify-between items-center py-2">
          <Text className="text-sm text-gray-500">Mã giao dịch</Text>
          <Text className="text-sm font-semibold text-gray-800">{txnId ?? '-'}</Text>
        </View>

        <View className="flex-row justify-between items-center py-2">
          <Text className="text-sm text-gray-500">Thời gian</Text>
          <Text className="text-sm text-gray-800">{payDate ?? '-'}</Text>
        </View>

        <View className="flex-row justify-between items-center py-2">
          <Text className="text-sm text-gray-500">Phương thức</Text>
          <Text className="text-sm text-gray-800">{method}</Text>
        </View>

        <View className="border-t border-gray-100 pt-4 mt-2">
          <Text className="text-sm text-gray-500">Tổng tiền</Text>
          <Text className="text-xl font-bold text-green-600 mt-1">{amount}</Text>
        </View>
      </View>

      <View className="mt-6 space-y-3">
        <TouchableOpacity className="py-3 rounded-lg bg-amber-300 items-center">
          <Text className="font-semibold">Tải xuống hóa đơn</Text>
        </TouchableOpacity>

        <TouchableOpacity className="py-3 rounded-lg bg-gray-100 items-center" onPress={onShare}>
          <Text className="font-semibold">Chia sẻ giao dịch</Text>
        </TouchableOpacity>
      </View>

      <View className="flex-1 justify-end mb-6">
        <TouchableOpacity className="py-3 rounded-lg bg-[#8B3A2C] items-center" onPress={() => navigation.replace('Wallet')}>
          <Text className="text-white font-semibold">Quay về Ví</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
