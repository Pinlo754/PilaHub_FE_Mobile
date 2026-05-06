import { useRef, useState, useEffect, useMemo } from 'react';
import { Animated } from 'react-native';
import { useOnboardingStore } from '../../../../store/onboarding.store';

const MIN_AGE = 12;
const MAX_AGE = 80;
const DEFAULT_AGE = 21;

export const ITEM_WIDTH = 96;

export const useAgeLogic = () => {
  const { data, setData, step, setStep } = useOnboardingStore();

  const scrollX = useRef(new Animated.Value(0)).current;
  const listRef = useRef<Animated.FlatList<number> | null>(null);

  const ages = useMemo(() => {
    return Array.from(
      { length: MAX_AGE - MIN_AGE + 1 },
      (_, i) => MIN_AGE + i,
    );
  }, []);

  const getIndexFromAge = (age?: number) => {
    const value = typeof age === 'number' ? age : DEFAULT_AGE;
    const foundIndex = ages.findIndex(item => item === value);

    if (foundIndex >= 0) {
      return foundIndex;
    }

    return ages.findIndex(item => item === DEFAULT_AGE);
  };

  const initialIndex = getIndexFromAge(data.age);

  const [selectedIndex, setSelectedIndex] = useState<number>(initialIndex);

  const selectedAge = ages[selectedIndex] ?? DEFAULT_AGE;

  const getItemLayout = (_: any, index: number) => ({
    length: ITEM_WIDTH,
    offset: ITEM_WIDTH * index,
    index,
  });

  /**
   * Khi vào lại màn Age:
   * - Lấy age từ store
   * - Set lại selectedIndex
   * - Scroll thước về đúng vị trí
   *
   * Không dùng scrollToIndex + viewPosition nữa
   * vì dễ lệch với paddingHorizontal.
   */
  useEffect(() => {
    const index = getIndexFromAge(data.age);
    const offset = index * ITEM_WIDTH;

    setSelectedIndex(index);
    scrollX.setValue(offset);

    const timer = setTimeout(() => {
      try {
        listRef.current?.scrollToOffset({
          offset,
          animated: false,
        });
      } catch {}
    }, 80);

    return () => clearTimeout(timer);
  }, [data.age, ages, scrollX]);

  const syncSelectedByOffset = (offsetX: number) => {
    const rawIndex = Math.round(offsetX / ITEM_WIDTH);
    const safeIndex = Math.max(0, Math.min(ages.length - 1, rawIndex));

    setSelectedIndex(safeIndex);
    setData({ age: ages[safeIndex] });
  };

  /**
   * Chỉ dùng onMomentumScrollEnd.
   * Không dùng thêm onScrollEndDrag vì sẽ bị gọi 2 lần,
   * gây hiện tượng nhảy qua lại liên tục.
   */
  const onMomentumEnd = (e: any) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    syncSelectedByOffset(offsetX);
  };

  const onNext = () => {
    setData({ age: selectedAge });
    setStep(step + 1);
  };

  const onBack = () => {
    if (step > 0) {
      setData({ age: selectedAge });
      setStep(step - 1);
    }
  };

  const canContinue = typeof selectedAge === 'number' && !isNaN(selectedAge);

  return {
    ages,
    scrollX,
    listRef,
    selectedAge,
    selectedIndex,
    onMomentumEnd,
    onNext,
    onBack,
    initialIndex,
    getItemLayout,
    canContinue,
  };
};import React from 'react';
import {
  View,
  Text,
  Pressable,
  Dimensions,
  StyleSheet,
} from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;
const PICKER_WIDTH = SCREEN_WIDTH - 48;
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
    getItemLayout,
  } = useAgeLogic();

  return (
    <View className="flex-1 bg-background">
      {/* HEADER */}
      <Pressable onPress={onBack} className="mb-6">
        <Text className="text-secondaryText text-base">← Quay lại</Text>
      </Pressable>

      <Text className="text-2xl font-semibold text-foreground text-center">
        Bạn Bao Nhiêu Tuổi?
      </Text>

      <Text className="text-sm text-secondaryText text-center mt-3 px-4">
        Nhập tuổi của bạn để chúng tôi tính các chỉ số phù hợp như BMR và khuyến nghị tập luyện. Bạn có thể cập nhật sau.
      </Text>

      {/* CENTER CONTENT */}
      <View className="flex-1 justify-center items-center">
        {/* BIG AGE */}
        <View className="items-center mb-8">
          <Text className="text-8xl font-bold text-foreground">
            {selectedAge}
          </Text>

          <View style={styles.triangle} />
        </View>

        {/* PICKER */}
        <View
          style={{
            width: PICKER_WIDTH,
            height: PICKER_HEIGHT,
          }}
        >
          {/* HIGHLIGHT BOX */}
          <View
            pointerEvents="none"
            style={[
              styles.highlightBox,
              {
                left: PICKER_WIDTH / 2 - ITEM_WIDTH / 2,
                width: ITEM_WIDTH,
              },
            ]}
          />

          <Animated.FlatList
            ref={listRef}
            horizontal
            data={ages}
            keyExtractor={item => item.toString()}
            showsHorizontalScrollIndicator={false}
            snapToInterval={ITEM_WIDTH}
            decelerationRate="fast"
            bounces={false}
            getItemLayout={getItemLayout}
            onMomentumScrollEnd={onMomentumEnd}
            scrollEventThrottle={16}
            contentContainerStyle={{
              paddingHorizontal: (PICKER_WIDTH - ITEM_WIDTH) / 2,
            }}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { x: scrollX } } }],
              { useNativeDriver: true },
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
                    style={[
                      styles.ageText,
                      isSelected
                        ? styles.ageTextSelected
                        : styles.ageTextUnselected,
                    ]}
                  >
                    {item}
                  </Text>
                </Animated.View>
              );
            }}
          />
        </View>
      </View>

      {/* CTA */}
      <View className="mb-6">
        <Pressable
          onPress={onNext}
          disabled={!canContinue}
          className={`h-14 rounded-xl ${
            !canContinue ? 'bg-gray-400' : 'bg-foreground'
          } items-center justify-center`}
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