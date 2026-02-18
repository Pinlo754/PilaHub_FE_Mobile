import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useWorkoutLogic } from './Workout.logic';

export default function WorkoutUI() {
  const {
    frequencies,
    levels,
    frequency,
    level,
    selectFrequency,
    selectLevel,
    onBack,
    onNext,
  } = useWorkoutLogic();

  return (
    <View className="flex-1 bg-background w-full">
      <Pressable onPress={onBack} className="mb-6 ">
        <Text className="text-secondaryText text-base">← Quay lại</Text>
      </Pressable>

      <Text className="text-xl font-semibold text-foreground text-center">
        Tần suất & Trình độ tập luyện
      </Text>

      <Text className="text-sm text-secondaryText text-center mt-2 px-6">
        Chọn tần suất luyện tập và trình độ để chúng tôi gợi ý bài tập phù hợp.
      </Text>

      <ScrollView className="mt-6" showsVerticalScrollIndicator={false}>
        <View className="px-6">
          <Text className="text-base font-semibold text-foreground mb-3">Tần suất</Text>
          {frequencies.map((f) => (
            <Pressable
              key={f.key}
              onPress={() => selectFrequency(f.key)}
              className={`p-4 rounded-xl mb-3 border ${frequency === f.key ? 'bg-foreground/10 border-foreground' : 'bg-white border-background-sub2'}`}>
              <Text className="text-base text-foreground font-medium">{f.title}</Text>
              <Text className="text-sm text-secondaryText">{f.desc}</Text>
            </Pressable>
          ))}

          <Text className="text-base font-semibold text-foreground mb-3 mt-4">Trình độ</Text>
          {levels.map((l) => (
            <Pressable
              key={l.key}
              onPress={() => selectLevel(l.key)}
              className={`p-4 rounded-xl mb-3 border ${level === l.key ? 'bg-foreground/10 border-foreground' : 'bg-white border-background-sub2'}`}>
              <Text className="text-base text-foreground font-medium">{l.title}</Text>
            </Pressable>
          ))}

          <View className="mt-6 mb-6">
            <Pressable
              onPress={onNext}
              disabled={!frequency || !level}
              className={`h-14 rounded-xl items-center justify-center ${frequency && level ? 'bg-foreground' : 'bg-foreground/40'}`}>
              <Text className="text-white font-semibold text-base">Tiếp tục</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
