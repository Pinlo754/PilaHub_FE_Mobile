import Ionicons from '@react-native-vector-icons/ionicons';
import { Image, Pressable, Text, View } from 'react-native';
import { colors } from '../../../theme/colors';
import {
  CourseLessonDetailType,
  LessonExerciseDetailType,
} from '../../../utils/CourseType';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import { useState } from 'react';
import { formatTime } from '../../../utils/time';
import { PracticePayload } from '../../../utils/CourseLessonProgressType';
import { PackageType } from '../../../utils/ExerciseType';

type Props = {
  item: CourseLessonDetailType;
  index: number;
  navigation: NativeStackNavigationProp<RootStackParamList, 'ProgramDetail'>;
  isEnrolled: boolean;
  getProgressOfCourseLesson: (courseLessonId: string) => void;
  traineeCourseId: string | null;
  completedLessonIds: string[];
  activePackage: PackageType | null;
};

const ExerciseItem = ({
  index,
  item,
  navigation,
  isEnrolled,
  getProgressOfCourseLesson,
  traineeCourseId,
  completedLessonIds,
  activePackage,
}: Props) => {
  // VARIABLE
  const isFirst = index === 0;
  const isCompleted = completedLessonIds.includes(item.courseLessonId);
  const isVip = activePackage === PackageType.VIP_MEMBER;
  const isMember = activePackage === PackageType.MEMBER;
  const hasPackage = isVip || isMember;

  // STATE
  const [isExpand, setIsExpand] = useState<boolean>(false);

  // API

  // HANDLERS
  const onToggle = () => {
    setIsExpand(prev => !prev);
  };

  const buildPracticePayload = (
    lesson: CourseLessonDetailType,
    progressId: string,
  ): PracticePayload => {
    const sortedExercises = lesson.exercises.sort(
      (a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0),
    );

    return {
      isEnrolled,
      progressId: isEnrolled ? progressId : '',
      lessonExerciseIds: isEnrolled
        ? sortedExercises.map(ex => ex.lessonExerciseId)
        : [],
      exerciseIds: sortedExercises.map(ex => ex.exercise.exerciseId),
    };
  };

  const onPressExercise = async (
    allowedTheory: boolean,
    allowedPractice: boolean,
    ex: LessonExerciseDetailType,
  ) => {
    if (allowedTheory) {
      const progressId = await getProgressOfCourseLesson(item.courseLessonId);

      const payload = buildPracticePayload(item, progressId ?? '');

      navigation.navigate('ExerciseDetail', {
        exercise_id: ex.exercise.exerciseId,
        lessonExerciseId: ex.lessonExerciseId,
        allowedTheory,
        allowedPractice,
        practicePayload: payload,
      });

      return;
    }

    navigation.navigate('ExerciseDetail', {
      exercise_id: ex.exercise.exerciseId,
      allowedTheory,
      allowedPractice,
    });
  };
  return (
    <View>
      {/* Course Lesson */}
      <Pressable
        onPress={onToggle}
        className={`flex-row justify-between items-center gap-2  pt-3 ${!isFirst && 'border-t border-background-sub1 mt-3'}`}
      >
        {isCompleted ? (
          <Ionicons
            name="checkmark-circle"
            size={30}
            color={colors.success.DEFAULT}
          />
        ) : (
          <View
            className={`rounded-full border border-foreground w-8 h-8 flex items-center justify-center`}
          >
            <Text className={`font-semibold color-foreground`}>
              {index + 1}
            </Text>
          </View>
        )}
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
      {isExpand &&
        item.exercises.map(ex => {
          const isFirstExercise = ex.displayOrder === 1;
          const allowedTheory = hasPackage || (isEnrolled && !!traineeCourseId);
          const allowedPractice = allowedTheory && isFirstExercise;

          return (
            <Pressable
              key={ex.lessonExerciseId}
              className="ml-4 flex-row justify-between items-center gap-3 mt-3"
              onPress={() =>
                onPressExercise(allowedTheory, allowedPractice, ex)
              }
            >
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
                <Text className="color-secondaryText">
                  {formatTime(ex.exercise.duration || 0, {
                    showSeconds: false,
                  })}
                </Text>
              </View>

              {/* Icon */}
              {allowedTheory ? (
                <View
                  className={`rounded-full w-10 h-10 flex items-center justify-center pl-0.5 ${isFirstExercise ? 'bg-background-sub1' : 'bg-inactive-lighter'}`}
                >
                  <Ionicons
                    name={isFirstExercise ? 'play' : 'lock-closed'}
                    size={20}
                    color={
                      isFirstExercise
                        ? colors.foreground
                        : colors.inactive.darker
                    }
                  />
                </View>
              ) : (
                <View />
              )}
            </Pressable>
          );
        })}
    </View>
  );
};

export default ExerciseItem;
