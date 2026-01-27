import React from 'react'
import {
  View,
  Text,
  Pressable,
  Animated,
  Dimensions,
} from 'react-native'
import { useWeightLogic, ITEM_WIDTH } from './Weight.logic'

const SCREEN_WIDTH = Dimensions.get('window').width
const PICKER_HEIGHT = 70

export default function WeightUI() {
  const {
    weights,
    unit,
    displayWeight,
    scrollX,
    listRef,
    setUnit,
    onMomentumEnd,
    onNext,
    onBack,
  } = useWeightLogic()

  return (
    <View className="flex-1 bg-[#FFF8ED] ">
      {/* ===== Header ===== */}
      <Pressable onPress={onBack} className="mb-6">
        <Text className="text-foreground text-base">← Quay lại</Text>
      </Pressable>

      {/* ===== Title ===== */}
      <Text className="text-2xl font-semibold text-foreground text-center">
        Cân Nặng Của Bạn?
      </Text>

      <Text className="text-sm text-foreground text-center mt-3 px-6">
        Lorem ipsum dolor sit amet, consectetur adipiscing elit,
        sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
      </Text>

      {/* ===== Unit Switch ===== */}
      <View className="mt-10 bg-[#D28A45] rounded-2xl flex-row overflow-hidden">
        {['kg', 'lb'].map((u) => (
          <Pressable
            key={u}
            onPress={() => setUnit(u as 'kg' | 'lb')}
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

      {/* ===== Numbers (74 75 76) ===== */}
      <View className="mt-20 flex-row justify-center gap-10">
        {[displayWeight - 1, displayWeight, displayWeight + 1].map(
          (num, idx) => (
            <Text
              key={idx}
              className={`text-3xl font-semibold ${
                idx === 1
                  ? 'text-[#FF8C1A]'
                  : 'text-[#F5B98A]'
              }`}
            >
              {num}
            </Text>
          )
        )}
      </View>

      {/* ===== Scale ===== */}
      <View className="mt-4 items-center">
        <View
          className="rounded-xl overflow-hidden"
          style={{
            width: SCREEN_WIDTH - 48,
            height: PICKER_HEIGHT,
            backgroundColor: '#D28A45',
          }}
        >
          <Animated.FlatList
            ref={listRef}
            horizontal
            data={weights}
            keyExtractor={(item) => item.toString()}
            showsHorizontalScrollIndicator={false}
            snapToInterval={ITEM_WIDTH}
            decelerationRate="fast"
            onMomentumScrollEnd={onMomentumEnd}
            contentContainerStyle={{
              paddingHorizontal:
                (SCREEN_WIDTH - 48) / 2 - ITEM_WIDTH / 2,
            }}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { x: scrollX } } }],
              { useNativeDriver: false }
            )}
            renderItem={({ index }) => {
              const isMajor = index % 2 === 0
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
              )
            }}
          />
        </View>
      </View>

      {/* ===== Indicator + Result ===== */}
      <View className="mt-8 items-center">
        {/* Arrow */}
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

      {/* ===== Button ===== */}
      <View className="flex-1 justify-end mb-8">
        <Pressable
          onPress={onNext}
          className="h-14 rounded-xl bg-foreground items-center justify-center"
        >
          <Text className="text-white font-semibold text-lg">
            Tiếp tục
          </Text>
        </Pressable>
      </View>
    </View>
  )
}
