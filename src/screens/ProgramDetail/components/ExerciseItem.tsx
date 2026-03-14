import Ionicons from '@react-native-vector-icons/ionicons';
import { Image, Pressable, Text, View } from 'react-native';
import { colors } from '../../../theme/colors';

const ExerciseItem = () => {
  return (
    <View>
      {/* Course Lesson */}
      <Pressable className="flex-row justify-between items-center gap-2 mt-3 border-t border-background-sub1 pt-3">
        {/* Icon */}
        {/* <Ionicons name="checkmark-circle" size={24} color={colors.foreground} /> */}
        <View className="rounded-full border border-foreground w-8 h-8 flex items-center justify-center">
          <Text className="color-foreground font-semibold">1</Text>
        </View>
        {/* Name */}
        <Text className="flex-grow color-foreground text-xl font-bold line-clamp-1 max-w-[320px]">
          Khởi Động & Kích Hoạt Trung Tâm Cơ Thể Khởi Động & Kích Hoạt Trung Tâm
          Cơ Thể
        </Text>
        {/* Arrow */}
        <Ionicons
          name="chevron-forward-outline"
          size={24}
          color={colors.foreground}
        />
      </Pressable>

      {/* Exercise */}
      <Pressable className="ml-4 flex-row justify-between items-center gap-3 mt-3">
        {/* Image */}
        <View className="w-20 h-14 rounded-lg overflow-hidden border border-transparent">
          <Image
            source={{
              uri: 'https://cdn.mos.cms.futurecdn.net/RSRmmWZGBcNnLLynabFD2Z.jpg',
            }}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
          />
        </View>

        {/* Name */}
        <View className="flex-grow">
          <Text className="color-foreground text-lg font-medium line-clamp-1 max-w-[240px]">
            Khởi Động & Kích Hoạt Trung Tâm Cơ Thể
          </Text>
          <Text className="color-secondaryText">30p</Text>
        </View>

        {/* Icon */}
        <View className="rounded-full bg-background-sub1 w-10 h-10 flex items-center justify-center">
          <Ionicons name="play" size={20} color={colors.foreground} />
        </View>
      </Pressable>
    </View>
  );
};

export default ExerciseItem;
