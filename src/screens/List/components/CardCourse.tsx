import { Pressable, Text, View } from 'react-native';
import MaskedImgWithHole from '../../../components/MaskedImgWithHole';
import { TraineeCourseType } from '../../../utils/TraineeCourseType';

type Props = {
  item: TraineeCourseType;
  onPress?: () => void;
};

const CardCourse = ({ item, onPress }: Props) => {
  const course = item.course;

  return (
    <Pressable className="px-4 flex mb-6" onPress={onPress}>
      {/* Image */}
      <MaskedImgWithHole imageUri={course.imageUrl} holeRadius={40} />

      {/* SL bài */}
      <View className="absolute top-0 left-4 w-20 h-20 rounded-full bg-background-sub1 items-center justify-center">
        <Text className="text-2xl font-bold text-foreground leading-none">
          {course.totalLesson}
        </Text>
        <Text className="font-semibold text-foreground">bài</Text>
      </View>

      {/* Name */}
      <Text className="text-center color-foreground font-bold text-lg mt-2">
        {course.name}
      </Text>
    </Pressable>
  );
};

export default CardCourse;
