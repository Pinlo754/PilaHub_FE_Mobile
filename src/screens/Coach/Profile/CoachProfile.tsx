import React, { useEffect, useState, useCallback, memo } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { CoachService } from '../../../hooks/coach.service';
import ModalPopup, { IconColor } from '../../../components/ModalPopup';

// --- THƯ VIỆN UPLOAD FILE & FIREBASE CLI ---
import { launchImageLibrary } from 'react-native-image-picker';
import storage from '@react-native-firebase/storage';
import FileSelector from 'react-native-file-selector';

interface CoachFormData {
  fullName: string;
  age: string;
  gender: 'MALE' | 'FEMALE';
  avatarUrl: string;
  bio: string;
  yearsOfExperience: string;
  specialization: string;
  certificationsUrl: string;
}

type ModalState = {
  visible: boolean;
  mode: 'noti' | 'toast' | 'confirm';
  title?: string;
  message: string;
  iconName?: string;
  iconBgColor?: IconColor;
};

/* ============================
    INPUT FIELD
============================ */
const InputField = memo(({
  label, value, onChange, icon, placeholder, keyboardType = 'default', multiline = false, editable = true
}: any) => {
  return (
    <View className="mb-4">
      <Text className="text-gray-400 text-[10px] font-bold mb-1 ml-1 uppercase tracking-tighter">
        {label}
      </Text>
      <View className={`flex-row items-center bg-gray-50 border border-gray-100 rounded-2xl px-3 ${multiline ? 'items-start pt-3' : ''}`}>
        <Ionicons
          name={icon}
          size={18}
          color="#A0522D"
          style={{ marginRight: 8, marginTop: multiline ? 4 : 0 }}
        />
        <TextInput
          value={value}
          onChangeText={onChange}
          editable={editable}
          keyboardType={keyboardType}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          multiline={multiline}
          style={multiline ? { height: 80, textAlignVertical: 'top' } : { height: 45 }}
          className="flex-1 text-[#424242] text-sm"
        />
      </View>
    </View>
  );
});

/* ============================
    GENDER PICKER
============================ */
interface GenderPickerProps {
  selected: 'MALE' | 'FEMALE';
  onSelect: (val: 'MALE' | 'FEMALE') => void;
  disabled?: boolean;
}
const GenderPicker = memo(({ selected, onSelect, disabled }: GenderPickerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const isMale = selected === 'MALE';
  const handleSelect = (val: 'MALE' | 'FEMALE') => {
    onSelect(val);
    setIsOpen(false);
  };
  return (
    <View className="ml-auto relative z-50">
      <Text className="text-gray-400 text-[10px] font-bold mb-1 uppercase tracking-tighter">Giới tính</Text>
      <TouchableOpacity
        disabled={disabled} onPress={() => setIsOpen(!isOpen)}
        className="flex-row bg-gray-50 border border-gray-100 rounded-2xl h-[45px] items-center px-3 min-w-[90px] justify-between"
      >
        <Text className={`text-sm font-medium ${disabled ? 'text-gray-400' : 'text-[#424242]'}`}>
          {isMale ? 'Nam' : 'Nữ'}
        </Text>
        {!disabled && <Ionicons name={isOpen ? "chevron-up" : "chevron-down"} size={16} color="#A0522D" style={{ marginLeft: 8 }} />}
      </TouchableOpacity>
      {isOpen && !disabled && (
        <View className="absolute top-[65px] left-0 right-0 bg-white border border-gray-100 rounded-xl shadow-sm z-50 overflow-hidden">
          <TouchableOpacity onPress={() => handleSelect('MALE')} className={`px-4 py-3 border-b border-gray-50 ${isMale ? 'bg-orange-50' : ''}`}>
            <Text className={`text-sm ${isMale ? 'text-[#A0522D] font-bold' : 'text-gray-600'}`}>Nam</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleSelect('FEMALE')} className={`px-4 py-3 ${!isMale ? 'bg-orange-50' : ''}`}>
            <Text className={`text-sm ${!isMale ? 'text-[#A0522D] font-bold' : 'text-gray-600'}`}>Nữ</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
});

/* ============================
    MAIN SCREEN
============================ */
const CoachProfileScreen = () => {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isNewProfile, setIsNewProfile] = useState(false);
  const [coachId, setCoachId] = useState<string | null>(null);

  // States quản lý loading khi upload file
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCert, setUploadingCert] = useState(false);

  const [formData, setFormData] = useState<CoachFormData>({
    fullName: '',
    age: '',
    gender: 'MALE',
    avatarUrl: '',
    bio: '',
    yearsOfExperience: '',
    specialization: '',
    certificationsUrl: '',
  });

  const [modalState, setModalState] = useState<ModalState>({
    visible: false, mode: 'noti', message: '',
  });

  const closeModal = useCallback(() => {
    setModalState((s) => ({ ...s, visible: false }));
  }, []);

  const fetchProfile = useCallback(async () => {
    try {
      const idString = await AsyncStorage.getItem('id');
      if (!idString) return;

      const parsedId = JSON.parse(idString);
      setCoachId(parsedId);

      const data = await CoachService.getById(parsedId);

      if (!data || !data.fullName) {
        setIsNewProfile(true);
        setIsEditing(true);
        return;
      }

      setFormData({
        fullName: data.fullName || '',
        age: data.age?.toString() || '',
        gender: (data.gender?.trim() as 'MALE' | 'FEMALE') || 'MALE',
        avatarUrl: data.avatarUrl || '',
        bio: data.bio || '',
        yearsOfExperience: data.yearsOfExperience?.toString() || '',
        specialization: data.specialization || '',
        certificationsUrl: data.certificationsUrl || '',
      });
      setIsNewProfile(false);
    } catch (error) {
      setIsNewProfile(true);
      setIsEditing(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updateField = useCallback((field: keyof CoachFormData) => (value: string) => {
    setFormData(prev => prev[field] === value ? prev : { ...prev, [field]: value });
  }, []);

  const handleGenderSelect = useCallback((val: 'MALE' | 'FEMALE') => {
    setFormData(prev => prev.gender === val ? prev : { ...prev, gender: val });
  }, []);

  /* ============================
      XỬ LÝ UPLOAD BẰNG RN FIREBASE
  ============================ */
  const uploadFileToFirebase = async (uri: string, path: string): Promise<string | null> => {
    const uploadUri = Platform.OS === 'ios' ? uri.replace('file://', '') : uri;
    const reference = storage().ref(path);

    try {
      await reference.putFile(uploadUri);
      return await reference.getDownloadURL();
    } catch (e) {
      console.error("Firebase Upload Error: ", e);
      return null;
    }
  };

  const handlePickAvatar = async () => {
    if (!isEditing) return;

    const result = await launchImageLibrary({
      mediaType: 'photo',
      quality: 0.8,
      selectionLimit: 1,
    });

    if (result.assets && result.assets.length > 0) {
      setUploadingAvatar(true);
      const asset = result.assets[0];

      if (!asset.uri) {
        setUploadingAvatar(false);
        return;
      }

      const path = `coaches/avatars/${Date.now()}_${asset.fileName || 'avatar.jpg'}`;
      const downloadUrl = await uploadFileToFirebase(asset.uri, path);

      if (downloadUrl) {
        setFormData(prev => ({ ...prev, avatarUrl: downloadUrl }));
      } else {
        Alert.alert("Lỗi", "Không thể tải ảnh lên Firebase");
      }
      setUploadingAvatar(false);
    }
  };

  const handlePickCertificate = async () => {
    if (!isEditing) return;

    const result = await launchImageLibrary({
      mediaType: 'photo',
      quality: 0.8,
      selectionLimit: 1,
    });

    if (result.assets && result.assets.length > 0) {
      setUploadingCert(true);
      const asset = result.assets[0];

      if (!asset.uri) {
        setUploadingCert(false);
        return;
      }

      const path = `coaches/cert/${Date.now()}_${asset.fileName || 'cert.jpg'}`;
      const downloadUrl = await uploadFileToFirebase(asset.uri, path);

      if (downloadUrl) {
        setFormData(prev => ({
          ...prev,
          certificationsUrl: downloadUrl
        }));
      } else {
        Alert.alert("Lỗi", "Không thể tải ảnh lên Firebase");
      }
      setUploadingCert(false);
    }


    try {

    } catch (err) {
      console.error(err);
      setUploadingCert(false);
      Alert.alert('Lỗi', 'Không thể mở trình chọn file');
    }
  };

  /* ============================
      XỬ LÝ LƯU (CREATE / UPDATE)
  ============================ */
  const handleSaveProfile = async () => {
    if (!isEditing) {
      setIsEditing(true);
      return;
    }

    if (!formData.fullName || !formData.age || !formData.specialization) {
      Alert.alert('Thiếu thông tin', 'Vui lòng điền các thông tin bắt buộc (Tên, Tuổi, Lĩnh vực).');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        age: Number(formData.age),
        yearsOfExperience: Number(formData.yearsOfExperience),
      };

      if (isNewProfile) {
        await CoachService.createCoach(payload);
      } else {
        if (!coachId) throw new Error("Missing Coach ID");
        await CoachService.updateProfile(coachId, payload);
      }

      setModalState({
        visible: true,
        mode: 'noti',
        title: 'Thành công',
        message: isNewProfile ? 'Tạo hồ sơ thành công!' : 'Lưu hồ sơ thành công!',
        iconName: 'checkmark-circle',
        iconBgColor: 'green',
      });
      setIsEditing(false);
      setIsNewProfile(false);
    } catch (e) {
      setModalState({
        visible: true,
        mode: 'noti',
        title: 'Lỗi',
        message: `Lưu hồ sơ thất bại!`,
        iconName: 'alert-circle',
        iconBgColor: 'red',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-[#F8F9FA]">
        <ActivityIndicator size="large" color="#A0522D" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-[#F8F9FA]">
      {/* HEADER */}
      <View className="flex-row justify-between items-center px-5 pt-12 pb-4 bg-white border-b border-gray-100 shadow-sm">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#5D4037" />
        </TouchableOpacity>

        <Text className="text-[#5D4037] text-lg font-extrabold">
          {isNewProfile ? 'Chưa có hồ sơ! Tạo ngay' : 'Hồ sơ của tôi'}
        </Text>

        <View className="flex-row items-center">
          {isEditing && !isNewProfile && (
            <TouchableOpacity
              onPress={() => {
                fetchProfile();
                setIsEditing(false);
              }}
              className="mr-2 px-4 py-2 rounded-full border border-gray-300"
            >
              <Text className="text-gray-600 text-xs font-bold">Hủy</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity onPress={handleSaveProfile} className="bg-[#A0522D] px-5 py-2 rounded-full">
            {submitting ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text className="text-white font-bold text-xs">
                {isEditing ? 'Lưu' : 'Chỉnh sửa'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* AVATAR */}
        <View className="items-center py-8 bg-white mb-2 shadow-sm">
          <TouchableOpacity onPress={handlePickAvatar} disabled={!isEditing} className="relative">
            {uploadingAvatar ? (
              <View className="w-24 h-24 rounded-full bg-gray-200 border-2 border-[#A0522D]/10 justify-center items-center">
                <ActivityIndicator color="#A0522D" />
              </View>
            ) : (
              <Image
                source={{ uri: formData.avatarUrl || 'https://via.placeholder.com/150' }}
                className="w-24 h-24 rounded-full bg-gray-200 border-2 border-[#A0522D]/10"
              />
            )}

            {isEditing && !uploadingAvatar && (
              <View className="absolute bottom-0 right-0 bg-[#A0522D] p-1.5 rounded-full border-2 border-white">
                <Ionicons name="camera" size={14} color="white" />
              </View>
            )}
          </TouchableOpacity>
          {isNewProfile && (
            <Text className="text-gray-400 text-xs mt-3">Nhấn vào ảnh để tải avatar</Text>
          )}
        </View>

        {/* FORM */}
        <View className="px-4 py-4">
          <View className="bg-white rounded-[32px] p-6 shadow-sm shadow-black/5">
            <InputField label="Họ và tên" icon="person-outline" value={formData.fullName} onChange={updateField('fullName')} editable={isEditing} />

            <View className="flex-row space-x-4">
              <View className="flex-[0.8]">
                <InputField label="Tuổi" icon="calendar-outline" value={formData.age} onChange={updateField('age')} keyboardType="numeric" editable={isEditing} />
              </View>
              <GenderPicker selected={formData.gender} onSelect={handleGenderSelect} disabled={!isEditing} />
            </View>

            <InputField label="Lĩnh vực thế mạnh" icon="fitness-outline" value={formData.specialization} onChange={updateField('specialization')} editable={isEditing} />
            <InputField label="Kinh nghiệm (năm)" icon="ribbon-outline" value={formData.yearsOfExperience} onChange={updateField('yearsOfExperience')} keyboardType="numeric" editable={isEditing} />
            <InputField label="Tiểu sử" icon="book-outline" value={formData.bio} onChange={updateField('bio')} multiline editable={isEditing} />

            {/* UPLOAD CHỨNG CHỈ (PDF) */}
            <View className="mb-4">
              <Text className="text-gray-400 text-[10px] font-bold mb-1 ml-1 uppercase tracking-tighter">
                Chứng chỉ
              </Text>
              <TouchableOpacity
                onPress={handlePickCertificate}
                disabled={!isEditing}
                className="flex-row items-center bg-gray-50 border border-gray-100 rounded-2xl px-3 h-[45px]"
              >
                <Ionicons name="document-text-outline" size={18} color="#A0522D" style={{ marginRight: 8 }} />

                {uploadingCert ? (
                  <ActivityIndicator size="small" color="#A0522D" />
                ) : formData.certificationsUrl ? (
                  <View className="flex-1 flex-row items-center">
                    <Image
                      source={{ uri: formData.certificationsUrl }}
                      className="w-10 h-10 rounded-lg mr-3 bg-gray-200"
                      resizeMode="cover"
                    />

                    <View className="flex-1">
                      <Text
                        className="text-[#424242] text-sm font-medium"
                        numberOfLines={1}
                      >
                        Chứng chỉ đã tải lên
                      </Text>

                        
                    </View>
                  </View>
                ) : (
                  <Text
                    className={`flex-1 text-sm ${isEditing ? 'text-[#9CA3AF]' : 'text-gray-300'
                      }`}
                  >
                    {isEditing
                      ? 'Nhấn để tải chứng chỉ lên'
                      : 'Chưa có chứng chỉ'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <ModalPopup
          {...(modalState as any)}
          titleText={modalState.title}
          contentText={modalState.message}
          iconName={modalState.iconName}
          iconBgColor={modalState.iconBgColor}
          onClose={closeModal}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default CoachProfileScreen;