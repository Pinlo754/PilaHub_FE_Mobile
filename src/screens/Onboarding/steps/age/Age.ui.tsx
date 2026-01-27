import React from 'react';
import {
  View,
  Text,
  Pressable,
  Animated,
  Dimensions,
} from 'react-native';
import { useAgeLogic, ITEM_WIDTH } from './Age.logic';

const SCREEN_WIDTH = Dimensions.get('window').width;
const PICKER_HEIGHT = 64;

export default function AgeUI() {
  const {
    ages,
    scrollX,
    selectedAge,
    onMomentumEnd,
    onNext,
    onBack,
  } = useAgeLogic();

  return (
    <View className="flex-1 bg-background ">
      {/* ===== HEADER ===== */}
      <Pressable onPress={onBack} className=" mb-6">
        <Text className="text-secondaryText text-base">← Quay lại</Text>
      </Pressable>

      <Text className="text-2xl font-semibold text-foreground text-center">
        Bạn Bao Nhiêu Tuổi?
      </Text>

      <Text className="text-sm text-secondaryText text-center mt-3 px-4">
        Lorem ipsum dolor sit amet, consectetur adipiscing elit,
        sed do eiusmod tempor incididunt ut labore.
      </Text>

      {/* ===== CENTER CONTENT ===== */}
      <View className="flex-1 justify-center items-center">
        {/* BIG AGE */}
        <View className="items-center mb-8">
          <Text className="text-8xl font-bold text-foreground">
            {selectedAge}
          </Text>

          {/* Arrow */}
          <View
            style={{
              width: 0,
              height: 0,
              marginTop: 14,
              borderLeftWidth: 14,
              borderRightWidth: 14,
              borderBottomWidth: 14,
              borderLeftColor: 'transparent',
              borderRightColor: 'transparent',
              borderBottomColor: '#A0522D',
            }}
          />
        </View>

        {/* ===== PICKER ===== */}
        <View
          style={{
            width: SCREEN_WIDTH - 48,
            height: PICKER_HEIGHT,
          }}
        >
          {/* Highlight box */}
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: (SCREEN_WIDTH - 48) / 2 - ITEM_WIDTH / 2,
              top: 0,
              width: ITEM_WIDTH,
              height: PICKER_HEIGHT,
              backgroundColor: '#F2B94C',
              borderRadius: 14,
            }}
          />

          <Animated.FlatList
            horizontal
            data={ages}
            keyExtractor={(item) => item.toString()}
            showsHorizontalScrollIndicator={false}
            snapToInterval={ITEM_WIDTH}
            decelerationRate="fast"
            onMomentumScrollEnd={onMomentumEnd}
            scrollEventThrottle={16}
            contentContainerStyle={{
              paddingHorizontal: (SCREEN_WIDTH - 48 - ITEM_WIDTH) / 2,
            }}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { x: scrollX } } }],
              { useNativeDriver: true }
            )}
            renderItem={({ item, index }) => {
              const inputRange = [
                (index - 1) * ITEM_WIDTH,
                index * ITEM_WIDTH,
                (index + 1) * ITEM_WIDTH,
              ];

              const scale = scrollX.interpolate({
                inputRange,
                outputRange: [0.9, 1.3, 0.9],
                extrapolate: 'clamp',
              });

              const opacity = scrollX.interpolate({
                inputRange,
                outputRange: [0.4, 1, 0.4],
                extrapolate: 'clamp',
              });

              const isSelected = item === selectedAge;

              return (
                <Animated.View
                  style={{
                    width: ITEM_WIDTH,
                    height: PICKER_HEIGHT,
                    transform: [{ scale }],
                    opacity,
                  }}
                  className="items-center justify-center"
                >
                  <Text
                    style={{
                      color: isSelected
                        ? '#FFFFFF'
                        : 'rgba(160,82,45,0.5)',
                      fontSize: 22,
                      fontWeight: '700',
                    }}
                  >
                    {item}
                  </Text>
                </Animated.View>
              );
            }}
          />
        </View>
      </View>

      {/* ===== CTA ===== */}
      <View className="mb-6">
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
