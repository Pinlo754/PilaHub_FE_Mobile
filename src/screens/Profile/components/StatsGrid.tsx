import React from 'react';
import { View, Text } from 'react-native';

type Props = {
  stats: any;
};

export default function StatsGrid({ stats }: Props) {
  const { exercisesCount = 42, kcal = 3500, streak = 12, level = 'Trung cấp' } = stats || {};
  return (
    <View className="px-4 -mt-4">
      <Text className="text-sm font-medium text-gray-700 mb-2">Tổng quan</Text>
      <View className="flex-row flex-wrap -mx-2">
        {[{label: 'BÀI TẬP', value: exercisesCount},{label: 'KCAL', value: kcal},{label: 'CHUỖI NGÀY', value: `${streak} ngày`},{label: 'CẤP ĐỘ', value: level}].map((s)=> (
          <View key={s.label} className="w-1/2 p-2">
            <View className="bg-white rounded-lg p-4 shadow-sm">
              <Text className="text-xs text-gray-500">{s.label}</Text>
              <Text className="text-xl font-bold text-gray-800 mt-1">{s.value}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
