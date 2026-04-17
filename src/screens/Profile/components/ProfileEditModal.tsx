import React, { useState } from 'react';
import { Modal, View, Text, TextInput, ScrollView, Pressable, ActivityIndicator, KeyboardAvoidingView, Platform, StyleSheet, Image, Alert } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import storage from '@react-native-firebase/storage';

const localStyles = StyleSheet.create({
  avoid: { flex: 1, justifyContent: 'flex-end' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1 },
  chipActiveGender: { borderColor: '#F59E0B', backgroundColor: '#FFFBEB' },
  chipInactive: { borderColor: '#E5E7EB', backgroundColor: '#fff' },
  chipActiveLevel: { borderColor: '#7C3AED', backgroundColor: '#F5F3FF' },
  chipActiveFreq: { borderColor: '#059669', backgroundColor: '#ECFDF5' },
  stickyActions: { padding: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6', backgroundColor: '#fff' },
  sheet: { maxHeight: '85%' },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 12 },
  avatarPreview: { width: 72, height: 72, borderRadius: 12, backgroundColor: '#f3f3f3', marginRight: 12 },
  uploadRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  uploadButton: { paddingHorizontal: 14, paddingVertical: 8, backgroundColor: '#F59E0B', borderRadius: 8 },
  uploadButtonText: { color: '#fff', fontWeight: '600' },
});

type Props = {
  visible: boolean;
  form: any;
  setForm: (f: any) => void;
  onClose: () => void;
  onSave: () => void;
  saving?: boolean;
};

const GENDER_OPTIONS = ['MALE', 'FEMALE', 'OTHER'];
const GENDER_LABELS: Record<string,string> = { MALE: 'Nam', FEMALE: 'Nữ', OTHER: 'Khác' };
const LEVEL_OPTIONS = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'];
const LEVEL_LABELS: Record<string,string> = { BEGINNER: 'Người mới', INTERMEDIATE: 'Trung bình', ADVANCED: 'Nâng cao' };
// Map UI choices to backend enum values (WorkoutFrequency)
const FREQUENCY_OPTIONS = [
  { key: 'SEDENTARY', label: '1 lần/tuần' },
  { key: 'LIGHT', label: '2 lần/tuần' },
  { key: 'MODERATE', label: '3 lần/tuần' },
  { key: 'ACTIVE', label: 'Hàng ngày' },
];

export default function ProfileEditModal({ visible, form, setForm, onClose, onSave, saving = false }: Props) {
  const [uploading, setUploading] = useState(false);

  const pickAndUpload = async () => {
    try {
      const res = await launchImageLibrary({ mediaType: 'photo', quality: 0.8 });
      if (res.didCancel) return;
      const asset = res.assets && res.assets[0];
      if (!asset || !asset.uri) return;
      setUploading(true);
      // create unique filename
      const filename = `avatars/${Date.now()}_${asset.fileName ?? 'photo'}`;
      const ref = storage().ref(filename);
      // putFile expects a file:// or absolute path on native
      const localPath = asset.uri.replace('file://', '');
      await ref.putFile(localPath);
      const url = await ref.getDownloadURL();
      setForm({ ...form, avatarUrl: url });
    } catch (e) {
      console.warn('upload avatar', e);
      Alert.alert('Lỗi', 'Không thể tải ảnh lên. Vui lòng thử lại.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={localStyles.avoid}>
        <View className="bg-white rounded-t-2xl shadow-xl" style={localStyles.sheet}>
          <View className="px-4 pt-4 pb-2">
            <View className="w-12 h-1.5 rounded-full bg-gray-200 mx-auto mb-3" />
            <Text className="text-lg font-extrabold">Chỉnh sửa Hồ sơ</Text>
            <Text className="text-sm text-gray-500 mt-1">Cập nhật thông tin cơ bản của bạn</Text>
          </View>

          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={localStyles.scrollContent}>
            <Text className="text-sm text-gray-700 mt-2">Họ tên</Text>
            <TextInput value={form.fullName} onChangeText={(t) => setForm({ ...form, fullName: t })} placeholder="Họ tên" className="border border-gray-200 rounded-xl p-3 mt-1" />

            <Text className="text-sm text-gray-700 mt-3">Tuổi</Text>
            <TextInput value={form.age} onChangeText={(t) => setForm({ ...form, age: t })} placeholder="Tuổi" keyboardType="number-pad" className="border border-gray-200 rounded-xl p-3 mt-1" />

            <Text className="text-sm text-gray-700 mt-3">Giới tính</Text>
            <View style={localStyles.chipRow} className="mt-2">
              {GENDER_OPTIONS.map(g => {
                const active = form.gender === g;
                return (
                  <Pressable key={g} onPress={() => setForm({ ...form, gender: g })} style={[localStyles.chip, active ? localStyles.chipActiveGender : localStyles.chipInactive]}> 
                    <Text className={`${active ? 'text-amber-700 font-semibold' : 'text-gray-700'}`}>{GENDER_LABELS[g] ?? g}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Text className="text-sm text-gray-700 mt-4">Ảnh đại diện</Text>
            <View style={localStyles.uploadRow}>
              {form.avatarUrl ? (
                <Image source={{ uri: form.avatarUrl }} style={localStyles.avatarPreview} />
              ) : (
                <View style={localStyles.avatarPreview} />
              )}
              <View>
                <Pressable onPress={pickAndUpload} style={localStyles.uploadButton} disabled={uploading}>
                  {uploading ? <ActivityIndicator color="#fff" /> : <Text style={localStyles.uploadButtonText}>Chọn ảnh</Text>}
                </Pressable>
              </View>
            </View>

            <Text className="text-sm text-gray-700 mt-3">Mức độ tập</Text>
            <View style={localStyles.chipRow} className="mt-2">
              {LEVEL_OPTIONS.map(l => {
                const active = form.workoutLevel === l;
                return (
                  <Pressable key={l} onPress={() => setForm({ ...form, workoutLevel: l })} style={[localStyles.chip, active ? localStyles.chipActiveLevel : localStyles.chipInactive]}>
                    <Text className={`${active ? 'text-purple-700 font-semibold' : 'text-gray-700'}`}>{LEVEL_LABELS[l] ?? l}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Text className="text-sm text-gray-700 mt-4">Tần suất</Text>
            <View style={localStyles.chipRow} className="mt-2 mb-4">
              {FREQUENCY_OPTIONS.map(fq => {
                const active = form.workoutFrequency === fq.key;
                return (
                  <Pressable key={fq.key} onPress={() => setForm({ ...form, workoutFrequency: fq.key })} style={[localStyles.chip, active ? localStyles.chipActiveFreq : localStyles.chipInactive]}>
                    <Text className={`${active ? 'text-emerald-700 font-semibold' : 'text-gray-700'}`}>{fq.label}</Text>
                  </Pressable>
                );
              })}
            </View>

          </ScrollView>

          <View style={localStyles.stickyActions}>
            <View className="flex-row justify-end">
              <Pressable onPress={onClose} className="px-4 py-2 rounded-lg bg-gray-100 mr-3">
                <Text>Hủy</Text>
              </Pressable>

              <Pressable onPress={onSave} className="px-5 py-3 rounded-lg bg-amber-700 flex-row items-center">
                {saving ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-semibold">Lưu</Text>}
              </Pressable>
            </View>
          </View>

        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
