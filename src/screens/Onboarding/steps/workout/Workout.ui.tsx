import React from 'react';
import { View, Text, Pressable, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useWorkoutLogic, WorkoutFrequencyKey, WorkoutLevelKey } from './Workout.logic';
import { SafeAreaView } from 'react-native-safe-area-context';

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

  const disabled = !frequency || !level;

  return (
    <View className="flex-1 bg-background w-full">
      <Pressable onPress={onBack} className="mb-6  pt-6">
        <Text className="text-secondaryText text-base">← Quay lại</Text>
      </Pressable>

      <Text className="text-xl font-semibold text-foreground text-center px-6">
        Tần suất & Trình độ tập luyện
      </Text>

      <Text className="text-sm text-secondaryText text-center mt-2 px-6">
        Chọn tần suất luyện tập và trình độ để chúng tôi gợi ý bài tập phù hợp.
      </Text>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView
          className="mt-6"
          showsVerticalScrollIndicator={false}
        >
          <View className="px-6">
            <Text className="text-base font-semibold text-foreground mb-3">Tần suất</Text>
            {frequencies.map((f) => (
              <Pressable
                key={f.key}
                onPress={() => selectFrequency(f.key as WorkoutFrequencyKey)}
                className={`p-4 rounded-xl mb-3 border ${frequency === f.key ? 'bg-foreground/10 border-foreground' : 'bg-white border-background-sub2'}`}>
                <Text className="text-base text-foreground font-medium">{f.title}</Text>
                <Text className="text-sm text-secondaryText">{f.desc}</Text>
              </Pressable>
            ))}

            <Text className="text-base font-semibold text-foreground mb-3 mt-4">Trình độ</Text>
            {levels.map((l) => (
              <Pressable
                key={l.key}
                onPress={() => selectLevel(l.key as WorkoutLevelKey)}
                className={`p-4 rounded-xl mb-3 border ${level === l.key ? 'bg-foreground/10 border-foreground' : 'bg-white border-background-sub2'}`}>
                <Text className="text-base text-foreground font-medium">{l.title}</Text>
              </Pressable>
            ))}

            {/* spacer so content doesn't butt up against footer on very short screens */}
            <View className="mt-6 h-36" />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <SafeAreaView className="absolute left-0 right-0 bottom-0 px-6 py-4 bg-transparent">
        <View className="px-6">
          <Pressable
            onPress={onNext}
            disabled={disabled}
            className={`h-14 rounded-xl items-center justify-center ${!disabled ? 'bg-foreground' : 'bg-foreground/40'}`}>
            <Text className="text-white font-semibold text-base">Tiếp tục</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}
