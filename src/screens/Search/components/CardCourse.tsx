import { Pressable, Text, View } from 'react-native';
import { CourseType } from '../../../utils/CourseType';
import MaskedImgWithHole from '../../../components/MaskedImgWithHole';

type Props = {
  item: CourseType;
  onPress?: () => void;
};

const CardCourse = ({ item, onPress }: Props) => {
  return (
    <Pressable className="px-4 flex mb-6" onPress={onPress}>
      {/* Image */}
      <MaskedImgWithHole imageUri={item.thumbnail_url} holeRadius={40} />

      {/* SL bài */}
      <View className="absolute top-0 left-4 w-20 h-20 rounded-full bg-background-sub1 items-center justify-center">
        <Text className="text-2xl font-bold text-foreground leading-none">
          {item.total_lessons}
        </Text>
        <Text className="font-semibold text-foreground">bài</Text>
      </View>

      {/* Name */}
      <Text className="text-center color-foreground font-bold text-lg mt-2">
        {item.course_name}
      </Text>
    </Pressable>
  );
};

export default CardCourse;
