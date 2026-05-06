import React from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useInformationLogic } from './Information.logic';

export default function InformationUI() {
  const {
    avatar,
    fullName,
    onboardingData,
    setFullName,
    updateOnboardingField,
    pickAvatar,
    onNext,
    uploading,
    onBack,
    canContinue,
    validationMessage,
  } = useInformationLogic();

  const disabled = uploading || !canContinue;

  const ageValue =
    typeof onboardingData.age === 'number' ? String(onboardingData.age) : '';

  const weightValue =
    typeof onboardingData.weight === 'number'
      ? String(onboardingData.weight)
      : '';

  const heightValue =
    typeof onboardingData.height === 'number'
      ? String(onboardingData.height)
      : '';

  const handleNumberChange = (
    text: string,
    field: 'age' | 'weight' | 'height',
  ) => {
    const normalized = text.replace(',', '.');
    const value = Number(normalized);

    if (text.trim() === '') {
      updateOnboardingField(field, undefined);
      return;
    }

    if (!Number.isNaN(value)) {
      updateOnboardingField(field, value);
    }
  };

  return (
    <View className="flex-1 bg-background">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            className="flex-1"
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{
              paddingBottom: 180,
            }}
          >
            {/* HEADER */}
            <View className="px-6">
              <Pressable onPress={onBack} className="mb-6 pt-6">
                <Text className="text-secondaryText text-base">
                  ← Quay lại
                </Text>
              </Pressable>

              <Text className="text-xl font-semibold text-foreground text-center">
                Xác Nhận Thông Tin
              </Text>

              <Text className="text-sm text-secondaryText text-center mt-2 px-2">
                Kiểm tra lại thông tin đã chọn. Nếu có thông tin chưa đúng, bạn có thể sửa trực tiếp tại đây.
              </Text>
            </View>

            {/* AVATAR */}
            <View className="items-center mt-8 mb-6">
              <Pressable
                onPress={pickAvatar}
                disabled={uploading}
                className="relative items-center justify-center"
              >
                <Image
                  source={{
                    uri:
                      avatar ??
                      'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e',
                  }}
                  className="w-40 h-40 rounded-full border-4 border-white"
                />

                <View className="absolute right-2 bottom-2 w-11 h-11 bg-white rounded-full items-center justify-center shadow">
                  <Text className="text-foreground text-xl">✎</Text>
                </View>

                {uploading ? (
                  <View className="absolute inset-0 items-center justify-center bg-black/30 rounded-full">
                    <ActivityIndicator size="small" color="#fff" />
                  </View>
                ) : null}
              </Pressable>

              <Text className="text-secondaryText text-sm mt-3">
                Nhấn vào ảnh để thay đổi avatar
              </Text>
            </View>

            {/* PERSONAL INFO */}
            <View className="px-6 gap-4">
              <Text className="text-base font-semibold text-foreground">
                Thông tin cá nhân
              </Text>

              <Input
                label="Họ và tên"
                value={fullName}
                onChange={setFullName}
                placeholder="Nhập họ và tên của bạn"
              />

              {validationMessage ? (
                <Text className="text-red-500 -mt-2">
                  {validationMessage}
                </Text>
              ) : null}
            </View>

            {/* EDIT ONBOARDING INFO */}
            <View className="px-6 mt-6 gap-4">
              <Text className="text-base font-semibold text-foreground">
                Thông tin cơ thể
              </Text>

              {/* GENDER */}
              <View>
                <Text className="text-foreground text-sm mb-2">
                  Giới tính
                </Text>

                <View className="flex-row gap-3">
                  <Pressable
                    onPress={() => updateOnboardingField('gender', 'male')}
                    className={`flex-1 h-14 rounded-xl items-center justify-center border ${
                      onboardingData.gender === 'male'
                        ? 'bg-foreground border-foreground'
                        : 'bg-white border-background-sub2'
                    }`}
                  >
                    <Text
                      className={`font-semibold ${
                        onboardingData.gender === 'male'
                          ? 'text-white'
                          : 'text-foreground'
                      }`}
                    >
                      Nam
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => updateOnboardingField('gender', 'female')}
                    className={`flex-1 h-14 rounded-xl items-center justify-center border ${
                      onboardingData.gender === 'female'
                        ? 'bg-foreground border-foreground'
                        : 'bg-white border-background-sub2'
                    }`}
                  >
                    <Text
                      className={`font-semibold ${
                        onboardingData.gender === 'female'
                          ? 'text-white'
                          : 'text-foreground'
                      }`}
                    >
                      Nữ
                    </Text>
                  </Pressable>
                </View>
              </View>

              <Input
                label="Tuổi"
                value={ageValue}
                onChange={text => handleNumberChange(text, 'age')}
                placeholder="Nhập tuổi"
                keyboard="numeric"
                suffix="tuổi"
              />

              <Input
                label="Cân nặng"
                value={weightValue}
                onChange={text => handleNumberChange(text, 'weight')}
                placeholder="Nhập cân nặng"
                keyboard="decimal-pad"
                suffix={onboardingData.weightUnit ?? 'kg'}
              />

              <Input
                label="Chiều cao"
                value={heightValue}
                onChange={text => handleNumberChange(text, 'height')}
                placeholder="Nhập chiều cao"
                keyboard="numeric"
                suffix={onboardingData.heightUnit ?? 'cm'}
              />
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>

        {/* BOTTOM BAR */}
        <SafeAreaView
          edges={['bottom']}
          className="absolute left-0 right-0 bottom-0 bg-background border-t border-background-sub2"
        >
          <View className="px-6 pt-4 pb-4">
            <Pressable
              onPress={onNext}
              disabled={disabled}
              className={`h-14 rounded-xl ${
                disabled ? 'bg-gray-400' : 'bg-foreground'
              } items-center justify-center`}
            >
              <Text className="text-white font-semibold text-base">
                {uploading ? 'Đang tải...' : 'Tiếp tục'}
              </Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  );
}

function Input({
  label,
  value,
  onChange,
  keyboard,
  placeholder,
  autoCapitalize = 'sentences',
  suffix,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  keyboard?: any;
  placeholder?: string;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  suffix?: string;
}) {
  return (
    <View>
      <Text className="text-foreground text-sm mb-2">{label}</Text>

      <View className="h-14 px-4 rounded-xl bg-white flex-row items-center">
        <TextInput
          value={value}
          onChangeText={onChange}
          keyboardType={keyboard}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          autoCapitalize={autoCapitalize}
          returnKeyType="done"
          onSubmitEditing={Keyboard.dismiss}
          className="flex-1 text-foreground"
        />

        {suffix ? (
          <Text className="text-secondaryText font-medium ml-2">
            {suffix}
          </Text>
        ) : null}
      </View>
    </View>
  );
}