import React, { useRef } from 'react';
import { View, Animated, Dimensions, Image, ImageSourcePropType } from 'react-native';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 32;

export default function BannerCarousel({ data }: { data: { id: string; image: string | ImageSourcePropType }[] }) {
  const scrollX = useRef(new Animated.Value(0)).current;

  return (
    <View className="mt-4 px-4">
      <Animated.FlatList
        data={data}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={CARD_WIDTH + 12}
        decelerationRate="fast"
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View className="mr-3 rounded-xl overflow-hidden bg-white h-36" style={{ width: CARD_WIDTH }}>
            <Image source={typeof item.image === 'string' ? { uri: item.image } : item.image} className="w-full h-full" resizeMode="cover" />
          </View>
        )}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false },
        )}
      />
    </View>
  );
}
