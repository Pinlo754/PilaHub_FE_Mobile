import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, ActivityIndicator, Alert, StyleSheet, Pressable } from 'react-native';
import { getProfile } from '../../services/auth';
import { fetchTraineeProfile, updateTraineeProfile } from '../../services/profile';
import { fetchMyWallet } from '../../services/wallet';
import ProfileHeader from './components/ProfileHeader';
import StatsGrid from './components/StatsGrid';
import ActivityChart from './components/ActivityChart';
import SettingList from './components/SettingList';
import ProfileEditModal from './components/ProfileEditModal';
import { launchImageLibrary } from 'react-native-image-picker';
import PlanList from './components/PlanList';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';

const localStyles = StyleSheet.create({
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF6EE' },
  scrollPadding: { paddingBottom: 40 },
});

const TraineeProfileScreen: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<any>({});
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

  const openEdit = () => {
    setForm({
      fullName: profile?.fullName ?? profile?.name ?? '',
      age: profile?.age ? String(profile.age) : '',
      gender: profile?.gender ?? '',
      avatarUrl: profile?.avatar ?? profile?.avatarUrl ?? '',
      workoutLevel: profile?.workoutLevel ?? '',
      workoutFrequency: profile?.workoutFrequency ?? '',
    });
    setEditing(true);
  };

  const handleSave = async () => {
    if (!form.fullName || form.fullName.trim() === '') {
      Alert.alert('Lỗi', 'Vui lòng nhập họ tên.');
      return;
    }
    setSaving(true);
    try {
      const payload: any = { fullName: form.fullName };
      if (form.age) payload.age = Number(form.age);
      if (form.gender) payload.gender = form.gender;
      if (form.avatarUrl) payload.avatarUrl = form.avatarUrl;
      if (form.workoutLevel) payload.workoutLevel = form.workoutLevel;
      if (form.workoutFrequency) payload.workoutFrequency = form.workoutFrequency;

      const res = await updateTraineeProfile(payload);
      if (res.ok) {
        const updated = res.data ?? res;
        setProfile((p: any) => ({ ...(p ?? {}), ...(updated ?? {}) }));
        Alert.alert('Thành công', 'Cập nhật hồ sơ thành công');
        setEditing(false);
      } else {
        console.error('updateTraineeProfile error', res.error);
        Alert.alert('Lỗi', res.error?.message || 'Không thể cập nhật hồ sơ');
      }
    } catch (e: any) {
      console.error('updateTraineeProfile thrown', e);
      Alert.alert('Lỗi', e?.message || 'Không thể cập nhật hồ sơ');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarEdit = async () => {
    try {
      const res = await launchImageLibrary({ mediaType: 'photo', quality: 0.8 });
      if (res.didCancel) return;
      const asset = res.assets && res.assets[0];
      if (asset && asset.uri) {
        setForm((f:any)=> ({ ...f, avatarUrl: asset.uri }));
      }
    } catch (e) {
      console.warn('image-picker', e);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={localStyles.loadingWrap}>
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  const exercisesCount = profile?.exercisesCount ?? 42;
  const kcal = profile?.kcal ?? 3500;
  const streak = profile?.streak ?? 12;
  const level = profile?.level ?? 'Trung cấp';
  const weeklyMinutes = profile?.weeklyMinutes ?? 145;

  return (
    <SafeAreaView className="flex-1 bg-amber-50">
      <View className="flex-row items-center justify-between px-4 py-3 bg-white border-b border-gray-100">
        <Pressable onPress={() => (navigation as any).navigate('MainTabs')} className="p-2"><Text className="text-xl">‹</Text></Pressable>
        <Text className="text-lg font-semibold">Hồ sơ</Text>
        <View className="w-8" />
      </View>
      <ScrollView contentContainerStyle={localStyles.scrollPadding}>
        <ProfileHeader profile={profile} onEdit={openEdit} onAvatarPress={() => Alert.alert('Chi tiết', 'Mở trang chi tiết hồ sơ (hardcoded)')} onAvatarEdit={handleAvatarEdit} wallet={wallet} walletLoading={walletLoading} />

        <StatsGrid stats={{ exercisesCount, kcal, streak, level }} />

        <ActivityChart weeklyMinutes={weeklyMinutes} />

        <View className="px-4 mt-2">
          <View className="mt-3 bg-white rounded-xl p-4 shadow">
            <View className="flex-row justify-between items-start">
              <View>
                <Text className="font-semibold text-lg">Kế hoạch tập luyện</Text>
                <Text className="text-gray-500 mt-1">Tùy chỉnh lịch và bài tập phù hợp với mục tiêu</Text>
              </View>
              <Pressable className="bg-amber-100 px-3 py-2 rounded-full">
                <Text className="text-amber-800">Tạo mới</Text>
              </Pressable>
            </View>

            <PlanList plans={[{ title: 'Lộ trình giảm mỡ 8 tuần', subtitle: '3 buổi/tuần — Tập trung core & cardio', sessions: '3 buổi/tuần', duration: '8 tuần', frequency: '3 lần/tuần', coach: 'Coach An' }]} onOpen={(p)=> Alert.alert('Mở kế hoạch', JSON.stringify(p))} />

            <Pressable className="mt-4" onPress={() => (navigation as any).navigate('BodyMetricDetails')}>
               <View className="bg-amber-50 rounded-lg p-4 shadow">
                 <View className="flex-row justify-between items-center">
                   <View>
                     <Text className="font-semibold">Thông tin cơ thể của bạn</Text>
                     <Text className="text-sm text-gray-500 mt-1">Xem chi tiết số đo đã lưu</Text>
                   </View>
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

          <View className="mt-3 bg-white rounded-xl p-4 shadow">
            <Text className="font-semibold text-lg">Sản phẩm yêu thích</Text>
            <Text className="text-gray-500 mt-1">Bạn chưa thích sản phẩm nào</Text>
          </View>

          <SettingList profile={profile} />
        </View>

      </ScrollView>

      <ProfileEditModal visible={editing} form={form} setForm={setForm} onClose={() => setEditing(false)} onSave={handleSave} saving={saving} />
    </SafeAreaView>
  );
};

export default TraineeProfileScreen;