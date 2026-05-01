import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, ActivityIndicator, StyleSheet, Pressable } from 'react-native';
import { getProfile } from '../../services/auth';
import { fetchTraineeProfile } from '../../services/profile';
import { fetchMyWallet } from '../../services/wallet';
import ProfileHeader from './components/ProfileHeader';

import SettingList from './components/SettingList';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@react-native-vector-icons/ionicons';
const localStyles = StyleSheet.create({
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF6EE' },
  scrollPadding: { paddingBottom: 40 },
  chevronWrap: { width: 28, alignItems: 'flex-end', justifyContent: 'center', paddingRight: 2 },
});

const TraineeProfileScreen: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [wallet, setWallet] = useState<any | null>(null);
  const [walletLoading, setWalletLoading] = useState(true);
  const navigation = useNavigation();

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // Prefer server trainee profile
        const t = await fetchTraineeProfile();
        if (t.ok && mounted) {
          setProfile(t.data ?? {});
        } else {
          const me = await getProfile();
          if (me.ok && mounted) setProfile(me.data ?? {});
        }
      } catch {
        // fallback to basic profile from getProfile
        try {
          const me = await getProfile();
          if (me.ok && mounted) setProfile(me.data ?? {});
        } catch {
          // ignore
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    // fetch wallet separately
    (async () => {
      try {
        setWalletLoading(true);
        const w = await fetchMyWallet();
        if (mounted) {
          if (w.ok) setWallet(w.data ?? w);
          else setWallet(null);
        }
      } catch {
        if (mounted) setWallet(null);
      } finally {
        if (mounted) setWalletLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={localStyles.loadingWrap}>
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-amber-50">
      <View className="flex-row items-center px-4 py-3 bg-white border-b border-gray-100">
        <View className="w-8" />
        <View className="flex-1 items-center">
          <Text className="text-lg font-semibold">Hồ sơ</Text>
        </View>
        <View className="w-8" />
      </View>
      <ScrollView contentContainerStyle={localStyles.scrollPadding}>
        {/* Pass edit action to navigate to UpgradePlan (removing inline edit modal) */}
        <ProfileHeader profile={profile} onEdit={() => (navigation as any).navigate('UpgradePlan')} onAvatarPress={() => (navigation as any).navigate('ProfileDetail')} wallet={wallet} walletLoading={walletLoading} />
        <View className="px-4 ">
          <View className="mt-3 bg-white rounded-xl p-4 shadow">
            <Pressable onPress={() => (navigation as any).navigate('BodyMetricDetails')}>
              <View className="flex-row justify-between items-center">
                <View>
                  <Text className="font-semibold">Thông tin cơ thể của bạn</Text>
                  <Text className="text-sm text-gray-500 mt-1">Xem chi tiết số đo đã lưu</Text>
                </View>
                <View style={localStyles.chevronWrap}>
                  <Ionicons name="chevron-forward" size={20} color="#A0522D" />
                </View>
              </View>
            </Pressable>
          </View>

          <Pressable className="mt-3" onPress={() => (navigation as any).navigate('Orders')}>
            <View className="bg-white rounded-xl p-4 shadow">
              <Text className="font-semibold text-lg">Đơn hàng của tôi</Text>
              <Text className="text-gray-500 mt-1">Xem và theo dõi đơn hàng của bạn</Text>
            </View>
          </Pressable>

          <Pressable className="mt-3" onPress={() => (navigation as any).navigate('MyInjuries')}>
            <View className="bg-white rounded-xl p-4 shadow">
              <Text className="font-semibold text-lg">Chấn thương của tôi</Text>
              <Text className="text-gray-500 mt-1">Xem chấn thương và ghi chú cá nhân</Text>
            </View>
          </Pressable>

          <SettingList profile={profile} />
        </View>

      </ScrollView>

    </SafeAreaView>
  );
};

export default TraineeProfileScreen;