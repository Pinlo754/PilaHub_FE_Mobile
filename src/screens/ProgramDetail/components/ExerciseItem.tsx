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
  source: string;
  programId: string;
  currentLessonIndex: number;
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
  source,
  programId,
  currentLessonIndex,
}: Props) => {
  // VARIABLE
  const isFirst = index === 0;
  const isCompleted = completedLessonIds.includes(item.courseLessonId);
  const isVip = activePackage === PackageType.VIP_MEMBER;
  const isMember = activePackage === PackageType.MEMBER;
  const hasPackage = isVip || isMember;
  const isLocked = index > currentLessonIndex;

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
      durations: sortedExercises.map(ex => ex.exercise.duration ?? 60),
      lessonDurations: sortedExercises.map(
        ex => ex.durationSeconds ?? ex.exercise.duration ?? 60,
      ),
      restSeconds: sortedExercises.map(ex => ex.restSeconds ?? 15),
      programId: programId,
      traineeCourseId: traineeCourseId,
    };
  };

  const onPressExercise = async (
    allowedTheory: boolean,
    allowedPractice: boolean,
    ex: LessonExerciseDetailType,
  ) => {
    const progressId = await getProgressOfCourseLesson(item.courseLessonId);

    const payload = buildPracticePayload(item, progressId ?? '');

    if (allowedTheory) {
      navigation.navigate('ExerciseDetail', {
        exercise_id: ex.exercise.exerciseId,
        lessonExerciseId: ex.lessonExerciseId,
        allowedTheory,
        allowedPractice,
        practicePayload: payload,
        source,
      });

      return;
    }

    navigation.navigate('ExerciseDetail', {
      exercise_id: ex.exercise.exerciseId,
      lessonExerciseId: ex.lessonExerciseId,
      allowedTheory,
      practicePayload: payload,
      source,
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
          const baseAccess = hasPackage || (isEnrolled && !!traineeCourseId);
          // const allowedTheory = baseAccess && !isLocked;
          const allowedTheory = baseAccess;
          const allowedPractice = allowedTheory && isFirstExercise;

          return (
            <Pressable
              key={ex.lessonExerciseId}
              className="ml-4 flex-row justify-between items-center gap-3 mt-3"
              onPress={() => {
                // if (isLocked) return;
                onPressExercise(allowedTheory, allowedPractice, ex);
              }}
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
              {allowedTheory && isFirstExercise ? (
                <View
                  className={`rounded-full w-10 h-10 flex items-center justify-center pl-0.5 bg-background-sub1`}
                >
                  <Ionicons name="play" size={20} color={colors.foreground} />
                </View>
              ) : (
                <View />
              )}

              {/* {isLocked ? (
                <View className="rounded-full w-10 h-10 flex items-center justify-center pl-0.5 bg-inactive-lighter">
                  <Ionicons
                    name="lock-closed"
                    size={20}
                    color={colors.inactive.darker}
                  />
                </View>
              ) : isFirstExercise ? (
                <View className="rounded-full w-10 h-10 flex items-center justify-center pl-0.5 bg-background-sub1">
                  <Ionicons name="play" size={20} color={colors.foreground} />
                </View>
              ) : null} */}
            </Pressable>
          );
        })}
    </View>
  );
};

export default ExerciseItem;
