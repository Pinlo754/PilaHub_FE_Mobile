import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import ModalPopup from '../../components/ModalPopup';

import {
  fetchTraineeProfile,
  fetchMyHealthProfiles,
  fetchMyInjuries,
  fetchInjuries,
  updateTraineeProfile,
} from '../../services/profile';
import { getAddresses } from '../../services/address';
import ProfileEditModal from './components/ProfileEditModal';

const COLORS = {
  bg: '#FFF9F3',
  text: '#0F172A',
  muted: '#64748B',
  primary: '#8B3F2D',
  accent: '#CD853F',
  border: '#F1E7DC',
  success: '#047857',
  successBg: '#ECFDF5',
  warning: '#C2410C',
  warningBg: '#FFEDD5',
  danger: '#B91C1C',
  dangerBg: '#FEE2E2',
};

const defaultAvatar =
  'https://www.toponseek.com/wp-content/uploads/2024/07/celeb-la-gi-6.jpg';

function safeValue(value: any, suffix = '') {
  if (value === null || value === undefined || value === '') return '-';
  return `${value}${suffix}`;
}

function mapWorkoutLevel(level?: string) {
  if (!level) return '-';

  switch (String(level).toUpperCase()) {
    case 'BEGINNER':
      return 'Người mới';
    case 'INTERMEDIATE':
      return 'Trung cấp';
    case 'ADVANCED':
      return 'Nâng cao';
    default:
      return String(level);
  }
}

function mapWorkoutFrequency(freq?: string) {
  if (!freq) return '-';

  switch (String(freq).toUpperCase()) {
    case 'SEDENTARY':
      return 'Ít vận động';
    case 'LIGHT':
      return 'Nhẹ';
    case 'MODERATE':
      return 'Vừa phải';
    case 'ACTIVE':
      return 'Năng động';
    case 'ATHLETE':
      return 'Chuyên nghiệp';
    default:
      return String(freq);
  }
}

function mapGender(gender?: string) {
  if (!gender) return '-';

  switch (String(gender).toUpperCase()) {
    case 'MALE':
      return 'Nam';
    case 'FEMALE':
      return 'Nữ';
    case 'OTHER':
      return 'Khác';
    default:
      return String(gender);
  }
}

function formatDate(value?: string | null) {
  if (!value) return '-';

  try {
    return new Date(value).toLocaleDateString('vi-VN');
  } catch {
    return '-';
  }
}

function getBmiInfo(bmi?: number | null) {
  const value = Number(bmi);

  if (!Number.isFinite(value) || value <= 0) {
    return {
      label: 'Chưa có BMI',
      bg: '#F1F5F9',
      color: COLORS.muted,
      icon: 'help-circle-outline',
    };
  }

  if (value < 18.5) {
    return {
      label: 'Thiếu cân',
      bg: COLORS.warningBg,
      color: COLORS.warning,
      icon: 'alert-circle-outline',
    };
  }

  if (value < 25) {
    return {
      label: 'Bình thường',
      bg: COLORS.successBg,
      color: COLORS.success,
      icon: 'checkmark-circle-outline',
    };
  }

  return {
    label: 'Cần theo dõi',
    bg: COLORS.dangerBg,
    color: COLORS.danger,
    icon: 'warning-outline',
  };
}

function normalizeAddressLine(address: any) {
  const line = address?.addressLine ?? address?.address ?? address?.fullAddress;

  if (
    line !== undefined &&
    line !== null &&
    String(line).trim() !== '' &&
    String(line).trim() !== '1'
  ) {
    return String(line);
  }

  const parts = [
    address?.ward,
    address?.district,
    address?.city,
    address?.province,
  ]
    .filter(Boolean)
    .map((item: any) => String(item).trim())
    .filter((item: string) => item && item !== '1');

  return parts.length > 0 ? parts.join(', ') : 'Chưa cập nhật địa chỉ';
}

function getLatestHealthProfile(list: any[]) {
  if (!Array.isArray(list) || list.length === 0) return null;

  return (
    list.find((item: any) => item.isLatest) ??
    [...list].sort(
      (a: any, b: any) =>
        new Date(b.createdAt ?? 0).getTime() -
        new Date(a.createdAt ?? 0).getTime(),
    )[0]
  );
}

function InfoItem({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <View className="flex-row items-start mb-3">
      <View className="w-10 h-10 rounded-2xl bg-[#FFF7ED] items-center justify-center mr-3">
        <Ionicons name={icon as any} size={19} color={COLORS.primary} />
      </View>

      <View className="flex-1">
        <Text className="text-[#64748B] text-xs font-bold">{label}</Text>
        <Text className="text-[#0F172A] text-sm font-black mt-1">{value}</Text>
      </View>
    </View>
  );
}

function QuickStat({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: string;
}) {
  return (
    <View className="flex-1 mx-1 bg-[#FFF7ED] rounded-2xl py-3 px-2 items-center">
      <Ionicons name={icon as any} size={18} color={COLORS.primary} />

      <Text className="text-[#8B3F2D] text-[11px] font-bold mt-1">
        {label}
      </Text>

      <Text className="text-[#0F172A] text-sm font-black mt-1 text-center">
        {value}
      </Text>
    </View>
  );
}

function MetricBox({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: string;
}) {
  return (
    <View className="w-1/2 p-2">
      <View className="bg-[#F8FAFC] rounded-2xl p-3 border border-[#EEF2F7]">
        <View className="flex-row items-center mb-2">
          <View className="w-8 h-8 rounded-xl bg-white items-center justify-center mr-2">
            <Ionicons name={icon as any} size={16} color={COLORS.primary} />
          </View>

          <Text className="text-[#64748B] text-[11px] font-bold flex-1">
            {label}
          </Text>
        </View>

        <Text className="text-[#0F172A] text-base font-black">{value}</Text>
      </View>
    </View>
  );
}

export default function ProfileInfoScreen() {
  const nav = useNavigation<any>();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [profile, setProfile] = useState<any | null>(null);

  /**
   * latestHealthProfile = số đo / health profile mới nhất.
   * Không dùng chung với profile cá nhân.
   */
  const [latestHealthProfile, setLatestHealthProfile] = useState<any | null>(null);

  const [addresses, setAddresses] = useState<any[] | null>(null);
  const [myInjuries, setMyInjuries] = useState<any[] | null>(null);
  const [_injuryLibrary, setInjuryLibrary] = useState<any[] | null>(null);

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [modalState, setModalState] = useState<any>({ visible: false, title: '', message: '' });

  const showModal = (opts: { title?: string; message: string; mode?: 'noti'|'confirm'|'toast'; onConfirm?: () => void }) => {
    setModalState({
      visible: true,
      title: opts.title ?? '',
      message: opts.message,
      mode: opts.mode ?? 'noti',
      onConfirm: () => {
        try { setModalState((s:any) => ({ ...s, visible: false })); } catch {}
        if (opts.onConfirm) opts.onConfirm();
      },
    });
  };

  const closeModal = () => setModalState((s:any) => ({ ...s, visible: false }));

  const avatar = profile?.avatarUrl ?? profile?.avatar ?? defaultAvatar;

  const loadAddresses = useCallback(async () => {
    try {
      const res = await getAddresses();
      if (Array.isArray(res)) setAddresses(res);
    } catch (e) {
      console.warn('loadAddresses failed', e);
    }
  }, []);

  const loadAll = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);

    try {
      const profileRes = await fetchTraineeProfile();

      if (profileRes.ok) {
        setProfile(profileRes.data ?? profileRes);
      }

      const [healthProfilesRes, addressRes, myInjuriesRes, injuryLibraryRes] =
        await Promise.all([
          fetchMyHealthProfiles(),
          (async () => {
            try {
              return await getAddresses();
            } catch {
              return null;
            }
          })(),
          fetchMyInjuries(),
          fetchInjuries(),
        ]);

      /**
       * Health Profile / Số đo:
       * fetchMyHealthProfiles() trả danh sách health profiles.
       * Màn này chỉ hiển thị latestHealthProfile.
       */
      if (healthProfilesRes && (healthProfilesRes as any).ok) {
        const healthProfilesData =
          (healthProfilesRes as any).data ?? healthProfilesRes;

        if (Array.isArray(healthProfilesData)) {
          setLatestHealthProfile(getLatestHealthProfile(healthProfilesData));
        } else {
          setLatestHealthProfile(null);
        }
      } else {
        setLatestHealthProfile(null);
      }

      if (Array.isArray(addressRes)) {
        setAddresses(addressRes);
      }

      if (myInjuriesRes && (myInjuriesRes as any).ok) {
        setMyInjuries((myInjuriesRes as any).data ?? myInjuriesRes);
      } else {
        setMyInjuries([]);
      }

      if (injuryLibraryRes && (injuryLibraryRes as any).ok) {
        setInjuryLibrary((injuryLibraryRes as any).data ?? injuryLibraryRes);
      }
    } catch (e) {
      console.warn('fetch profile', e);
      showModal({ title: 'Lỗi', message: 'Không thể tải thông tin cá nhân' });
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll(true);
  }, [loadAll]);

  const onRefresh = async () => {
    setRefreshing(true);

    try {
      await loadAll(false);
    } finally {
      setRefreshing(false);
    }
  };

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

  async function handleSave() {
    setSaving(true);

    try {
      const payload: any = {
        fullName: form.fullName,
      };

      if (form.age) payload.age = Number(form.age);
      if (form.gender) payload.gender = form.gender;
      if (form.avatarUrl) payload.avatarUrl = form.avatarUrl;
      if (form.workoutLevel) payload.workoutLevel = form.workoutLevel;
      if (form.workoutFrequency) payload.workoutFrequency = form.workoutFrequency;

      const res = await updateTraineeProfile(payload);

      if (res.ok) {
        const updated = res.data ?? payload;

        setProfile((prev: any) => ({
          ...(prev ?? {}),
          ...(updated ?? {}),
        }));

        showModal({ title: 'Cập nhật thành công', message: 'Thông tin cá nhân đã được cập nhật.', onConfirm: () => setEditing(false) });
      } else {
        showModal({ title: 'Cập nhật thất bại', message: res.error?.message || 'Đã xảy ra lỗi khi cập nhật thông tin.' });
      }
    } catch (e) {
      console.error('Failed to save profile', e);
      showModal({ title: 'Cập nhật thất bại', message: 'Đã xảy ra lỗi khi cập nhật thông tin.' });
    } finally {
      setSaving(false);
    }
  }

  const defaultAddress =
    addresses?.find((item: any) => item.isDefault) ?? addresses?.[0] ?? null;

  const bmiInfo = getBmiInfo(latestHealthProfile?.bmi);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-[#FFF9F3]">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={COLORS.primary} />
          <Text className="mt-3 text-[#64748B] font-semibold">
            Đang tải thông tin cá nhân...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#FFF9F3]">
      <View className="px-4 pt-2 pb-4 border-b border-[#F1E7DC]">
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => nav.goBack()}
            className="w-[42px] h-[42px] rounded-full bg-white border border-[#F1E7DC] items-center justify-center"
          >
            <Ionicons name="arrow-back" size={22} color="#0F172A" />
          </TouchableOpacity>

          <View className="flex-1 mx-3">
            <Text className="text-[#0F172A] text-xl font-black">
              Thông tin cá nhân
            </Text>

            <Text className="text-[#64748B] text-xs mt-1 font-semibold">
              Hồ sơ, sức khỏe và địa chỉ
            </Text>
          </View>

          <TouchableOpacity
            onPress={onRefresh}
            className="w-[42px] h-[42px] rounded-full bg-white border border-[#F1E7DC] items-center justify-center"
          >
            <Ionicons name="refresh" size={22} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 36 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        <View className="bg-white rounded-3xl p-5 items-center border border-[#F1E7DC] shadow-sm">
          <Image
            source={{ uri: avatar }}
            className="w-28 h-28 rounded-full border-4 border-[#FFF7ED] bg-[#F8FAFC]"
          />

          <Text
            className="text-[#0F172A] text-2xl font-black mt-4 text-center"
            numberOfLines={2}
          >
            {profile?.fullName ?? profile?.name ?? 'Người dùng'}
          </Text>

          {profile?.email ? (
            <Text className="text-sm text-[#64748B] mt-1">{profile.email}</Text>
          ) : null}

          <View className="mt-3 px-3 py-1.5 rounded-full bg-[#FFF7ED]">
            <Text className="text-[#8B3F2D] text-xs font-black">
              {mapWorkoutLevel(profile?.workoutLevel)}
            </Text>
          </View>

          <View className="flex-row mt-5">
            <TouchableOpacity
              onPress={openEdit}
              className="bg-[#8B3F2D] px-5 py-3 rounded-2xl flex-row items-center mr-2"
            >
              <Ionicons name="create-outline" size={17} color="#fff" />
              <Text className="text-white font-black ml-2">Chỉnh sửa</Text>
            </TouchableOpacity>

            <TouchableOpacity className="bg-[#FFF7ED] px-5 py-3 rounded-2xl border border-[#F1E7DC] flex-row items-center">
              <Ionicons name="share-social-outline" size={17} color={COLORS.primary} />
              <Text className="text-[#8B3F2D] font-black ml-2">Chia sẻ</Text>
            </TouchableOpacity>
          </View>

          <View className="w-full flex-row mt-5">
            <QuickStat
              icon="resize-outline"
              label="Chiều cao"
              value={
                latestHealthProfile
                  ? safeValue(
                      latestHealthProfile.heightCm ?? latestHealthProfile.height,
                      ' cm',
                    )
                  : '-'
              }
            />

            <QuickStat
              icon="barbell-outline"
              label="Cân nặng"
              value={
                latestHealthProfile
                  ? safeValue(
                      latestHealthProfile.weightKg ?? latestHealthProfile.weight,
                      ' kg',
                    )
                  : '-'
              }
            />

            <QuickStat
              icon="bandage-outline"
              label="Chấn thương"
              value={Array.isArray(myInjuries) ? String(myInjuries.length) : '-'}
            />
          </View>
        </View>

        <View className="bg-white rounded-3xl p-5 border border-[#F1E7DC] shadow-sm mt-4">
          <View className="flex-row items-center mb-4">
            <View className="w-10 h-10 rounded-2xl bg-[#FFF7ED] items-center justify-center mr-3">
              <Ionicons name="person-outline" size={20} color={COLORS.primary} />
            </View>

            <View className="flex-1">
              <Text className="text-[#0F172A] text-lg font-black">
                Thông tin cá nhân
              </Text>
              <Text className="text-[#64748B] text-xs mt-1">
                Thông tin cơ bản của tài khoản
              </Text>
            </View>
          </View>

          <InfoItem
            icon="person-circle-outline"
            label="Họ tên"
            value={profile?.fullName ?? profile?.name ?? '-'}
          />

          <InfoItem
            icon="calendar-outline"
            label="Tuổi"
            value={profile?.age ? String(profile.age) : '-'}
          />

          <InfoItem
            icon="male-female-outline"
            label="Giới tính"
            value={mapGender(profile?.gender)}
          />

          <InfoItem
            icon="fitness-outline"
            label="Cấp độ tập luyện"
            value={mapWorkoutLevel(profile?.workoutLevel)}
          />

          <InfoItem
            icon="pulse-outline"
            label="Tần suất vận động"
            value={mapWorkoutFrequency(profile?.workoutFrequency)}
          />
        </View>

        <View className="bg-white rounded-3xl p-5 border border-[#F1E7DC] shadow-sm mt-4">
          <View className="flex-row items-center mb-4">
            <View className="w-10 h-10 rounded-2xl bg-[#FFF7ED] items-center justify-center mr-3">
              <Ionicons name="location-outline" size={20} color={COLORS.primary} />
            </View>

            <View className="flex-1">
              <Text className="text-[#0F172A] text-lg font-black" numberOfLines={1}>
                Địa chỉ giao hàng
              </Text>

              <Text className="text-[#64748B] text-xs mt-1">
                {addresses?.length ? `${addresses.length} địa chỉ đã lưu` : 'Chưa có địa chỉ'}
              </Text>
            </View>
          </View>

          {defaultAddress ? (
            <View>
              <View className="bg-[#F8FAFC] rounded-2xl p-4">
                <View className="flex-row items-start">
                  <Ionicons name="home-outline" size={20} color={COLORS.primary} />

                  <View className="flex-1 ml-3">
                    <Text className="text-[#0F172A] font-black text-base">
                      {defaultAddress.receiverName ?? 'Người nhận'}
                    </Text>

                    {defaultAddress.receiverPhone ? (
                      <Text className="text-[#64748B] text-sm mt-1">
                        {defaultAddress.receiverPhone}
                      </Text>
                    ) : null}

                    <Text className="text-[#334155] text-sm mt-3 leading-5">
                      {normalizeAddressLine(defaultAddress)}
                    </Text>

                    {defaultAddress.isDefault ? (
                      <View className="self-start mt-3 bg-[#ECFDF5] rounded-full px-3 py-1">
                        <Text className="text-[#047857] text-xs font-black">
                          Mặc định
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              </View>

              <View className="flex-row mt-3">
                <TouchableOpacity
                  onPress={() => nav.navigate('AddressList', { onSaved: loadAddresses })}
                  className="flex-1 bg-[#FFF7ED] rounded-2xl py-3 items-center mr-2 border border-[#F1E7DC]"
                >
                  <Text className="text-[#8B3F2D] font-black">Quản lý</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => nav.navigate('AddressForm', { onSaved: loadAddresses })}
                  className="flex-1 bg-[#8B3F2D] rounded-2xl py-3 items-center ml-2 flex-row justify-center"
                >
                  <Ionicons name="add" size={17} color="#fff" />
                  <Text className="text-white font-black ml-1">Thêm địa chỉ</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View className="items-center bg-[#F8FAFC] rounded-2xl p-5">
              <Ionicons name="location-outline" size={34} color="#CD853F" />

              <Text className="text-[#0F172A] font-black mt-3">
                Bạn chưa có địa chỉ nào
              </Text>

              <Text className="text-[#64748B] text-center text-sm mt-1">
                Thêm địa chỉ để giao hàng và tính phí vận chuyển chính xác hơn.
              </Text>

              <TouchableOpacity
                onPress={() => nav.navigate('AddressForm', { onSaved: loadAddresses })}
                className="mt-4 bg-[#8B3F2D] px-5 py-3 rounded-2xl flex-row items-center"
              >
                <Ionicons name="add" size={17} color="#fff" />
                <Text className="text-white font-black ml-1">Tạo địa chỉ</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View className="bg-white rounded-3xl p-5 border border-[#F1E7DC] shadow-sm mt-4">
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center flex-1">
              <View className="w-10 h-10 rounded-2xl bg-[#FFF7ED] items-center justify-center mr-3">
                <Ionicons name="heart-circle-outline" size={21} color={COLORS.primary} />
              </View>

              <View className="flex-1">
                <Text className="text-[#0F172A] text-lg font-black">
                  Số đo sức khỏe
                </Text>

                {latestHealthProfile?.createdAt ? (
                  <Text className="text-[#64748B] text-xs mt-1">
                    Ngày đo: {formatDate(latestHealthProfile.createdAt)}
                  </Text>
                ) : (
                  <Text className="text-[#64748B] text-xs mt-1">
                    Dữ liệu từ health profile
                  </Text>
                )}
              </View>
            </View>

            <TouchableOpacity
              onPress={() =>
                nav.navigate(latestHealthProfile ? 'BodyMetricDetails' : 'BodyScan')
              }
              className="px-3 py-2 rounded-full bg-[#FFF7ED] border border-[#F1E7DC]"
            >
              <Text className="text-[#8B3F2D] text-xs font-black">
                {latestHealthProfile ? 'Cập nhật' : 'Thêm số đo'}
              </Text>
            </TouchableOpacity>
          </View>

          {latestHealthProfile ? (
            <View>
              <View
                className="self-start px-3 py-1.5 rounded-full flex-row items-center mb-3"
                style={{ backgroundColor: bmiInfo.bg }}
              >
                <Ionicons name={bmiInfo.icon as any} size={13} color={bmiInfo.color} />
                <Text
                  className="ml-1 text-[10px] font-black"
                  style={{ color: bmiInfo.color }}
                >
                  {bmiInfo.label}
                </Text>
              </View>

              <View className="flex-row flex-wrap -m-2">
                <MetricBox
                  icon="analytics-outline"
                  label="BMI"
                  value={safeValue(latestHealthProfile.bmi)}
                />

                <MetricBox
                  icon="water-outline"
                  label="Tỷ lệ mỡ"
                  value={safeValue(latestHealthProfile.bodyFatPercentage, '%')}
                />

                <MetricBox
                  icon="body-outline"
                  label="Khối cơ"
                  value={safeValue(latestHealthProfile.muscleMassKg, ' kg')}
                />

                <MetricBox
                  icon="ellipse-outline"
                  label="Eo / Hông"
                  value={`${latestHealthProfile.waistCm ?? '-'} / ${
                    latestHealthProfile.hipCm ?? '-'
                  } cm`}
                />
              </View>

              <View className="mt-4 bg-[#F8FAFC] rounded-2xl p-3">
                <Text className="text-[#64748B] text-xs font-bold">Nguồn</Text>
                <Text className="text-[#0F172A] text-sm font-black mt-1">
                  {latestHealthProfile.source ?? '-'}
                </Text>
              </View>
            </View>
          ) : (
            <View className="items-center bg-[#F8FAFC] rounded-2xl p-5">
              <Ionicons name="heart-outline" size={36} color={COLORS.accent} />

              <Text className="text-[#0F172A] font-black mt-3">
                Chưa có health profile
              </Text>

              <Text className="text-[#64748B] text-center text-sm mt-1">
                Hãy thêm số đo để tạo health profile và nhận phân tích sức khỏe chi tiết hơn.
              </Text>
            </View>
          )}
        </View>

        <ProfileEditModal
          visible={editing}
          form={form}
          setForm={setForm}
          onClose={() => setEditing(false)}
          onSave={handleSave}
          saving={saving}
        />
      </ScrollView>
      <ModalPopup
        {...(modalState as any)}
        titleText={modalState.title}
        contentText={modalState.message}
        onClose={closeModal}
      />
    </SafeAreaView>
  );
}