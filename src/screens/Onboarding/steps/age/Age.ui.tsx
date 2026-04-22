import React from 'react';
import {
  View,
  Text,
  Pressable,
  Animated,
  Dimensions,
  StyleSheet,
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
    listRef,
    canContinue,
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
        Nhập tuổi của bạn để chúng tôi tính các chỉ số phù hợp (ví dụ: BMR, khuyến nghị tập luyện). Bạn có thể cập nhật sau.
      </Text>

      {/* ===== CENTER CONTENT ===== */}
      <View className="flex-1 justify-center items-center">
        {/* BIG AGE */}
        <View className="items-center mb-8">
          <Text className="text-8xl font-bold text-foreground">
            {selectedAge}
          </Text>

          {/* Arrow */}
          <View style={styles.triangle} />
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
            style={[
              styles.highlightBox,
              { left: (SCREEN_WIDTH - 48) / 2 - ITEM_WIDTH / 2, width: ITEM_WIDTH },
            ]}
          />

          <Animated.FlatList
            ref={listRef}
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
            )
            }
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
                  <Text style={[styles.ageText, isSelected ? styles.ageTextSelected : styles.ageTextUnselected]}>
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
          disabled={!canContinue}
          className={`h-14 rounded-xl ${!canContinue ? 'bg-gray-400' : 'bg-foreground'} items-center justify-center`}
        >
          <Text className="text-white font-semibold text-base">
            Tiếp tục
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  triangle: {
    width: 0,
    height: 0,
    marginTop: 14,
    borderLeftWidth: 14,
    borderRightWidth: 14,
    borderBottomWidth: 14,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#A0522D',
  },
  highlightBox: {
    position: 'absolute',
    top: 0,
    width: ITEM_WIDTH,
    height: PICKER_HEIGHT,
    backgroundColor: '#F2B94C',
    borderRadius: 14,
  },
  ageText: {
    fontSize: 22,
    fontWeight: '700',
  },
  ageTextSelected: {
    color: '#FFFFFF',
  },
  ageTextUnselected: {
    color: 'rgba(160,82,45,0.5)',
  },
});
