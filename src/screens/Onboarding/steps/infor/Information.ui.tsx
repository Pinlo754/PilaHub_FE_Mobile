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
    setFullName,
    pickAvatar,
    onNext,
    uploading,
    onBack,
    canContinue,
    validationMessage,
  } = useInformationLogic();

  const disabled = uploading || !canContinue;

  return (
    <SafeAreaView className="flex-1 bg-background">
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
              paddingBottom: 140,
            }}
          >
            {/* HEADER */}
            <View >
              <Pressable onPress={onBack} >
                <Text className="text-secondaryText text-base">
                  ← Quay lại
                </Text>
              </Pressable>

              <Text className="text-xl font-semibold text-foreground text-center">
                Điền Thông Tin
              </Text>

              <Text className="text-sm text-secondaryText text-center mt-2 px-2">
                Cung cấp vài thông tin cơ bản để chúng tôi cá nhân hoá gợi ý bài tập, chế độ và lộ trình phù hợp với bạn. Bạn có thể chỉnh sửa sau bất kỳ lúc nào.
              </Text>
            </View>

            {/* AVATAR */}
            <View className="items-center mt-12 mb-10">
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
                  className="w-56 h-56 rounded-full border-4 border-white"
                />

                <View className="absolute right-4 bottom-4 w-14 h-14 bg-white rounded-full items-center justify-center shadow">
                  <Text className="text-foreground text-2xl">✎</Text>
                </View>

                {uploading ? (
                  <View className="absolute inset-0 items-center justify-center bg-black/30 rounded-full">
                    <ActivityIndicator size="small" color="#fff" />
                  </View>
                ) : null}
              </Pressable>
            </View>

            {/* FORM */}
            <View className="px-6">
              <Input
                label="Họ và tên"
                value={fullName}
                onChange={setFullName}
                placeholder="Nhập họ và tên của bạn"
              />

              {validationMessage ? (
                <Text className="text-red-500 mt-2">
                  {validationMessage}
                </Text>
              ) : null}
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
    </SafeAreaView>
  );
}

/* ===== INPUT COMPONENT ===== */
function Input({
  label,
  value,
  onChange,
  keyboard,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  keyboard?: any;
  placeholder?: string;
}) {
  return (
    <View>
      <Text className="text-foreground text-sm mb-2">{label}</Text>

      <TextInput
        value={value}
        onChangeText={onChange}
        keyboardType={keyboard}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        returnKeyType="done"
        onSubmitEditing={Keyboard.dismiss}
        className="h-14 px-4 rounded-xl bg-white text-foreground"
      />
    </View>
  );
}