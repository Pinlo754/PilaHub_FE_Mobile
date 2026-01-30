import React from 'react';
import { View, Text, Pressable } from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { colors } from '../../../theme/colors';
import { CourseType } from '../../../utils/CourseType';
import Carousel from './Carousel';

type Props = {
  data: CourseType[];
};

const RecommendCourse = ({ data }: Props) => {
  return (
    <View className="mx-4 mt-2">
      {/* Header */}
      <Pressable className="flex-row gap-4 items-center mb-2">
        <Text className="color-foreground text-lg font-semibold">
          Đề xuất khóa học
        </Text>
        <Ionicons name="settings-outline" size={20} color={colors.foreground} />
      </Pressable>

      {/* List */}
      <Carousel data={data} />
    </View>
  );
};

export default RecommendCourse;
