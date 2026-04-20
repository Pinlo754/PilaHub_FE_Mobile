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
  selected: Gender;
  onSelect: (val: Gender) => void;
  disabled?: boolean;
}

type Gender = 'MALE' | 'FEMALE';

const genderOptions: { label: string; value: Gender }[] = [
  { label: 'Nam', value: 'MALE' },
  { label: 'Nữ', value: 'FEMALE' }
];

const GenderPicker = memo(({ selected }: { selected: 'MALE' | 'FEMALE' }) => {
  const isMale = selected === 'MALE';
  return (
    <View className="  ml-auto">
      <Text className="text-gray-400 text-[10px] font-bold mb-1 uppercase tracking-tighter">
        Giới tính
      </Text>
      <View className="flex-row bg-gray-100 p-1 rounded-xl h-[45px] items-center px-4">
        <Ionicons 
          name={isMale ? "male-outline" : "female-outline"} 
          size={16} 
          color="#9CA3AF" 
        />
        <Text className="ml-2 text-gray-400 text-sm font-medium">
          {isMale ? 'Nam' : 'Nữ'}
        </Text>
      </View>
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

                Alert.alert('Thành công', 'Đã lưu thay đổi');
                setIsEditing(false);
              } catch (e) {
                Alert.alert('Lỗi', 'Lưu thất bại');
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
              <GenderPicker selected={formData.gender} />
            </View>

            <InputField label="Lĩnh vực thế mạnh" icon="fitness-outline" value={formData.specialization} onChange={updateField('specialization')} editable={isEditing} />
            <InputField label="Kinh nghiệm (năm)" icon="ribbon-outline" value={formData.yearsOfExperience} onChange={updateField('yearsOfExperience')} keyboardType="numeric" editable={isEditing} />
            <InputField label="Tiểu sử" icon="book-outline" value={formData.bio} onChange={updateField('bio')} multiline editable={isEditing} />
            <InputField label="Chứng chỉ (Link)" icon="document-text-outline" value={formData.certificationsUrl} onChange={updateField('certificationsUrl')} editable={isEditing} />

          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default CoachProfileScreen;