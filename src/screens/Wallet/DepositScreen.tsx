import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { createWalletDeposit, fetchMyWallet } from '../../services/wallet';

export default function DepositScreen() {
  const navigation = useNavigation<any>();
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('Nạp tiền vào ví');
  const [loading, setLoading] = useState(false);
  const [wallet, setWallet] = useState<any | null>(null);

  const quickAmounts = [50000, 100000, 200000, 500000];

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetchMyWallet();
        if (!mounted) return;
        if (res.ok) setWallet(res.data);
      } catch (e) {
        console.warn('fetch wallet in deposit', e);
      }
    })();
    return () => { mounted = false; };
  }, []);

  async function submit() {
    const cleaned = Number((amount || '').toString().replace(/[^0-9]/g, '')) || 0;
    const min = 10000;
    if (!cleaned || cleaned < min) {
      Alert.alert('Lỗi', `Số tiền nạp tối thiểu là ${min.toLocaleString('vi-VN')}₫`);
      return;
    }

    setLoading(true);
    try {
      const res = await createWalletDeposit(cleaned, description || 'Nạp tiền vào ví');
      if (!res.ok) {
        Alert.alert('Lỗi', res.error?.message ?? 'Không thể tạo URL thanh toán');
        return;
      }

      const d: any = res.data ?? {};
      const paymentUrl = d.paymentUrl ?? d.payment_url ?? d.url ?? d.paymentUrl;
      const transactionId = d.transactionId ?? d.transaction_id ?? d.transactionId;
      const orderCode = d.orderCode ?? d.order_code ?? d.orderCode;

      if (!paymentUrl) {
        Alert.alert('Lỗi', 'Server không trả về URL thanh toán');
        return;
      }

      navigation.navigate('DepositWebView', { paymentUrl, transactionId, orderCode });
    } catch {
      console.warn('deposit err');
      Alert.alert('Lỗi', 'Không thể tạo giao dịch nạp tiền');
    } finally {
      setLoading(false);
    }
  }

  function applyQuick(a: number) {
    setAmount(a.toLocaleString('vi-VN'));
  }

  function formatInput(value: string) {
    const cleaned = value.replace(/[^0-9]/g, '');
    if (!cleaned) return '';
    try {
      const n = Number(cleaned);
      return n.toLocaleString('vi-VN');
    } catch (e) {
      return cleaned;
    }
  }

  // bind to TextInput
  function onChangeAmount(text: string) {
    setAmount(formatInput(text));
  }

  // compute cleaned numeric amount and whether the button should be enabled
  const DISPLAY_CLEANED = Number((amount || '').toString().replace(/[^0-9]/g, '')) || 0;
  const MIN_DEPOSIT = 10000;
  const canSubmit = DISPLAY_CLEANED >= MIN_DEPOSIT && !loading;

  return (
    <View className="flex-1 bg-[#FFFAF0] p-6">
      <View className="flex-row items-center mb-6">
        <TouchableOpacity onPress={() => navigation.goBack()} >
          <Text className="text-lg">←</Text>
        </TouchableOpacity>
        <Text className="flex-1 text-center text-lg font-bold">Nạp tiền</Text>
        <View className="w-8" />
      </View>

      <View className="bg-white rounded-xl p-4 shadow mb-4">
        <Text className="text-sm text-gray-500">Số dư khả dụng</Text>
        <Text className="text-2xl font-bold text-green-600 mt-1">{new Intl.NumberFormat('vi-VN').format(wallet?.availableVND ?? wallet?.available ?? 0)}₫</Text>

        <Text className="text-sm text-gray-500 mt-4">Số tiền</Text>
        <TextInput value={amount} onChangeText={onChangeAmount} keyboardType="numeric" className="border border-gray-200 rounded p-3 bg-white text-lg mt-2" placeholder="10,000" />

        <View className="flex-row mt-3 space-x-2">
          {quickAmounts.map(a => (
            <TouchableOpacity key={a} onPress={() => applyQuick(a)} className="px-3 py-2 mr-2 bg-gray-100 rounded">
              <Text className="text-sm">{(a).toLocaleString('vi-VN')}₫</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text className="text-xs text-gray-400 mt-3">Số tiền nạp tối thiểu: 10,000₫</Text>
      </View>

      <View className="mb-4">
        <Text className="text-sm text-gray-500 mb-1">Mô tả (tùy chọn)</Text>
        <TextInput value={description} onChangeText={setDescription} className="border border-gray-200 rounded p-3 bg-white" />
      </View>

      <View className="mt-4">
        <TouchableOpacity
          onPress={submit}
          disabled={!canSubmit}
          className={`py-3 rounded-lg items-center ${canSubmit ? 'bg-teal-500' : 'bg-gray-300'}`}
        >
          {loading ? (
            <ActivityIndicator color={canSubmit ? 'white' : '#6b7280'} />
          ) : (
            <Text className={`${canSubmit ? 'text-white' : 'text-gray-600'} font-semibold`}>Tiếp tục</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
