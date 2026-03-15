import Ionicons from '@react-native-vector-icons/ionicons';
import { Image, Pressable, Text, View } from 'react-native';
import { colors } from '../../../theme/colors';
import { CourseLessonDetailType } from '../../../utils/CourseType';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import { useState } from 'react';
import { formatTime } from '../../../utils/time';

type Props = {
  item: CourseLessonDetailType;
  index: number;
  navigation: NativeStackNavigationProp<RootStackParamList, 'ProgramDetail'>;
};

const ExerciseItem = ({ index, item, navigation }: Props) => {
  
  // VARIABLE
  const isFirst = index === 0;

    // STATE
  const [isExpand, setIsExpand] = useState<boolean>(false);

  // HANDLERS
  const onToggle = () => {
     setIsExpand(prev => !prev);
  };
  return (
    <View>
      {/* Course Lesson */}
      <Pressable onPress={onToggle} className={`flex-row justify-between items-center gap-2  pt-3 ${!isFirst && 'border-t border-background-sub1 mt-3'}`}>
        {/* Icon */}
        {/* <Ionicons name="checkmark-circle" size={24} color={colors.foreground} /> */}
        <View className="rounded-full border border-foreground w-8 h-8 flex items-center justify-center">
          <Text className="color-foreground font-semibold">{index + 1}</Text>
        </View>
        {/* Name */}
        <Text className="flex-grow color-foreground text-xl font-bold line-clamp-1 max-w-[320px]">
         {item.lesson.name}
        </Text>
        {/* Arrow */}
        <Ionicons
           name={isExpand ? 'chevron-down-outline' : 'chevron-forward-outline'}
          size={24}
          color={colors.foreground}
        />
      </Pressable>

      {/* Exercises */}
      {isExpand && item.exercises.map(ex => (
      <Pressable key={ex.lessonExerciseId} className="ml-4 flex-row justify-between items-center gap-3 mt-3"  onPress={() =>
            navigation.navigate('ExerciseDetail', {
              exercise_id: ex.exercise.exerciseId,
            })
          }>
        {/* Image */}
        <View className="w-20 h-14 rounded-lg overflow-hidden border border-transparent">
          <Image
            source={{
              uri: ex.exercise.imageUrl,
            }}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
          />
        </View>

        {/* Name */}
        <View className="flex-grow">
          <Text className="color-foreground text-lg font-medium line-clamp-1 max-w-[240px]">
           {ex.exercise.name}
          </Text>
            <Text className="color-secondaryText">{formatTime(ex.exercise.duration || 0, {showSeconds: false})}</Text>
        </View>

        {/* Icon */}
        <View className="rounded-full bg-background-sub1 w-10 h-10 flex items-center justify-center pl-0.5">
          <Ionicons name="play" size={20} color={colors.foreground} />
        </View>
        </Pressable>
        ))}
    </View>
  );
};

export default ExerciseItem;
