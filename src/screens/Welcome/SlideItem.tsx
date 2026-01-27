import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Props = {
  title: string;
  subtitle: string;
  showSkip: boolean;
  index: number;
  total: number;
  animatedIndex: Animated.Value;
  onNext: () => void;
  onSkip: () => void;
};

export default function SlideItem({
  title,
  subtitle,
  showSkip,
  index,
  total,
  animatedIndex,
  onNext,
  onSkip,
}: Props) {
  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* TOP INDICATOR */}
    <View className="items-center mt-4">
  <View className="flex-row gap-2">
    {Array.from({ length: total }).map((_, i) => {
      const scaleX = animatedIndex.interpolate({
        inputRange: [i - 1, i, i + 1],
        outputRange: [0.3, 1, 0.3],
        extrapolate: 'clamp',
      });

      const opacity = animatedIndex.interpolate({
        inputRange: [i - 1, i, i + 1],
        outputRange: [0.4, 1, 0.4],
        extrapolate: 'clamp',
      });

      return (
        <Animated.View
          key={i}
          style={{
            width: 28,              // ✅ FIXED WIDTH
            height: 4,
            borderRadius: 2,
            backgroundColor:'#A0522D',
            opacity,
            transform: [{ scaleX }], // 🔥 MAGIC HERE
          }}
        />
      );
    })}
  </View>
</View>


      {/* CONTENT */}
      <View className="flex-1 items-center justify-center px-6">
        <View className="w-56 h-56 bg-gray-400 rounded-2xl mb-8 items-center justify-center">
          <Text className="text-white">Animation</Text>
        </View>

        <Text className="text-2xl font-semibold text-center text-foreground mb-3">
          {title}
        </Text>

        <Text className="text-center text-secondaryText">
          {subtitle}
        </Text>
      </View>

      {/* FOOTER */}
      <View className="px-6 pb-6">
        {showSkip && (
          <TouchableOpacity onPress={onSkip} className="mb-3">
            <Text className="text-center text-gray-400">Bỏ qua</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          onPress={onNext}
          className="bg-foreground py-4 rounded-full items-center"
        >
          <Text className="text-white font-semibold text-base">
            {index === total - 1 ? 'Bắt đầu' : 'Tiếp tục'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
