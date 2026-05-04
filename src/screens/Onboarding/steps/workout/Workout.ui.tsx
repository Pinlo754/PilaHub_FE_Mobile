import React from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  useWorkoutLogic,
  WorkoutFrequencyKey,
  WorkoutLevelKey,
} from './Workout.logic';
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
    <SafeAreaView className="flex-1 bg-background w-full">
      {/* CONTENT */}
      <View className="flex-1">
        <Pressable onPress={onBack} >
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
            contentContainerStyle={{
              paddingBottom: 140,
            }}
          >
            <View className="px-6">
              <Text className="text-base font-semibold text-foreground mb-3">
                Tần suất
              </Text>

              {frequencies.map(f => {
                const selected = frequency === f.key;

                return (
                  <Pressable
                    key={f.key}
                    onPress={() =>
                      selectFrequency(f.key as WorkoutFrequencyKey)
                    }
                    className={`p-4 rounded-xl mb-3 border ${
                      selected
                        ? 'bg-foreground/10 border-foreground'
                        : 'bg-white border-background-sub2'
                    }`}
                  >
                    <Text className="text-base text-foreground font-medium">
                      {f.title}
                    </Text>

                    <Text className="text-sm text-secondaryText mt-1">
                      {f.desc}
                    </Text>
                  </Pressable>
                );
              })}

              <Text className="text-base font-semibold text-foreground mb-3 mt-4">
                Trình độ
              </Text>

              {levels.map(l => {
                const selected = level === l.key;

                return (
                  <Pressable
                    key={l.key}
                    onPress={() => selectLevel(l.key as WorkoutLevelKey)}
                    className={`p-4 rounded-xl mb-3 border ${
                      selected
                        ? 'bg-foreground/10 border-foreground'
                        : 'bg-white border-background-sub2'
                    }`}
                  >
                    <Text className="text-base text-foreground font-medium">
                      {l.title}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>

      {/* BOTTOM BAR */}
      <SafeAreaView
        edges={['bottom']}
        className="absolute left-0 right-0 bottom-0 bg-background border-t border-background-sub2"
      >
        <View className="px-6 pt-4 pb-4">
          <Pressable
            onPress={onNext}
            disabled={disabled}
            className={`h-14 rounded-xl items-center justify-center ${
              disabled ? 'bg-foreground/40' : 'bg-foreground'
            }`}
          >
            <Text className="text-white font-semibold text-base">
              Tiếp tục
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </SafeAreaView>
  );
}