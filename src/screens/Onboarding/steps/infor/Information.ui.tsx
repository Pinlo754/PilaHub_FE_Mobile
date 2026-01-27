import React from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Image,
} from 'react-native';
import { useInformationLogic } from './Information.logic';

export default function InformationUI() {
  const {
    avatar,
    fullName,
    nickname,
    email,
    phone,
    setFullName,
    setNickname,
    setEmail,
    setPhone,
    pickAvatar,
    onNext,
    onBack,
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
          Lorem ipsum dolor sit amet, consectetur adipiscing elit,
          sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
        </Text>
      

      {/* AVATAR */}
      <View className="mt-6 bg-warning h-44 items-center justify-center">
        <Pressable onPress={pickAvatar} className="relative">
          <Image
            source={{
              uri:
                avatar ??
                'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e',
            }}
            className="w-28 h-28 rounded-full"
          />

          <View className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full items-center justify-center">
            <Text className="text-foreground text-base">✎</Text>
          </View>
        </Pressable>
      </View>

      {/* FORM */}
      <View className=" mt-6 space-y-4 ">
        <Input label="Họ và tên" value={fullName} onChange={setFullName} />
        <Input label="Nickname" value={nickname} onChange={setNickname} />
        <Input 
          label="Email"
          value={email}
          onChange={setEmail}
          keyboard="email-address"
        />
        <Input
          label="Số điện thoại"
          value={phone}
          onChange={setPhone}
          keyboard="phone-pad"
        />
      </View>

      {/* BUTTON */}
      <View className="flex-1 justify-end px-6 mb-6">
        <Pressable
          onPress={onNext}
          className="h-14 rounded-xl bg-foreground items-center justify-center"
        >
          <Text className="text-white font-semibold text-base">
            Tiếp tục
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
