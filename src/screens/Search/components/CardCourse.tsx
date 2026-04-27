import { Pressable, Text, View } from 'react-native';
import { CourseWithEnroll } from '../../../utils/CourseType';
import MaskedImgWithHole from '../../../components/MaskedImgWithHole';
import Ionicons from '@react-native-vector-icons/ionicons';
import { getLevelNumber } from '../../../utils/uiMapper';
import { colors } from '../../../theme/colors';
import { formatVND } from '../../../utils/number';

type Props = {
  item: CourseWithEnroll;
  onPress?: () => void;
};

const CardCourse = ({ item, onPress }: Props) => {
  return (
    <Pressable className="px-4 flex mb-6" onPress={onPress}>
      {/* Image */}
      <MaskedImgWithHole imageUri={item.imageUrl} holeRadius={40} />

      {/* SL bài */}
      <View className="absolute top-0 left-4 w-20 h-20 rounded-full bg-background-sub1 items-center justify-center">
        <Text className="text-2xl font-bold text-foreground leading-none">
          {item.totalLesson}
        </Text>
        <Text className="font-semibold text-foreground">bài</Text>
      </View>

      {/* Badge Enrolled */}
      {item.isEnrolled && (
        <View className="absolute top-2 right-6 bg-green-500 px-3 py-1 rounded-full z-10">
          <Text className="text-white text-xs font-semibold">Đã đăng ký</Text>
        </View>
      )}

      <View
        className="border-x border-b border-secondaryText mr-1 px-2 py-2"
        style={{
          borderEndEndRadius: 8,
          borderStartEndRadius: 8,
        }}
      >
        {/* Name */}
        <Text
          numberOfLines={1}
          ellipsizeMode="tail"
          className="text-center color-foreground font-bold text-xl flex-1"
        >
          {item.name}
        </Text>

        {/* Difficult Level */}
        <View className="flex-row items-center gap-2">
          <Text className="color-secondaryText font-medium text-lg">
            Độ khó:
          </Text>

          <View className="flex-row w-[100px] items-center gap-1">
            {Array.from({ length: getLevelNumber(item.level) }).map(
              (_, index) => (
                <Ionicons
                  key={index}
                  name="star"
                  size={18}
                  color={colors.warning.DEFAULT}
                />
              ),
            )}
          </View>
        </View>

        {/* Description */}
        <View className="flex-row gap-1">
          <Text className="color-secondaryText text-lg font-medium">
            Mô tả:
          </Text>
          <Text
            numberOfLines={1}
            ellipsizeMode="tail"
            className="flex-1 color-secondaryText text-lg"
          >
            {item.description}
          </Text>
        </View>

        {/* Price */}
        <View className="flex-row gap-1">
          <Text className="color-secondaryText text-lg font-medium">Giá: </Text>
          <Text className="color-foreground font-semibold text-lg line-clamp-1">
            {formatVND(item.price)}
          </Text>
        </View>
      </View>
    </Pressable>
  );
};

export default CardCourse;
