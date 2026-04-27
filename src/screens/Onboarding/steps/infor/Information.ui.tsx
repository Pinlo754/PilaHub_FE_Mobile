import React from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Image,
  ActivityIndicator,
} from 'react-native';
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

  return (
    <View className="flex-1 bg-background">
      {/* HEADER */}
      
        <Pressable onPress={onBack} className="mb-6">
          <Text className="text-secondaryText text-base">← Quay lại</Text>
        </Pressable>

        <Text className="text-xl font-semibold text-foreground text-center">
          Điền Thông Tin
        </Text>

        <Text className="text-sm text-secondaryText text-center mt-2 px-6">
          Cung cấp vài thông tin cơ bản để chúng tôi cá nhân hoá gợi ý bài tập, chế độ và lộ trình phù hợp với bạn. Bạn có thể chỉnh sửa sau bất kỳ lúc nào.
        </Text>
      

      {/* LARGE AVATAR — moved to top and enlarged */}
      <View className="items-center mt-16 mb-12">
        <Pressable onPress={pickAvatar} className="relative items-center justify-center">
          <Image
            source={{ uri: avatar ?? 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e' }}
            className="w-64 h-64 rounded-full border-4 border-white"
          />

          <View className="absolute right-5 bottom-5 w-14 h-14 bg-white rounded-full items-center justify-center shadow">
            <Text className="text-foreground text-2xl">✎</Text>
          </View>

          {uploading && (
            <View className="absolute inset-0 items-center justify-center bg-black/30 rounded-full">
              <ActivityIndicator size="small" color="#fff" />
            </View>
          )}
        </Pressable>
      </View>

      {/* FORM (name input placed below avatar) */}
      <View className="mt-12 px-6 space-y-4">
        <Input label="Họ và tên" value={fullName} onChange={setFullName} />
        {validationMessage ? <Text className="text-red-500">{validationMessage}</Text> : null}
      </View>

      {/* BUTTON */}
      <View className="flex-1 justify-end px-6 mb-6">
        <Pressable
          onPress={onNext}
          disabled={uploading || !canContinue}
          className={`h-14 rounded-xl ${uploading || !canContinue ? 'bg-gray-400' : 'bg-foreground'} items-center justify-center`}
        >
          <Text className="text-white font-semibold text-base">
            {uploading ? 'Đang tải...' : 'Tiếp tục'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

/* ===== INPUT COMPONENT ===== */
function Input({
  label,
  value,
  onChange,
  keyboard,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  keyboard?: any;
}) {
  return (
    <View>
      <Text className="text-foreground text-sm mb-1">{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        keyboardType={keyboard}
        className="h-14 px-4 rounded-xl bg-white text-foreground"
      />
    </View>
  );
}
