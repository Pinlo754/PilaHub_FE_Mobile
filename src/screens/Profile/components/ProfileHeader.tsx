import React from 'react';
import { Pressable, Image, Text, View } from 'react-native';

type Props = {
  profile: any;
  onEdit: () => void;
  onAvatarPress?: () => void;
  onAvatarEdit?: () => void;
};

export default function ProfileHeader({ profile, onEdit, onAvatarPress, onAvatarEdit }: Props) {
  const avatar = profile?.avatar ?? profile?.avatarUrl ?? 'https://www.toponseek.com/wp-content/uploads/2024/07/celeb-la-gi-6.jpg';
  const name = profile?.fullName ?? profile?.name ?? 'Nguyễn Văn A';
  const walletBalance = profile?.walletBalance ?? '2,450,000';

  return (
    <View className="bg-amber-50 pb-6">
      <View className="items-center pt-8">
        <View className="relative">
          <Pressable onPress={onAvatarPress} className="w-32 h-32 rounded-full overflow-hidden bg-white shadow-lg">
            <Image source={{ uri: avatar }} className="w-full h-full"/>
          </Pressable>

          {/* edit icon overlay */}
          <Pressable onPress={onAvatarEdit} className="absolute right-0 bottom-0 w-10 h-10 rounded-full bg-amber-700 items-center justify-center shadow" style={{ transform: [{ translateX: 6 }, { translateY: 6 }] }}>
            <Text className="text-white font-bold">📷</Text>
          </Pressable>
        </View>

        <Text className="mt-4 text-2xl font-extrabold text-amber-700">{name}</Text>

        <Pressable onPress={onEdit} className="mt-3 px-4 py-2 rounded-full border border-amber-200 bg-amber-100">
          <Text className="text-amber-800 font-medium">Chỉnh sửa</Text>
        </Pressable>

        <View className="mt-5 bg-white rounded-xl px-5 py-3 w-11/12 flex-row justify-between items-center shadow">
          <View>
            <Text className="text-xs text-gray-500">Số dư ví</Text>
            <Text className="text-lg font-semibold">{walletBalance}₫</Text>
          </View>
          <View>
            <Text className="text-sm text-gray-600">Xem chi tiết</Text>
          </View>
        </View>
      </View>
    </View>
  );
}
