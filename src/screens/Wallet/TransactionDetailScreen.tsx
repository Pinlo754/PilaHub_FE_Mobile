import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ActivityIndicator, ScrollView, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { getTransactionById } from '../../services/transaction';

type Props = NativeStackScreenProps<RootStackParamList, 'TransactionDetail'>;

const TYPE_LABELS: Record<string, string> = {
  WALLET_TOP_UP: 'Nạp ví',
  WALLET_WITHDRAWAL: 'Rút ví',
  SUBSCRIPTION_PACKAGE: 'Gói đăng ký',
  SUBSCRIPTION_PRORATION_REFUND: 'Hoàn tiền đăng ký',
  SUBSCRIPTION_UPGRADE: 'Nâng cấp đăng ký',
  REFUND: 'Hoàn tiền',
  COURSE: 'Khóa học',
  PENALTY: 'Phạt',
  BOOKING_COACH: 'Đặt huấn luyện',
  BOOKING_COACH_REFUND: 'Hoàn tiền đặt huấn luyện',
};

export default function TransactionDetailScreen({ route, navigation }: Props) {
  const { transactionId } = (route.params as any) ?? {};
  const [tx, setTx] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!transactionId) return;
    setLoading(true);
    try {
      const data = await getTransactionById(transactionId);
      setTx(data);
    } catch (err) {
      console.warn(err);
    } finally {
      setLoading(false);
    }
  }, [transactionId]);

  useEffect(() => {
    load().catch(() => {});
  }, [load]);

  if (loading) return (
    <View className="flex-1 items-center justify-center bg-background">
      <ActivityIndicator />
    </View>
  );

  if (!tx) return (
    <View className="flex-1 items-center justify-center bg-background">
      <Text className="text-gray-500">Không tìm thấy giao dịch</Text>
    </View>
  );

  const typeLabel = TYPE_LABELS[tx.transactionType] ?? tx.transactionType;
  const amount = tx.amount?.toLocaleString('vi-VN') ?? '-';
  const dateText = tx.transactionDate ? new Date(tx.transactionDate).toLocaleString('vi-VN') : '-';

  const badgeClass = tx.transactionType === 'WALLET_TOP_UP' ? 'bg-success' : tx.transactionType === 'WALLET_WITHDRAWAL' ? 'bg-danger' : 'bg-amber-400';

  return (
    <View className="flex-1 bg-background">
      <View className="flex-row items-center px-4 py-3 bg-white">
        <TouchableOpacity onPress={() => (navigation as any).goBack()} className="p-2">
          <Text className="text-2xl">←</Text>
        </TouchableOpacity>
        <Text className="flex-1 text-center text-lg font-bold">Chi tiết giao dịch</Text>
        <View className="w-8" />
      </View>

      <ScrollView className="p-4">
        <View className="bg-white rounded-xl p-4 shadow">
          <View className="flex-row justify-between items-start">
            <View className="flex-1 pr-3">
              <Text className="text-sm text-gray-500">Loại giao dịch</Text>
              <View className="flex-row items-center mt-2">
                <View className={`${badgeClass} px-3 py-1 rounded-full`}> 
                  <Text className="text-white text-xs font-semibold">{typeLabel}</Text>
                </View>
              </View>

              {tx.description ? (
                <Text className="text-gray-600 mt-3">{tx.description}</Text>
              ) : null}
            </View>

            <View className="items-end">
              <Text className="text-gray-400 text-sm">Số tiền</Text>
              <Text className="text-2xl font-extrabold text-success mt-1">{amount} ₫</Text>
            </View>
          </View>
        </View>

        <View className="mt-4 bg-white rounded-xl p-4 shadow">
          <Row label="Mã giao dịch" value={tx.transactionId} />
          <Row label="Thời gian" value={dateText} />
          <Row label="Reference" value={tx.referenceId ?? '-'} />
          <Row label="Account ID" value={tx.accountId ?? '-'} />
        </View>

       
      </ScrollView>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between items-center py-3 border-b border-gray-100">
      <Text className="text-sm text-gray-500">{label}</Text>
      <Text className="text-sm font-medium text-gray-700">{value}</Text>
    </View>
  );
}
