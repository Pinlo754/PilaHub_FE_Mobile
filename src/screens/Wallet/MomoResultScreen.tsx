import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import api from '../../hooks/axiosInstance';
import { fetchMyWallet } from '../../services/wallet';

export default function MomoResultScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { orderId, previousBalance } = route.params ?? {};

  const [checking, setChecking] = useState(false);
  const [status, setStatus] = useState<'PENDING' | 'SUCCESS' | 'FAILED'>('PENDING');
  const [message, setMessage] = useState<string | null>(null);

  const checkOnce = useCallback(async () => {
    setChecking(true);
    setMessage(null);
    try {
      if (orderId) {
        try {
          const res = await api.get('/wallet/momo/status', { params: { orderId } });
          const body = res.data?.data ?? res.data ?? res;
          const s = (body?.status ?? body?.state ?? body)?.toString?.()?.toUpperCase?.() ?? null;
          if (s === 'SUCCESS' || s === 'COMPLETED') {
            setStatus('SUCCESS');
            setMessage('Giao dịch được xác nhận thành công.');
            // navigate to DepositResult with server data
            navigation.replace('DepositResult', { success: true, data: { params: { ...(body?.params ?? {}), ...body, method: 'MoMo' } } });
            return true;
          }
          if (s === 'FAILED' || s === 'ERROR') {
            setStatus('FAILED');
            setMessage('Giao dịch xác định là thất bại.');
            navigation.replace('DepositResult', { success: false, data: { params: { ...(body?.params ?? {}), ...body, method: 'MoMo' } } });
            return true;
          }
          setMessage('Giao dịch chưa được xác nhận trên máy chủ.');
          return false;
        } catch (err) {
          // status endpoint not available or failed - fallback to wallet check
          console.warn('momo status endpoint failed', String(err));
        }
      }

      // fallback: check wallet balance if previousBalance provided or just refresh wallet
      const w = await fetchMyWallet();
      if (w.ok && w.data) {
        const current = Number(w.data?.balanceVND ?? w.data?.availableVND ?? 0) || 0;
        const prev = Number(previousBalance ?? 0) || 0;
        if (current > prev) {
          setStatus('SUCCESS');
          setMessage('Số dư ví đã tăng, giao dịch thành công.');
          navigation.replace('DepositResult', { success: true, data: { params: { transactionId: orderId, orderCode: orderId, method: 'MoMo' } } });
          return true;
        }
        setMessage('Số dư chưa thay đổi.');
      } else {
        setMessage('Không thể làm mới ví.');
      }

      return false;
    } catch (e) {
      console.warn('checkOnce error', e);
      setMessage('Lỗi khi kiểm tra trạng thái.');
      return false;
    } finally {
      setChecking(false);
    }
  }, [orderId, previousBalance, navigation]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // poll a few times (light polling)
      const attempts = 6;
      const delayMs = 3000;
      for (let i = 0; i < attempts && !cancelled; i++) {
        const ok = await checkOnce();
        if (ok) return;
        await new Promise(r => setTimeout(r, delayMs));
      }
      if (!cancelled) setMessage('Chưa có xác nhận. Vui lòng thử "Kiểm tra lại" hoặc quay về sau.');
    })();
    return () => { cancelled = true; };
  }, [checkOnce]);

  return (
    <View className="flex-1 bg-white p-6 justify-center">
      <View className="items-center">
        <Text className="text-xl font-semibold mb-4">Kết quả thanh toán MoMo</Text>
        {checking ? (
          <View className="items-center">
            <ActivityIndicator size="large" />
            <Text className="mt-3">Đang kiểm tra...</Text>
          </View>
        ) : (
          <View className="items-center">
            <Text className="text-center text-gray-700 mb-2">{message ?? 'Đang chờ xác nhận'}</Text>
            <View className="flex-row space-x-3 mt-4">
              <TouchableOpacity className="py-2 px-4 rounded bg-[#8B3A2C]" onPress={checkOnce} disabled={checking}>
                <Text className="text-white">Kiểm tra lại</Text>
              </TouchableOpacity>
              <TouchableOpacity className="py-2 px-4 rounded bg-gray-100" onPress={() => navigation.replace('Wallet')}>
                <Text>Quay về Ví</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}
