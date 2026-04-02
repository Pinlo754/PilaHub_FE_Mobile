import React, { useEffect, useState } from 'react';
import { Pressable, Image, Text, View, ActivityIndicator, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { fetchMyWallet } from '../../../services/wallet';
import { getMyActiveSubscription } from '../../../hooks/apiClient';

type Props = {
  profile: any;
  onEdit: () => void;
  onAvatarPress?: () => void;
  onAvatarEdit?: () => void;
  wallet?: any;
  walletLoading?: boolean;
};

export default function ProfileHeader({ profile, onEdit, onAvatarPress, onAvatarEdit, wallet, walletLoading }: Props) {
  const navigation = useNavigation<any>();
  const [walletInternal, setWalletInternal] = useState<any | null>(null);
  const [walletLoadingInternal, setWalletLoadingInternal] = useState<boolean>(false);
  const avatar = profile?.avatar ?? profile?.avatarUrl ?? 'https://www.toponseek.com/wp-content/uploads/2024/07/celeb-la-gi-6.jpg';
  const name = profile?.fullName ?? profile?.name ?? 'Nguyễn Văn A';
  // prefer external props if provided, otherwise use internal fetched wallet
  const activeWallet = wallet ?? walletInternal;
  const activeWalletLoading = walletLoading ?? walletLoadingInternal;
  const walletBalance = activeWallet ? (activeWallet.balanceVND ?? activeWallet.balance ?? null) : (profile?.walletBalance ?? null);
  const walletAvailable = activeWallet ? (activeWallet.availableVND ?? activeWallet.available ?? null) : null;
  const walletLocked = activeWallet ? (activeWallet.lockedVND ?? activeWallet.locked ?? null) : null;

  const [activeSub, setActiveSub] = useState<any | null>(null);

  useEffect(() => {
    let mounted = true;
    // only fetch if parent didn't provide wallet
    if (wallet) return;

    (async () => {
      setWalletLoadingInternal(true);
      try {
        const res = await fetchMyWallet();
        if (!mounted) return;
        if (res.ok) setWalletInternal(res.data ?? res);
        else setWalletInternal(null);
      } catch (err) {
        console.warn('fetchMyWallet failed', err);
        if (mounted) setWalletInternal(null);
      } finally {
        if (mounted) setWalletLoadingInternal(false);
      }
    })();

    return () => { mounted = false; };
  }, [wallet]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const sub = await getMyActiveSubscription();
        if (!mounted) return;
        setActiveSub(sub ?? null);
      } catch (err) {
        console.warn('getMyActiveSubscription failed', err);
        if (mounted) setActiveSub(null);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const formatDate = (d?: string | null) => {
    if (!d) return '';
    try {
      const dt = new Date(d);
      return new Intl.DateTimeFormat('vi-VN').format(dt);
    } catch (e) {
      return d?.slice(0, 10) ?? '';
    }
  };

  const packageColorFor = (type?: string | null) => {
    switch ((type || '').toUpperCase()) {
      case 'PRO': return '#F59E0B';
      case 'COACH': return '#10B981';
      case 'BASIC': return '#6B7280';
      default: return '#F59E0B';
    }
  };

  return (
    <View className="bg-amber-50 pb-6">
      <View className="items-center pt-8">
        <View className="relative">
          <Pressable onPress={onAvatarPress} className="w-32 h-32 rounded-full overflow-hidden bg-white shadow-lg">
            <Image source={{ uri: avatar }} className="w-full h-full"/>

            {/* badge removed as requested */}
          </Pressable>

          {/* edit icon overlay */}
          <Pressable onPress={onAvatarEdit} className="absolute right-0 bottom-0 w-10 h-10 rounded-full bg-amber-700 items-center justify-center shadow" style={{ transform: [{ translateX: 6 }, { translateY: 6 }] }}>
            <Text className="text-white font-bold">📷</Text>
          </Pressable>
        </View>

        <Text className="mt-4 text-2xl font-extrabold text-amber-700">{name}</Text>

        {/* package info under name */}
        {activeSub && (
          <View style={localStyles.packageInfoWrap}>
            <Text style={localStyles.packageLabel}>Gói hiện tại: <Text style={[localStyles.packageName, { color: packageColorFor(activeSub.subscribedPackage?.packageType) }]}>{activeSub.subscribedPackage?.packageName ?? 'Đang hoạt động'}</Text></Text>
            <Text style={localStyles.packageDate}>Từ {formatDate(activeSub.startDate)} — Đến {formatDate(activeSub.endDate)}</Text>
          </View>
        )}

        <Pressable onPress={onEdit} className="mt-3 px-4 py-2 rounded-full border border-amber-200 bg-amber-100">
          <Text className="text-amber-800 font-medium">Chỉnh sửa</Text>
        </Pressable>

        <View className="mt-5 bg-white rounded-xl px-5 py-3 w-11/12 flex-row justify-between items-center shadow">
          <View>
            <Text className="text-xs text-gray-500">Số dư ví</Text>
            {activeWalletLoading ? (
              <ActivityIndicator />
            ) : walletBalance != null ? (
              <Text className="text-lg font-semibold">{new Intl.NumberFormat('vi-VN').format(walletBalance)}₫</Text>
            ) : (
              <Text className="text-lg font-semibold">{profile?.walletBalance ?? '0'}₫</Text>
            )}
            {wallet && (
              <Text className="text-xs text-gray-500">Khả dụng: {new Intl.NumberFormat('vi-VN').format(walletAvailable ?? 0)}₫</Text>
            )}
            {wallet && (
              <Text className="text-xs text-gray-500">Khóa: {new Intl.NumberFormat('vi-VN').format(walletLocked ?? 0)}₫</Text>
            )}
          </View>

          <Pressable
            onPress={() => navigation.navigate('Wallet')}
            className="px-3 py-1 rounded-full bg-amber-100 border border-amber-200"
            accessibilityRole="button"
            accessibilityLabel="Xem chi tiết ví"
          >
            <Text className="text-amber-800 font-medium">Xem chi tiết</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const localStyles = StyleSheet.create({
  packageInfoWrap: { marginTop: 6, alignItems: 'center' },
  packageLabel: { color: '#374151', fontSize: 14 },
  packageName: { fontWeight: '700' },
  packageDate: { color: '#6B7280', fontSize: 12, marginTop: 4 },
});
