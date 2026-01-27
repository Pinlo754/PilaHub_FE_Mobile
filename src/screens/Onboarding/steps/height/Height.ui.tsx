import React from 'react';
import {
  View,
  Text,
  Animated,
  Pressable,
} from 'react-native';
import { useHeightLogic } from './Height.logic';

export default function HeightUI() {
  const {
    HEIGHTS,
    ITEM_HEIGHT,
    scrollY,
    listRef,
    currentIndex,
    currentHeight,
    onMomentumEnd,
    onNext,
    onBack,
  } = useHeightLogic();

  return (
    <View className="flex-1 bg-background ">
      {/* ===== BACK ===== */}
      <Pressable onPress={onBack} className="mb-6">
        <Text className="text-secondaryText text-base">← Quay lại</Text>
      </Pressable>

      {/* ===== TITLE ===== */}
      <Text className="text-xl font-semibold text-foreground text-center">
        Chiều Cao Của Bạn?
      </Text>

      <Text className="text-sm text-secondaryText text-center mt-2 px-6">
        Lorem ipsum dolor sit amet, consectetur adipiscing elit.
      </Text>

      {/* ===== VALUE ===== */}
      <Text className="text-6xl font-bold text-foreground text-center mt-10">
        {currentHeight}
        <Text className="text-lg font-semibold"> Cm</Text>
      </Text>

      {/* ===== RULER ===== */}
      <View className="mt-10 items-center">
        {/* viewport chỉ hiện 5 item */}
        <View
          style={{ height: ITEM_HEIGHT * 5 }}
          className="overflow-hidden"
        >
          <Animated.FlatList
            ref={listRef}
            data={HEIGHTS}
            keyExtractor={(i) => i.toString()}
            showsVerticalScrollIndicator={false}
            snapToInterval={ITEM_HEIGHT}
            decelerationRate="fast"
            onMomentumScrollEnd={onMomentumEnd}
            contentContainerStyle={{
              paddingVertical: ITEM_HEIGHT * 2,
            }}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { y: scrollY } } }],
              { useNativeDriver: false }
            )}
            renderItem={({ item, index }) => {
              const inputRange = [
                (index - 2) * ITEM_HEIGHT,
                index * ITEM_HEIGHT,
                (index + 2) * ITEM_HEIGHT,
              ];

              const opacity = scrollY.interpolate({
                inputRange,
                outputRange: [0.6, 1.3, 0.6],
                extrapolate: 'clamp',
              });

              const scale = scrollY.interpolate({
                inputRange,
                outputRange: [1.2, 1.4, 1.2],
                extrapolate: 'clamp',
              });

              const isActive = index === currentIndex;
              const isMajor = item % 5 === 0;

              return (
                <Animated.View
                  style={{
                    height: ITEM_HEIGHT,
                    opacity,
                    transform: [{ scale }],
                  }}
                  className="flex-row items-center"
                >
                  {/* ===== NUMBER ===== */}
                  <Text
                    className={`w-16 text-right text-2xl font-semibold ${
                      isActive
                        ? 'text-warning'
                        : 'text-warning/40'
                    }`}
                  >
                    {item}
                  </Text>

                  {/* ===== TICK ===== */}
                  <View className="mx-4 w-4 items-center">
                    <View
                      className={`bg-white rounded-full ${
                        isMajor ? 'h-8 w-[2px]' : 'h-4 w-[1px]'
                      }`}
                    />
                  </View>

                  {/* ===== ACTIVE INDICATOR ===== */}
                  {isActive && (
                    <View className="flex-row items-center">
                      {/* line */}
                      <View className="w-12 h-[2px] bg-warning mr-1" />
                   
                      
                      
                    </View>
                  )}
                </Animated.View>
              );
            }}
          />
        </View>
      </View>

      {/* ===== CONTINUE ===== */}
      <View className="flex-1 justify-end mb-6">
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
