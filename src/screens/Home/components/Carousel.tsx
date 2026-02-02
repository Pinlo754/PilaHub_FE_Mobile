import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  Animated,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { CourseType } from '../../../utils/CourseType';

type Props = {
  data: CourseType[];
};

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 20;

const Carousel = ({ data }: Props) => {
  const scrollX = useRef(new Animated.Value(0)).current;
  const [index, setIndex] = useState(0);

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / CARD_WIDTH);
    setIndex(i);
  };

  return (
    <View>
      <Animated.FlatList
        data={data}
        horizontal
        pagingEnabled
        snapToInterval={CARD_WIDTH}
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        keyExtractor={item => item.course_id}
        onMomentumScrollEnd={onScrollEnd}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: true },
        )}
        renderItem={({ item, index: i }) => {
          const inputRange = [
            (i - 1) * CARD_WIDTH,
            i * CARD_WIDTH,
            (i + 1) * CARD_WIDTH,
          ];

          const translateX = scrollX.interpolate({
            inputRange,
            outputRange: [-30, 0, 30],
          });

          return (
            <View style={{ width: CARD_WIDTH }} className="pr-3">
              <View className="rounded-xl overflow-hidden h-[200px]">
                <Animated.Image
                  source={{ uri: item.thumbnail_url }}
                  style={{
                    width: '110%',
                    height: '100%',
                    transform: [{ translateX }],
                  }}
                  resizeMode="cover"
                />
              </View>

              <Text className="color-foreground text-lg font-bold mt-2">
                {item.course_name}
              </Text>
            </View>
          );
        }}
      />

      {/* Dots */}
      <View className="flex-row justify-center mt-2">
        {data.map((_, i) => (
          <View
            key={i}
            className={`mx-1 w-2 h-2 rounded-full ${
              i === index ? 'bg-foreground' : 'bg-background-sub2'
            }`}
          />
        ))}
      </View>
    </View>
  );
};

export default Carousel;
