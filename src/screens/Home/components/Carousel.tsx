import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  Animated,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
} from 'react-native';
import { CourseType } from '../../../utils/CourseType';

type Props = {
  data: CourseType[];
  onPressCourse?: (course: CourseType) => void;
};

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 20;

const Carousel = ({ data, onPressCourse }: Props) => {
  const scrollX = useRef(new Animated.Value(0)).current;
  const [index, setIndex] = useState(0);

  console.log('CAROUSEL_DATA_COUNT:', data?.length);
  console.log('CAROUSEL_FIRST_ITEM:', JSON.stringify(data?.[0], null, 2));

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / CARD_WIDTH);
    setIndex(i);
  };

  const getCourseId = (item: any, i: number) => {
    return String(
      item?.courseId ??
        item?.course_id ??
        item?.id ??
        item?._id ??
        `course-${i}`,
    );
  };

  const getCourseName = (item: any) => {
    return (
      item?.courseName ??
      item?.course_name ??
      item?.name ??
      item?.title ??
      'Không có tên khóa học'
    );
  };

  const getCourseThumbnail = (item: any) => {
    return (
      item?.thumbnailUrl ??
      item?.thumbnail_url ??
      item?.imageUrl ??
      item?.image_url ??
      item?.image ??
      item?.thumbnail ??
      ''
    );
  };

  if (!Array.isArray(data) || data.length === 0) {
    return (
      <View className="py-4">
        <Text className="text-secondaryText text-sm">
          Chưa có khóa học nào
        </Text>
      </View>
    );
  }

  return (
    <View>
      <Animated.FlatList
        data={data}
        horizontal
        pagingEnabled
        snapToInterval={CARD_WIDTH}
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item, i) => getCourseId(item, i)}
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

          const courseName = getCourseName(item);
          const thumbnailUrl = getCourseThumbnail(item);

          console.log('RENDER_COURSE_ITEM:', {
            id: getCourseId(item, i),
            courseName,
            thumbnailUrl,
          });

          return (
            <Pressable
              onPress={() => onPressCourse?.(item)}
              style={{ width: CARD_WIDTH }}
              className="pr-3"
            >
              <View className="rounded-xl overflow-hidden h-[200px] bg-background-sub2">
                {thumbnailUrl ? (
                  <Animated.Image
                    source={{ uri: thumbnailUrl }}
                    style={{
                      width: '110%',
                      height: '100%',
                      transform: [{ translateX }],
                    }}
                    resizeMode="cover"
                  />
                ) : (
                  <View className="flex-1 items-center justify-center">
                    <Text className="text-secondaryText text-sm">
                      Không có ảnh
                    </Text>
                  </View>
                )}
              </View>

              <Text className="text-foreground text-lg font-bold mt-2">
                {courseName}
              </Text>
            </Pressable>
          );
        }}
      />

      <View className="flex-row justify-center mt-2">
        {data.map((item, i) => (
          <View
            key={`${getCourseId(item, i)}-dot`}
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