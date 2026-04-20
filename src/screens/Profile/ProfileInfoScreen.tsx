import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, Image, Pressable, ActivityIndicator, ScrollView, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { fetchTraineeProfile, fetchMyHealthProfiles, fetchMyInjuries, fetchInjuries, updateTraineeProfile } from '../../services/profile';
import { getAddresses, deleteAddress } from '../../services/address';
import ProfileEditModal from './components/ProfileEditModal';

export default function ProfileInfoScreen() {
  const nav = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any | null>(null);
  const [healthProfile, setHealthProfile] = useState<any | null>(null);
  const [addresses, setAddresses] = useState<any[] | null>(null);
  const [myInjuries, setMyInjuries] = useState<any[] | null>(null);
  const [_injuryLibrary, setInjuryLibrary] = useState<any[] | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<any>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const res = await fetchTraineeProfile();
        if (mounted && res.ok) setProfile(res.data ?? res);

        // fetch extra contextual info in parallel (don't block profile rendering)
        try {
          const [hpRes, addrRes, myInjRes, injLibRes] = await Promise.all([
            fetchMyHealthProfiles(),
            (async () => { try { return await getAddresses(); } catch { return null; } })(),
            fetchMyInjuries(),
            fetchInjuries(),
          ]);

          if (mounted) {
            if (hpRes && (hpRes as any).ok) {
              const hpData = (hpRes as any).data ?? (hpRes as any);
              if (Array.isArray(hpData) && hpData.length > 0) {
                const latest = hpData.find((p: any) => p.isLatest) ?? hpData[0];
                setHealthProfile(latest);
              }
            }

            if (Array.isArray(addrRes)) setAddresses(addrRes as any[]);

            if (myInjRes && (myInjRes as any).ok) setMyInjuries((myInjRes as any).data ?? (myInjRes as any));
            if (injLibRes && (injLibRes as any).ok) setInjuryLibrary((injLibRes as any).data ?? (injLibRes as any));
          }
        } catch (e) {
          console.warn('Failed to fetch extra profile info', e);
        }
      } catch (e) {
        console.warn('fetch profile', e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const avatar = profile?.avatarUrl ?? profile?.avatar ?? 'https://www.toponseek.com/wp-content/uploads/2024/07/celeb-la-gi-6.jpg';

  // helpers to display localized labels
  function mapWorkoutLevel(level?: string) {
    if (!level) return '-';
    switch (String(level).toUpperCase()) {
      case 'BEGINNER': return 'Người mới';
      case 'INTERMEDIATE': return 'Trung cấp';
      case 'ADVANCED': return 'Nâng cao';
      default: return String(level);
    }
  }

  function mapWorkoutFrequency(freq?: string) {
    if (!freq) return '-';
    switch (String(freq).toUpperCase()) {
      case 'SEDENTARY': return 'Ít vận động';
      case 'LIGHT': return 'Nhẹ';
      case 'MODERATE': return 'Vừa phải';
      case 'ACTIVE': return 'Năng động';
      case 'ATHLETE': return 'Chuyên nghiệp';
      default: return String(freq);
    }
  }

  function mapGender(g?: string) {
    if (!g) return '-';
    switch (String(g).toUpperCase()) {
      case 'MALE': return 'Nam';
      case 'FEMALE': return 'Nữ';
      case 'OTHER': return 'Khác';
      default: return String(g);
    }
  }

  // open edit modal and populate form
  function openEdit() {
    setForm({
      fullName: profile?.fullName ?? profile?.name ?? '',
      age: profile?.age ? String(profile.age) : '',
      gender: profile?.gender ?? '',
      avatarUrl: profile?.avatar ?? profile?.avatarUrl ?? '',
      workoutLevel: profile?.workoutLevel ?? '',
      workoutFrequency: profile?.workoutFrequency ?? '',
    });
    setEditing(true);
  }

  // save using current `form` state (ProfileEditModal calls onSave() without args)
  async function handleSave() {
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
        const updated = res.data ?? payload;
        setProfile((p: any) => ({ ...(p ?? {}), ...(updated ?? {}) }));
        Alert.alert('Cập nhật thành công', 'Thông tin cá nhân đã được cập nhật.', [{ text: 'OK', onPress: () => setEditing(false) }]);
      } else {
        Alert.alert('Cập nhật thất bại', res.error?.message || 'Đã xảy ra lỗi khi cập nhật thông tin.', [{ text: 'OK' }]);
      }
    } catch (e) {
      console.error('Failed to save profile', e);
      Alert.alert('Cập nhật thất bại', 'Đã xảy ra lỗi khi cập nhật thông tin.', [{ text: 'OK' }]);
    } finally {
      setSaving(false);
    }
  }

  // reload addresses helper (used after create/update/delete)
  async function loadAddresses() {
    try {
      const res = await getAddresses();
      if (Array.isArray(res)) setAddresses(res);
    } catch (e) {
      console.warn('loadAddresses failed', e);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async function handleDeleteAddress(addressId?: string) {
    if (!addressId) return;
    Alert.alert('Xóa địa chỉ', 'Bạn có chắc muốn xóa địa chỉ này?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Xóa', style: 'destructive', onPress: async () => {
        try {
          await deleteAddress(addressId);
          await loadAddresses();
        } catch (e) {
          console.error('delete address failed', e);
          Alert.alert('Lỗi', 'Xóa địa chỉ thất bại.');
        }
      } }
    ]);
  }

  return (
    <SafeAreaView className="flex-1 bg-[#FFFAF0]">
      <View className="flex-row items-center px-4 py-3">
        <Pressable onPress={() => nav.goBack()} className="w-10">
          <Text className="text-2xl text-amber-800">←</Text>
        </Pressable>
        <Text className="flex-1 text-center text-lg font-bold text-amber-900">Thông tin cá nhân</Text>
        <View className="w-10" />
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
        </View>
      ) : (
        <ScrollView className="px-4 pb-10">
          <View className="bg-white rounded-2xl p-6 items-center shadow-md">
            <Image source={{ uri: avatar }} className="w-28 h-28 rounded-full border-4 border-[#FFF5EB] -mt-6" />
            <Text className="text-2xl font-extrabold text-amber-800 mt-4">{profile?.fullName ?? profile?.name ?? 'Người dùng'}</Text>
            {profile?.email ? <Text className="text-sm text-slate-600 mt-1">{profile.email}</Text> : null}

            <View className="flex-row mt-4">
              <Pressable onPress={() => openEdit()} className="bg-amber-100 px-4 py-2 rounded-full mr-3">
                <Text className="text-amber-800 font-medium">Chỉnh sửa</Text>
              </Pressable>
              <Pressable onPress={() => {}} className="bg-white px-4 py-2 rounded-full border border-amber-200">
                <Text className="text-amber-800">Chia sẻ</Text>
              </Pressable>
            </View>

            {/* quick health + stats row */}
            {healthProfile || myInjuries ? (
              <View className="w-full mt-4 flex-row justify-between">
                <View className="flex-1 mx-1 bg-[#FFF6F0] rounded-lg py-3 items-center">
                  <Text className="text-xs text-amber-700 font-bold">Chiều cao</Text>
                  <Text className="text-lg text-slate-900 font-semibold mt-1">{healthProfile ? `${healthProfile.heightCm ?? healthProfile.height ?? '-'} cm` : '-'}</Text>
                </View>
                <View className="flex-1 mx-1 bg-[#FFF6F0] rounded-lg py-3 items-center">
                  <Text className="text-xs text-amber-700 font-bold">Cân nặng</Text>
                  <Text className="text-lg text-slate-900 font-semibold mt-1">{healthProfile ? `${healthProfile.weightKg ?? healthProfile.weight ?? '-'} kg` : '-'}</Text>
                </View>
                <View className="flex-1 mx-1 bg-[#FFF6F0] rounded-lg py-3 items-center">
                  <Text className="text-xs text-amber-700 font-bold">Chấn thương</Text>
                  <Text className="text-lg text-slate-900 font-semibold mt-1">{Array.isArray(myInjuries) ? String(myInjuries.length) : '-'}</Text>
                </View>
              </View>
            ) : null}
          </View>
 <View style={[styles.card, styles.personalCardFull]}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Thông tin cá nhân</Text>
              </View>
              <View style={styles.personalContent}>
                <Text style={styles.personalName}>{profile?.fullName ?? profile?.name ?? '-'}</Text>
                <View style={styles.personalRow}>
                  <View style={styles.field}><Text style={styles.fieldLabel}>Tuổi</Text><Text style={styles.fieldValue}>{profile?.age ?? '-'}</Text></View>
                  <View style={styles.field}><Text style={styles.fieldLabel}>Giới tính</Text><Text style={styles.fieldValue}>{mapGender(profile?.gender)}</Text></View>
                </View>
                <View style={styles.personalRow}>
                  <View style={styles.field}><Text style={styles.fieldLabel}>Chiều cao</Text><Text style={styles.fieldValue}>{healthProfile ? `${healthProfile.heightCm ?? healthProfile.height ?? '-'} cm` : '-'}</Text></View>
                  <View style={styles.field}><Text style={styles.fieldLabel}>Cân nặng</Text><Text style={styles.fieldValue}>{healthProfile ? `${healthProfile.weightKg ?? healthProfile.weight ?? '-'} kg` : '-'}</Text></View>
                </View>

                {/* workout info */}
                <View style={[styles.personalRow, { marginTop: 12 }]}>
                  <View style={styles.field}><Text style={styles.fieldLabel}>Cấp độ</Text><Text style={styles.fieldValue}>{mapWorkoutLevel(profile?.workoutLevel)}</Text></View>
                  <View style={styles.field}><Text style={styles.fieldLabel}>Tần suất</Text><Text style={styles.fieldValue}>{mapWorkoutFrequency(profile?.workoutFrequency)}</Text></View>
                </View>
              </View>
            </View>

            {/* Address card (full width) */}
            <View style={[styles.card, styles.addressCardFull]}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Địa chỉ</Text>
                <Pressable onPress={() => nav.navigate('AddressForm', { onSaved: loadAddresses })} style={styles.addIconBtn}>
                  <Text style={styles.addIconText}>＋</Text>
                </Pressable>
              </View>
              <View style={styles.addressContent}>
                {addresses && addresses.length > 0 ? (
                  <View>
                    <Text style={styles.addressLine}>{addresses.find((a: any) => a.isDefault)?.addressLine ?? addresses[0]?.addressLine ?? '-'}</Text>
                    <View style={styles.addressActions}>
                      <Pressable onPress={() => nav.navigate('AddressList', { onSaved: loadAddresses })} style={styles.smallBtn}>
                        <Text style={styles.smallBtnText}>Quản lý</Text>
                      </Pressable>
                      <Pressable onPress={() => nav.navigate('AddressForm', { onSaved: loadAddresses })} style={styles.smallBtn}>
                        <Text style={styles.smallBtnText}>Thêm</Text>
                      </Pressable>
                    </View>
                  </View>
                ) : (
                  <View style={styles.addressEmptyState}>
                    <Text style={styles.emptyText}>Bạn chưa có địa chỉ nào.</Text>
                    <Pressable onPress={() => nav.navigate('AddressForm', { onSaved: loadAddresses })} style={styles.centerAddBtn}>
                      <Text style={styles.centerAddBtnText}>Tạo địa chỉ</Text>
                    </Pressable>
                  </View>
                )}
              </View>
            </View>
          {/* medical info: redesigned */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Thông tin y tế</Text>
              {healthProfile ? (
                <Pressable onPress={() => nav.navigate('BodyMetricDetails')} style={styles.tagButton}>
                  <Text style={styles.tagButtonText}>Cập nhật số đo</Text>
                </Pressable>
              ) : (
                <Pressable onPress={() => nav.navigate('BodyScan')} style={styles.tagButton}>
                  <Text style={styles.tagButtonText}>Thêm số đo</Text>
                </Pressable>
              )}
            </View>

            {healthProfile ? (
              <View style={styles.metricsWrap}>
                <View style={styles.metricsRow}>
                  <View style={styles.metricBox}>
                    <Text style={styles.metricLabel}>BMI</Text>
                    <Text style={styles.metricValue}>{healthProfile.bmi ?? '-'}</Text>
                  </View>
                  <View style={styles.metricBox}>
                    <Text style={styles.metricLabel}>Tỷ lệ mỡ</Text>
                    <Text style={styles.metricValue}>{healthProfile.bodyFatPercentage ?? '-'}%</Text>
                  </View>
                </View>

                <View style={styles.metricsRow}>
                  <View style={styles.metricBox}>
                    <Text style={styles.metricLabel}>Khối cơ</Text>
                    <Text style={styles.metricValue}>{healthProfile.muscleMassKg ?? '-'} kg</Text>
                  </View>
                  <View style={styles.metricBox}>
                    <Text style={styles.metricLabel}>Eo / Hông</Text>
                    <Text style={styles.metricValue}>{(healthProfile.waistCm ?? '-') + ' / ' + (healthProfile.hipCm ?? '-')} cm</Text>
                  </View>
                </View>

                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Nguồn: <Text style={styles.metaValue}>{healthProfile.source ?? '-'}</Text></Text>
                  {healthProfile.createdAt ? (
                      <Text style={[styles.metaLabel, styles.metaLabelSpacing]}>Ngày đo: <Text style={styles.metaValue}>{new Date(healthProfile.createdAt).toLocaleDateString('vi-VN')}</Text></Text>
                    ) : null}
                </View>
              </View>
            ) : (
                <View style={styles.emptyWrap}>
                   <Text style={styles.emptyText}>Bạn chưa có số đo. Hãy thêm số đo để nhận phân tích chi tiết.</Text>
                 </View>
               )}

            {/* Personal info card (full width) */}
           
          </View>
          {/* Profile edit modal rendered inline */}
          <ProfileEditModal visible={editing} form={form} setForm={setForm} onClose={() => setEditing(false)} onSave={handleSave} saving={saving} />
         </ScrollView>
       )}
     </SafeAreaView>
   );
 }

 const styles = StyleSheet.create({
  contentPadding: { padding: 18, paddingBottom: 36 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: 'transparent' },
  headerLeft: { width: 40, alignItems: 'flex-start' },
  headerBack: { fontSize: 22, color: '#6B4226' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '700', color: '#4B2A17' },
  headerRight: { width: 40 },

  profileCard: { backgroundColor: '#fff', borderRadius: 20, padding: 20, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 12, elevation: 4 },
  avatar: { width: 112, height: 112, borderRadius: 56, borderWidth: 4, borderColor: '#FFF5EB', marginTop: -10 },
  nameText: { marginTop: 12, fontSize: 22, fontWeight: '800', color: '#C05621' },
  subtitleText: { marginTop: 6, fontSize: 13, color: '#6B6B6B' },
  profileActions: { flexDirection: 'row', marginTop: 12 },
  btnPrimary: { backgroundColor: '#FFEDD5', paddingHorizontal: 18, paddingVertical: 8, borderRadius: 999, marginRight: 10 },
  btnPrimaryText: { color: '#C05621', fontWeight: '700' },
  btnSecondary: { backgroundColor: '#fff', paddingHorizontal: 18, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: '#FDEBD8' },
  btnSecondaryText: { color: '#C05621' },

  statRow: { width: '100%', marginTop: 14, flexDirection: 'row', justifyContent: 'space-between' },
  statCard: { flex: 1, marginHorizontal: 6, backgroundColor: '#FFF6F0', borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  statLabel: { fontSize: 12, color: '#A0522D', fontWeight: '700' },
  statValue: { marginTop: 6, fontSize: 16, color: '#2B2B2B', fontWeight: '700' },

  card: { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginTop: 16, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 3 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 13, color: '#6B6B6B', fontWeight: '700' },
  tagButton: { backgroundColor: '#FFF3E0', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: '#FBD5B5' },
  tagButtonText: { color: '#C56A2A', fontSize: 12, fontWeight: '700' },

  metricsWrap: { marginTop: 12 },
  metricsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  metricBox: { flex: 1, marginHorizontal: 6, backgroundColor: '#FFF8F3', borderRadius: 10, padding: 12, alignItems: 'center',marginBottom: 12 },
  metricLabel: { fontSize: 12, color: '#C56A2A', fontWeight: '700' },
  metricValue: { marginTop: 6, fontSize: 16, color: '#2B2B2B', fontWeight: '800' },

  metaRow: { marginTop: 12 },
  metaLabel: { fontSize: 11, color: '#9CA3AF' },
  metaLabelSpacing: { marginTop: 6 },
  metaValue: { color: '#374151', fontWeight: '600' },
  emptyWrap: { marginTop: 12 },
  emptyText: { color: '#6B6B6B' },
  sectionSpacing: { marginTop: 12 },
  sectionTitle: { color: '#6B6B6B', fontSize: 13, marginBottom: 8, fontWeight: '700' },
  sectionValue: { color: '#374151' },
  addressWrap: { marginTop: 12 },

  /* new address block styles */
  addressCard: { marginTop: 12, padding: 14 },
  addressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  addIconBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#FFF3E0', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#FBD5B5' },
  addIconText: { color: '#C56A2A', fontSize: 18, fontWeight: '700' },
  addressItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#FAF4EF', marginTop: 6 },
  addressLine: { color: '#374151', fontSize: 14 },
  defaultBadge: { marginTop: 4, color: '#C05621', fontSize: 12, fontWeight: '700' },
  addressActionsRow: { flexDirection: 'row', alignItems: 'center' },
  smallBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: '#FFEDD5', marginLeft: 8 },
  smallBtnDanger: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: '#FFE6E0', marginLeft: 8 },
  smallBtnText: { color: '#C05621', fontWeight: '700' },
  manageBtn: { marginTop: 8, backgroundColor: '#fff', borderWidth: 1, borderColor: '#FBD5B5', padding: 10, borderRadius: 8, alignItems: 'center' },
  manageBtnText: { color: '#C05621', fontWeight: '700' },
  addressEmptyState: { marginTop: 8, alignItems: 'center' },
  centerAddBtn: { marginTop: 12, backgroundColor: '#FFEDD5', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 999 },
  centerAddBtnText: { color: '#C05621', fontWeight: '700' },
  rowTwoCards: { marginTop: 12, flexDirection: 'row' },
  personalCardFull: { width: '100%', marginTop: 12 },
  addressCardFull: { width: '100%', marginTop: 12 },
  personalContent: { marginTop: 8 },
  personalName: { fontSize: 16, fontWeight: '700', color: '#2B2B2B' },
  personalRow: { flexDirection: 'row', marginTop: 10 },
  field: { flex: 1 },
  fieldLabel: { color: '#6B6B6B' },
  fieldValue: { fontWeight: '700' },
  addressContent: { marginTop: 8 },
  addressActions: { flexDirection: 'row', marginTop: 10 },
 });
