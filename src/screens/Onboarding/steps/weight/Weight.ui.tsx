import React from 'react';
import {
  View,
  Text,
  Pressable,
  Animated,
  Dimensions,
  StyleSheet,
} from 'react-native';
import { useWeightLogic, ITEM_WIDTH } from './Weight.logic';

const SCREEN_WIDTH = Dimensions.get('window').width;
const PICKER_WIDTH = SCREEN_WIDTH - 48;
const PICKER_HEIGHT = 70;

export default function WeightUI() {
  const {
    weights,
    unit,
    displayWeight,
    prevDisplayWeight,
    nextDisplayWeight,
    listRef,
    setUnit,
    onScroll,
    onMomentumEnd,
    onNext,
    onBack,
    getItemLayout,
    canContinue,
  } = useWeightLogic();

  return (
    <View className="flex-1 bg-[#FFF8ED]">
      {/* HEADER */}
      <Pressable onPress={onBack} className="mb-6">
        <Text className="text-foreground text-base">← Quay lại</Text>
      </Pressable>

      {/* TITLE */}
      <Text className="text-2xl font-semibold text-foreground text-center">
        Cân Nặng Của Bạn?
      </Text>

      <Text className="text-sm text-secondaryText text-center mt-3 px-6">
        Nhập cân nặng của bạn để cải thiện độ chính xác của BMI và gợi ý dinh dưỡng. Có thể cập nhật sau.
      </Text>

      {/* UNIT SWITCH */}
      <View className="mt-10 bg-[#D28A45] rounded-2xl flex-row overflow-hidden">
        {(['kg', 'lb'] as const).map(u => (
          <Pressable
            key={u}
            onPress={() => setUnit(u)}
            className={`flex-1 py-4 items-center ${
              unit === u ? 'bg-[#9A4F1E]' : ''
            }`}
          >
            <Text className="text-white font-semibold text-lg">
              {u.toUpperCase()}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* NUMBERS */}
      <View className="mt-20 flex-row justify-center gap-10">
        <Text className="text-3xl font-semibold text-[#F5B98A]">
          {prevDisplayWeight}
        </Text>

        <Text className="text-3xl font-semibold text-[#FF8C1A]">
          {displayWeight}
        </Text>

        <Text className="text-3xl font-semibold text-[#F5B98A]">
          {nextDisplayWeight}
        </Text>
      </View>

      {/* SCALE */}
      <View className="mt-4 items-center">
        <View
          className="rounded-xl overflow-hidden"
          style={[
            styles.scaleContainer,
            {
              width: PICKER_WIDTH,
              height: PICKER_HEIGHT,
            },
          ]}
        >
          <Animated.FlatList
            ref={listRef}
            horizontal
            data={weights}
            keyExtractor={item => item.toString()}
            showsHorizontalScrollIndicator={false}
            snapToInterval={ITEM_WIDTH}
            decelerationRate="fast"
            bounces={false}
            getItemLayout={getItemLayout}
            onMomentumScrollEnd={onMomentumEnd}
            scrollEventThrottle={16}
            contentContainerStyle={{
              paddingHorizontal: PICKER_WIDTH / 2 - ITEM_WIDTH / 2,
            }}
            onScroll={onScroll}
            renderItem={({ index }) => {
              const isMajor = index % 2 === 0;

              return (
                <View
                  style={{ width: ITEM_WIDTH }}
                  className="items-center justify-center"
                >
                  <View
                    className={`bg-white ${
                      isMajor ? 'h-8 w-[2px]' : 'h-4 w-[1px]'
                    }`}
                  />
                </View>
              );
            }}
          />
        </View>
      </View>

      {/* INDICATOR + RESULT */}
      <View className="mt-8 items-center">
        <View
          className="mb-3 w-0 h-0
          border-l-[12px] border-r-[12px] border-b-[14px]
          border-l-transparent border-r-transparent border-b-[#D28A45]"
        />

        <Text className="text-6xl font-bold text-[#9A4F1E]">
          {displayWeight}
          <Text className="text-2xl font-semibold"> {unit}</Text>
        </Text>
      </View>

      {/* BUTTON */}
      <View className="flex-1 justify-end mb-8">
        <Pressable
          onPress={onNext}
          disabled={!canContinue}
          className={`h-14 rounded-xl ${
            !canContinue ? 'bg-gray-400' : 'bg-foreground'
          } items-center justify-center`}
        >
          <Text className="text-white font-semibold text-lg">
            Tiếp tục
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scaleContainer: {
    backgroundColor: '#D28A45',
  },
});