import React, { useCallback, useEffect, useState } from 'react';
import {
  Pressable,
  Image,
  Text,
  View,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { fetchMyWallet, openMyWallet } from '../../../services/wallet';
import { getMyActiveSubscription } from '../../../hooks/apiClient';
import ModalPopup from '../../../components/ModalPopup';

type Props = {
  profile: any;
  onEdit: () => void;
  onAvatarPress?: () => void;
  onAvatarEdit?: () => void;
  wallet?: any;
  walletLoading?: boolean;
};

export default function ProfileHeader({
  profile,
  onEdit,
  onAvatarPress,
  onAvatarEdit,
  wallet,
  walletLoading,
}: Props) {
  const navigation = useNavigation<any>();

  const [walletInternal, setWalletInternal] = useState<any | null>(null);
  const [walletLoadingInternal, setWalletLoadingInternal] =
    useState<boolean>(false);

  const [activeSub, setActiveSub] = useState<any | null>(null);
  const [subLoading, setSubLoading] = useState<boolean>(false);

  const [openingWallet, setOpeningWallet] = useState<boolean>(false);
  const [modalProps, setModalProps] = useState<any>({
    visible: false,
    mode: 'noti',
  });

  const avatar =
    profile?.avatar ??
    profile?.avatarUrl ??
    'https://sangkienvietnam.org/wp-content/uploads/2023/11/avatar-placeholder.gif';

  const name = profile?.fullName ?? profile?.name ?? 'Nguyễn Văn A';

  const activeWallet = wallet ?? walletInternal;
  const activeWalletLoading = walletLoading ?? walletLoadingInternal;

  const walletBalance = activeWallet
    ? activeWallet.balanceVND ?? activeWallet.balance ?? null
    : profile?.walletBalance ?? null;

  const showModal = (props: any) => {
    setModalProps({
      ...props,
      visible: true,
    });
  };

  const closeModal = () => {
    setModalProps((prev: any) => ({
      ...prev,
      visible: false,
    }));
  };

  const loadWallet = useCallback(async () => {
    if (wallet) return;

    setWalletLoadingInternal(true);

    try {
      const res = await fetchMyWallet();

      if (res?.ok) {
        setWalletInternal(res.data ?? res);
      } else {
        setWalletInternal(null);
      }
    } catch (err) {
      console.warn('fetchMyWallet failed', err);
      setWalletInternal(null);
    } finally {
      setWalletLoadingInternal(false);
    }
  }, [wallet]);

  const loadActiveSubscription = useCallback(async () => {
    setSubLoading(true);

    try {
      const sub = await getMyActiveSubscription();
      setActiveSub(sub ?? null);
    } catch (err) {
      console.warn('getMyActiveSubscription failed', err);
      setActiveSub(null);
    } finally {
      setSubLoading(false);
    }
  }, []);

  const reloadHeaderData = useCallback(async () => {
    await Promise.all([loadWallet(), loadActiveSubscription()]);
  }, [loadWallet, loadActiveSubscription]);

  /**
   * Quan trọng:
   * Mỗi lần màn hình Profile được focus lại,
   * ví và gói subscription sẽ được fetch lại.
   */
  useFocusEffect(
    useCallback(() => {
      reloadHeaderData();

      return () => {};
    }, [reloadHeaderData]),
  );

  /**
   * Giữ lại useEffect này để khi component mount lần đầu
   * vẫn có dữ liệu nếu focus chưa chạy kịp.
   */
  useEffect(() => {
    reloadHeaderData();
  }, [reloadHeaderData]);

  const handleOpenWallet = async () => {
    setOpeningWallet(true);

    try {
      const res = await openMyWallet();

      if (res.ok) {
        await loadWallet();

        showModal({
          mode: 'noti',
          titleText: 'Thành công',
          contentText: 'Ví đã được mở',
          onClose: closeModal,
        });
      } else {
        showModal({
          mode: 'noti',
          titleText: 'Lỗi',
          contentText: res.error?.message || 'Không thể mở ví',
          onClose: closeModal,
        });
      }
    } catch (e) {
      console.warn('openMyWallet failed', e);

      showModal({
        mode: 'noti',
        titleText: 'Lỗi',
        contentText: 'Có lỗi khi mở ví',
        onClose: closeModal,
      });
    } finally {
      setOpeningWallet(false);
    }
  };

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
      case 'PRO':
        return '#F59E0B';
      case 'COACH':
        return '#10B981';
      case 'BASIC':
        return '#6B7280';
      default:
        return '#F59E0B';
    }
  };

  return (
    <View className="bg-amber-50 pb-6">
      <View className="items-center pt-8">
        <View className="relative">
          <Pressable
            onPress={onAvatarPress}
            className="w-32 h-32 rounded-full overflow-hidden bg-white shadow-lg"
          >
            <Image source={{ uri: avatar }} className="w-full h-full" />
          </Pressable>

          <Pressable
            onPress={onAvatarEdit}
            className="absolute right-0 bottom-0 w-10 h-10 rounded-full bg-amber-700 items-center justify-center shadow"
            style={{
              transform: [{ translateX: 6 }, { translateY: 6 }],
            }}
          >
            <Text className="text-white font-bold">📷</Text>
          </Pressable>
        </View>

        <Text className="mt-4 text-2xl font-extrabold text-amber-700">
          {name}
        </Text>

        {subLoading ? (
          <ActivityIndicator style={{ marginTop: 8 }} color="#92400E" />
        ) : activeSub ? (
          <View style={localStyles.packageInfoWrap}>
            <Text style={localStyles.packageLabel}>
              Gói hiện tại:{' '}
              <Text
                style={[
                  localStyles.packageName,
                  {
                    color: packageColorFor(
                      activeSub.subscribedPackage?.packageType,
                    ),
                  },
                ]}
              >
                {activeSub.subscribedPackage?.packageName ?? 'Đang hoạt động'}
              </Text>
            </Text>

            <Text style={localStyles.packageDate}>
              Từ {formatDate(activeSub.startDate)} — Đến{' '}
              {formatDate(activeSub.endDate)}
            </Text>
          </View>
        ) : null}

        <Pressable
          onPress={onEdit}
          className="mt-3 px-4 py-2 rounded-full border border-amber-200 bg-amber-100"
        >
          <Text className="text-amber-800 font-medium">Nâng cấp</Text>
        </Pressable>

        <View className="mt-5 bg-white rounded-xl px-5 py-3 w-11/12 flex-row justify-between items-center shadow">
          <View>
            <Text className="text-xs text-gray-500">Số dư ví</Text>

            {activeWalletLoading ? (
              <ActivityIndicator />
            ) : walletBalance != null ? (
              <Text className="text-lg font-semibold">
                {new Intl.NumberFormat('vi-VN').format(walletBalance)}₫
              </Text>
            ) : (
              <Text className="text-lg font-semibold">
                {profile?.walletBalance ?? '0'}₫
              </Text>
            )}
          </View>

          {activeWallet ? (
            <Pressable
              onPress={() => navigation.navigate('Wallet')}
              className="px-3 py-1 rounded-full bg-amber-100 border border-amber-200"
              accessibilityRole="button"
              accessibilityLabel="Xem chi tiết ví"
            >
              <Text className="text-amber-800 font-medium">Xem chi tiết</Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={handleOpenWallet}
              disabled={openingWallet}
              className="px-3 py-1 rounded-full bg-amber-100 border border-amber-200"
              accessibilityRole="button"
              accessibilityLabel="Mở ví"
            >
              {openingWallet ? (
                <ActivityIndicator color="#92400E" />
              ) : (
                <Text className="text-amber-800 font-medium">Mở ví</Text>
              )}
            </Pressable>
          )}
        </View>
      </View>

      <ModalPopup {...(modalProps as any)} />
    </View>
  );
}

const localStyles = StyleSheet.create({
  packageInfoWrap: {
    marginTop: 6,
    alignItems: 'center',
  },
  packageLabel: {
    color: '#374151',
    fontSize: 14,
  },
  packageName: {
    fontWeight: '700',
  },
  packageDate: {
    color: '#6B7280',
    fontSize: 12,
    marginTop: 4,
  },
});