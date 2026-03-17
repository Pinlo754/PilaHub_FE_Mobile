import React, { useRef } from "react";
import { Dimensions, Text } from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  SharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";

const { width } = Dimensions.get("window");

const ITEM_WIDTH = width * 0.7;
const SPACING = 16;
const SIDE_SPACING = (width - ITEM_WIDTH) / 2;

type Stage = {
  stageName: string;
  durationWeeks: number;
};

type Props = {
  stages: Stage[];
  onChangeIndex?: (index: number) => void;
  selectedIndex?: number;
};

const StageItem = ({
  item,
  index,
  scrollX,
  selectedIndex,
}: {
  item: Stage;
  index: number;
  scrollX: SharedValue<number>;
  selectedIndex?: number;
}) => {
  const animatedStyle = useAnimatedStyle(() => {
    const position = index * (ITEM_WIDTH + SPACING);

    const distance = Math.abs(scrollX.value - position);

    const scale = interpolate(
      distance,
      [0, ITEM_WIDTH],
      [1, 0.85],
      Extrapolation.CLAMP
    );

    const opacity = interpolate(
      distance,
      [0, ITEM_WIDTH],
      [1, 0.5],
      Extrapolation.CLAMP
    );

    return {
      transform: [{ scale }],
      opacity,
    };
  });

  const focusStyle =
    index === selectedIndex
      ? { borderColor: "#8B4513", borderWidth: 2 }
      : { borderColor: "#E5E7EB", borderWidth: 1 };

  return (
    <Animated.View
      style={[
        {
          width: ITEM_WIDTH,
          marginRight: SPACING,
        },
        animatedStyle,
        focusStyle,
      ]}
      className="bg-white rounded-2xl p-4 shadow-sm"
    >
      <Text className="text-md font-semibold">{item.stageName}</Text>
      <Text className="text-sm text-secondaryText mt-1">
        {item.durationWeeks} tuần
      </Text>
    </Animated.View>
  );
};

export default function StageCarousel({
  stages,
  onChangeIndex,
  selectedIndex,
}: Props) {
  const scrollX = useSharedValue(0);
  const flatListRef = useRef<Animated.FlatList<Stage>>(null);

  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  return (
    <Animated.FlatList
      ref={flatListRef}
      data={stages}
      keyExtractor={(_, i) => String(i)}
      horizontal
      showsHorizontalScrollIndicator={false}
      snapToInterval={ITEM_WIDTH + SPACING}
      decelerationRate="fast"
      bounces={false}
      contentContainerStyle={{
        paddingHorizontal: SIDE_SPACING,
      }}
      onScroll={onScroll}
      scrollEventThrottle={16}
      // notify parent when user finishes scrolling to a snapped item
      onMomentumScrollEnd={(e) => {
        const offsetX = e.nativeEvent.contentOffset.x || 0;
        const idx = Math.round(offsetX / (ITEM_WIDTH + SPACING));
        if (typeof onChangeIndex === "function") onChangeIndex(idx);
      }}
      renderItem={({ item, index }) => (
        <StageItem
          item={item}
          index={index}
          scrollX={scrollX}
          selectedIndex={selectedIndex}
        />
      )}
    />
  );
}