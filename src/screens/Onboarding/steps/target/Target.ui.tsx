import React from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
} from 'react-native';
import { useTargetLogic } from './Target.logic';

export default function TargetUI() {
  const {
    targets,
    selected,
    toggleTarget,
    onFinish,
    onBack,
    allowMulti,
  } = useTargetLogic();

  return (
    <View className="flex-1 bg-background w-full">
      {/* BACK */}
      <Pressable onPress={onBack} className="mb-6 ">
        <Text className="text-secondaryText text-base">← Quay lại</Text>
      </Pressable>

      {/* TITLE */}
      <Text className="text-xl font-semibold text-foreground text-center">
        Mục Tiêu Của Bạn?
      </Text>

      <Text className="text-sm text-secondaryText text-center mt-2 px-6">
        {allowMulti
          ? 'Bạn có thể chọn nhiều mục tiêu'
          : 'Chọn 1 mục tiêu phù hợp nhất'}
      </Text>

      {/* TARGET LIST */}
      <ScrollView
        className="mt-10"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        <View className=" items-center ">
          {targets.map((item) => {
            const isActive = selected.includes(item.key);

            return (
              <Pressable
                key={item.key}
                onPress={() => toggleTarget(item.key)}
                className={`flex-row items-center p-4 w-full max-w-[420px] mb-4 rounded-xl border shadow-sm  ${
                  isActive
                    ? 'bg-warning/20 border-warning'
                    : 'bg-white border-background-sub2 '
                }`}
              >
                {/* ICON */}
                <Text className="text-2xl mr-4">{item.icon}</Text>

                {/* TEXT */}
                <View className="flex-1">
                  <Text className="text-base font-semibold text-foreground">
                    {item.title}
                  </Text>
                  <Text className="text-sm text-secondaryText">
                    {item.description}
                  </Text>
                </View>

                {/* CHECK */}
                {isActive && (
                  <Text className="text-warning text-xl">✓</Text>
                )}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      {/* CONTINUE */}
      <View className="mt-6 mb-6 px-6 w-full">
        <Pressable
          onPress={onFinish}
          disabled={selected.length === 0}
          className={`h-14 rounded-xl items-center justify-center ${
            selected.length
              ? 'bg-foreground'
              : 'bg-foreground/40'
          }`}
        >
          <Text className="text-white font-semibold text-base">
            Hoàn tất
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
