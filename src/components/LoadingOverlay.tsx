import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';

type Props = {
  message?: string;
};

export default function LoadingOverlay({ message = 'Đang xử lý...' }: Props) {
  return (
    <View className="absolute inset-0 bg-black/50 z-50 flex items-center justify-center">
      <View className="p-5 bg-white rounded-lg w-4/5 items-center">
        <ActivityIndicator size="large" color="#CD853F" />
        <Text className="mt-3 text-base text-gray-800 text-center">{message}</Text>
      </View>
    </View>
  );
}
