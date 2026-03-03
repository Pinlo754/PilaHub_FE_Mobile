import React from 'react';
import { View, Text } from 'react-native';

type Props = { weeklyMinutes?: number };

export default function ActivityChart({ weeklyMinutes = 145 }: Props) {
  return (
    <View className="p-4 -mt-2">
      <Text className="text-sm text-gray-700 mb-2">Hoạt động tuần này</Text>
      <View className="flex-row items-center justify-between">
        <Text className="text-2xl font-bold">{weeklyMinutes} phút</Text>
        <View className="bg-amber-100 px-3 py-1 rounded-full">
          <Text className="text-amber-800">Xem biểu đồ</Text>
        </View>
      </View>
      <View className="flex-row justify-between mt-4">
        {['T2','T3','T4','T5','T6','T7','CN'].map((d,i)=> (
          <View key={d} className="items-center">
            <View className={`${i===3? 'bg-amber-700 h-16' : 'bg-gray-300 h-10'} w-6 rounded`} />
            <Text className="text-xs mt-1">{d}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
