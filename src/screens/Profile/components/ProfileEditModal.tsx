import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Image,
  TouchableOpacity,
} from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { launchImageLibrary } from 'react-native-image-picker';
import storage from '@react-native-firebase/storage';
import ModalPopup from '../../../components/ModalPopup';

type Props = {
  visible: boolean;
  form: any;
  setForm: (f: any) => void;
  onClose: () => void;
  onSave: () => void;
  saving?: boolean;
};

const COLORS = {
  bg: '#FFF9F3',
  card: '#FFFFFF',
  text: '#0F172A',
  muted: '#64748B',
  primary: '#8B3F2D',
  accent: '#CD853F',
  border: '#F1E7DC',
  soft: '#FFF7ED',
  success: '#047857',
  successBg: '#ECFDF5',
  warning: '#C2410C',
  warningBg: '#FFEDD5',
  purple: '#6D28D9',
  purpleBg: '#F5F3FF',
};

const GENDER_OPTIONS = ['MALE', 'FEMALE', 'OTHER'];

const GENDER_LABELS: Record<string, string> = {
  MALE: 'Nam',
  FEMALE: 'Nữ',
  OTHER: 'Khác',
};

const LEVEL_OPTIONS = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'];

const LEVEL_LABELS: Record<string, string> = {
  BEGINNER: 'Người mới',
  INTERMEDIATE: 'Trung cấp',
  ADVANCED: 'Nâng cao',
};

const FREQUENCY_OPTIONS = [
  { key: 'SEDENTARY', label: '1 lần/tuần' },
  { key: 'LIGHT', label: '2 lần/tuần' },
  { key: 'MODERATE', label: '3 lần/tuần' },
  { key: 'ACTIVE', label: 'Hàng ngày' },
];

function FieldLabel({
  icon,
  label,
}: {
  icon: string;
  label: string;
}) {
  return (
    <View className="flex-row items-center mt-4 mb-2">
      <Ionicons name={icon as any} size={16} color={COLORS.primary} />
      <Text className="text-[#0F172A] text-sm font-black ml-2">
        {label}
      </Text>
    </View>
  );
}

function SelectChip({
  label,
  active,
  onPress,
  activeColor,
  activeBg,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  activeColor: string;
  activeBg: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        active
          ? {
              backgroundColor: activeBg,
              borderColor: activeColor,
            }
          : styles.chipInactive,
      ]}
    >
      {active ? (
        <Ionicons name="checkmark-circle" size={15} color={activeColor} />
      ) : null}

      <Text
        style={[
          styles.chipText,
          {
            color: active ? activeColor : COLORS.muted,
            marginLeft: active ? 5 : 0,
          },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export default function ProfileEditModal({
  visible,
  form,
  setForm,
  onClose,
  onSave,
  saving = false,
}: Props) {
  const [uploading, setUploading] = useState(false);
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

  const updateField = (key: string, value: any) => {
    setForm({
      ...form,
      [key]: value,
    });
  };

  const pickAndUpload = async () => {
    try {
      const res = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
      });

      if (res.didCancel) return;

      const asset = res.assets?.[0];

      if (!asset?.uri) {
        showModal({ title: 'Lỗi', message: 'Không tìm thấy ảnh đã chọn.' });
        return;
      }

      setUploading(true);

      const safeFileName =
        asset.fileName?.replace(/\s+/g, '_') ?? 'avatar.jpg';

      const filename = `avatars/${Date.now()}_${safeFileName}`;
      const ref = storage().ref(filename);

      const localPath =
        Platform.OS === 'ios'
          ? asset.uri.replace('file://', '')
          : asset.uri;

      await ref.putFile(localPath);

      const url = await ref.getDownloadURL();

      updateField('avatarUrl', url);
    } catch (e) {
      console.warn('upload avatar', e);
      showModal({ title: 'Lỗi', message: 'Không thể tải ảnh lên. Vui lòng thử lại.' });
    } finally {
      setUploading(false);
    }
  };

  const canSave = !saving && !uploading;

  return (
    <>
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.avoid}
      >
        <View style={styles.backdrop}>
          <View className="bg-white rounded-t-[28px] shadow-xl" style={styles.sheet}>
            <View className="px-5 pt-4 pb-3 border-b border-[#F1E7DC]">
              <View className="w-12 h-1.5 rounded-full bg-[#E5E7EB] mx-auto mb-4" />

              <View className="flex-row items-center">
                <View className="w-11 h-11 rounded-2xl bg-[#FFF7ED] items-center justify-center mr-3">
                  <Ionicons name="person-circle-outline" size={25} color={COLORS.primary} />
                </View>

                <View className="flex-1">
                  <Text className="text-[#0F172A] text-xl font-black">
                    Chỉnh sửa hồ sơ
                  </Text>
                  <Text className="text-[#64748B] text-xs mt-1 font-semibold">
                    Cập nhật thông tin cá nhân của bạn
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={onClose}
                  disabled={saving || uploading}
                  className="w-9 h-9 rounded-full bg-[#F8FAFC] items-center justify-center"
                >
                  <Ionicons name="close" size={20} color="#0F172A" />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              <FieldLabel icon="person-outline" label="Họ tên" />

              <TextInput
                value={form.fullName}
                onChangeText={text => updateField('fullName', text)}
                placeholder="Nhập họ tên"
                placeholderTextColor="#94A3B8"
                className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl px-4 py-3 text-[#0F172A] font-semibold"
              />

              <FieldLabel icon="calendar-outline" label="Tuổi" />

              <TextInput
                value={form.age}
                onChangeText={text => {
                  const clean = text.replace(/[^0-9]/g, '');
                  updateField('age', clean);
                }}
                placeholder="Nhập tuổi"
                placeholderTextColor="#94A3B8"
                keyboardType="number-pad"
                className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl px-4 py-3 text-[#0F172A] font-semibold"
              />

              <FieldLabel icon="male-female-outline" label="Giới tính" />

              <View style={styles.chipRow}>
                {GENDER_OPTIONS.map(gender => {
                  const active = form.gender === gender;

                  return (
                    <SelectChip
                      key={gender}
                      label={GENDER_LABELS[gender] ?? gender}
                      active={active}
                      activeColor={COLORS.primary}
                      activeBg={COLORS.soft}
                      onPress={() => updateField('gender', gender)}
                    />
                  );
                })}
              </View>

              <FieldLabel icon="image-outline" label="Ảnh đại diện" />

              <View className="bg-[#F8FAFC] rounded-3xl p-4 border border-[#E2E8F0]">
                <View className="flex-row items-center">
                  {form.avatarUrl ? (
                    <Image source={{ uri: form.avatarUrl }} style={styles.avatarPreview} />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Ionicons name="person-outline" size={32} color="#94A3B8" />
                    </View>
                  )}

                  <View className="flex-1 ml-4">
                    <Text className="text-[#0F172A] font-black">
                      Ảnh hồ sơ
                    </Text>

                    <Text className="text-[#64748B] text-xs mt-1 leading-5">
                      Chọn ảnh rõ mặt để huấn luyện viên dễ nhận diện hơn.
                    </Text>

                    <TouchableOpacity
                      onPress={pickAndUpload}
                      disabled={uploading || saving}
                      className="self-start mt-3 bg-[#8B3F2D] px-4 py-2.5 rounded-2xl flex-row items-center"
                    >
                      {uploading ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <>
                          <Ionicons name="cloud-upload-outline" size={17} color="#fff" />
                          <Text className="text-white font-black ml-2">
                            Chọn ảnh
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              <FieldLabel icon="fitness-outline" label="Mức độ tập" />

              <View style={styles.chipRow}>
                {LEVEL_OPTIONS.map(level => {
                  const active = form.workoutLevel === level;

                  return (
                    <SelectChip
                      key={level}
                      label={LEVEL_LABELS[level] ?? level}
                      active={active}
                      activeColor={COLORS.purple}
                      activeBg={COLORS.purpleBg}
                      onPress={() => updateField('workoutLevel', level)}
                    />
                  );
                })}
              </View>

              <FieldLabel icon="pulse-outline" label="Tần suất vận động" />

              <View style={styles.chipRow}>
                {FREQUENCY_OPTIONS.map(frequency => {
                  const active = form.workoutFrequency === frequency.key;

                  return (
                    <SelectChip
                      key={frequency.key}
                      label={frequency.label}
                      active={active}
                      activeColor={COLORS.success}
                      activeBg={COLORS.successBg}
                      onPress={() => updateField('workoutFrequency', frequency.key)}
                    />
                  );
                })}
              </View>

              <View className="h-4" />
            </ScrollView>

            <View className="px-5 py-4 border-t border-[#F1E7DC] bg-white">
              <View className="flex-row">
                <TouchableOpacity
                  onPress={onClose}
                  disabled={saving || uploading}
                  className="flex-1 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl py-3.5 items-center mr-2"
                >
                  <Text className="text-[#64748B] font-black">Hủy</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={onSave}
                  disabled={!canSave}
                  className={`flex-1 rounded-2xl py-3.5 items-center ml-2 ${
                    canSave ? 'bg-[#8B3F2D]' : 'bg-gray-300'
                  }`}
                >
                  {saving ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text className="text-white font-black">Lưu thay đổi</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
    <ModalPopup
      {...(modalState as any)}
      titleText={modalState.title}
      contentText={modalState.message}
      onClose={closeModal}
    />
    </>
  );
}

const styles = StyleSheet.create({
  avoid: {
    flex: 1,
  },
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
  },
  sheet: {
    maxHeight: '88%',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingVertical: 9,
    paddingHorizontal: 13,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  chipInactive: {
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '800',
  },
  avatarPreview: {
    width: 76,
    height: 76,
    borderRadius: 22,
    backgroundColor: '#F1F5F9',
  },
  avatarPlaceholder: {
    width: 76,
    height: 76,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
});