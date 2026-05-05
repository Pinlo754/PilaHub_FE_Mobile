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
  iconBgColor?: IconColor; // Dùng Type IconColor export từ ModalPopup
};

/* ============================
    INPUT FIELD
============================ */
const InputField = memo(({
  label,
  value,
  onChange,
  icon,
  placeholder,
  keyboardType = 'default',
  multiline = false,
  editable = true
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
      <Text className="text-gray-400 text-[10px] font-bold mb-1 uppercase tracking-tighter">
        Giới tính
      </Text>

      {/* Nút bấm để mở dropdown */}
      <TouchableOpacity
        disabled={disabled}
        onPress={() => setIsOpen(!isOpen)}
        className="flex-row bg-gray-50 border border-gray-100 rounded-2xl h-[45px] items-center px-3 min-w-[90px] justify-between"
      >
        <Text className={`text-sm font-medium ${disabled ? 'text-gray-400' : 'text-[#424242]'}`}>
          {isMale ? 'Nam' : 'Nữ'}
        </Text>
        {!disabled && (
          <Ionicons
            name={isOpen ? "chevron-up" : "chevron-down"}
            size={16}
            color="#A0522D"
            style={{ marginLeft: 8 }}
          />
        )}
      </TouchableOpacity>

      {/* Menu xổ xuống (Chỉ render khi isOpen = true) */}
      {isOpen && !disabled && (
        <View className="absolute top-[65px] left-0 right-0 bg-white border border-gray-100 rounded-xl shadow-sm z-50 overflow-hidden">
          <TouchableOpacity
            onPress={() => handleSelect('MALE')}
            className={`px-4 py-3 border-b border-gray-50 ${isMale ? 'bg-orange-50' : ''}`}
          >
            <Text className={`text-sm ${isMale ? 'text-[#A0522D] font-bold' : 'text-gray-600'}`}>
              Nam
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleSelect('FEMALE')}
            className={`px-4 py-3 ${!isMale ? 'bg-orange-50' : ''}`}
          >
            <Text className={`text-sm ${!isMale ? 'text-[#A0522D] font-bold' : 'text-gray-600'}`}>
              Nữ
            </Text>
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
  const [coachId, setCoachId] = useState<string | null>(null);
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
    visible: false,
    mode: 'noti',
    message: '',
  });

  const closeModal = useCallback(() => { // Nên dùng useCallback nếu truyền vào memo component
    setModalState((s) => ({
      ...s,
      visible: false,
    }));
  }, []);


  const fetchProfile = useCallback(async () => {
    try {
      const idString = await AsyncStorage.getItem('id');
      if (!idString) return;

      setCoachId(JSON.parse(idString));
      const data = await CoachService.getById(JSON.parse(idString));

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
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể tải hồ sơ');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updateField = useCallback((field: keyof CoachFormData) => (value: string) => {
    setFormData(prev => {
      if (prev[field] === value) return prev;
      return { ...prev, [field]: value };
    });
  }, []);

  const handleGenderSelect = useCallback((val: 'MALE' | 'FEMALE') => {
    setFormData(prev => {
      if (prev.gender === val) return prev;
      return { ...prev, gender: val };
    });
  }, []);

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-[#F8F9FA]">
        <ActivityIndicator size="large" color="#A0522D" />
      </View>
    );
  }





  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-[#F8F9FA]"
    >

      {/* HEADER */}
      <View className="flex-row justify-between items-center px-5 pt-12 pb-4 bg-white border-b border-gray-100 shadow-sm">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#5D4037" />
        </TouchableOpacity>

        <Text className="text-[#5D4037] text-lg font-extrabold">
          Hồ sơ của tôi
        </Text>

        <View className="flex-row items-center">
          {isEditing && (
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

          <TouchableOpacity
            onPress={async () => {
              if (!isEditing) {
                setIsEditing(true);
                return;
              }

              if (!coachId) {
                Alert.alert('Lỗi', 'Không tìm thấy thông tin huấn luyện viên.');
                return;
              }

              setSubmitting(true);
              try {
                await CoachService.updateProfile(coachId, {
                  ...formData,
                  age: Number(formData.age),
                  yearsOfExperience: Number(formData.yearsOfExperience),
                });

                setModalState({
                  visible: true,
                  mode: 'noti',
                  title: 'Thành công',
                  message: 'Lưu hồ sơ thành công!', // Dùng contentText
                  iconName: 'checkmark-circle',
                  iconBgColor: 'green',
                });
                setIsEditing(false);
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
            }}
            className="bg-[#A0522D] px-5 py-2 rounded-full"
          >
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
          <View className="relative">
            <Image
              source={{ uri: formData.avatarUrl || 'https://via.placeholder.com/150' }}
              className="w-24 h-24 rounded-full bg-gray-200 border-2 border-[#A0522D]/10"
            />
            {isEditing && (
              <View className="absolute bottom-0 right-0 bg-[#A0522D] p-1.5 rounded-full border-2 border-white">
                <Ionicons name="camera" size={14} color="white" />
              </View>
            )}
          </View>
        </View>

        {/* FORM */}
        <View className="px-4 py-4">
          <View className="bg-white rounded-[32px] p-6 shadow-sm shadow-black/5">

            <InputField label="Họ và tên" icon="person-outline" value={formData.fullName} onChange={updateField('fullName')} editable={isEditing} />

            <View className="flex-row space-x-4">
              <View className="flex-[0.8]">
                <InputField label="Tuổi" icon="calendar-outline" value={formData.age} onChange={updateField('age')} keyboardType="numeric" editable={isEditing} />
              </View>
              <GenderPicker
                selected={formData.gender}
                onSelect={handleGenderSelect}
                disabled={!isEditing}
              />
            </View>

            <InputField label="Lĩnh vực thế mạnh" icon="fitness-outline" value={formData.specialization} onChange={updateField('specialization')} editable={isEditing} />
            <InputField label="Kinh nghiệm (năm)" icon="ribbon-outline" value={formData.yearsOfExperience} onChange={updateField('yearsOfExperience')} keyboardType="numeric" editable={isEditing} />
            <InputField label="Tiểu sử" icon="book-outline" value={formData.bio} onChange={updateField('bio')} multiline editable={isEditing} />
            <InputField label="Chứng chỉ (Link)" icon="document-text-outline" value={formData.certificationsUrl} onChange={updateField('certificationsUrl')} editable={isEditing} />

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