import Ionicons from '@react-native-vector-icons/ionicons';
import { useRef } from 'react';
import { FlatList, Text, View } from 'react-native';
import ExerciseItem from './ExerciseItem';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import { CourseLessonDetailType } from '../../../utils/CourseType';
import { PackageType } from '../../../utils/ExerciseType';

type Props = {
  data: CourseLessonDetailType[];
  navigation: NativeStackNavigationProp<RootStackParamList, 'ProgramDetail'>;
  isEnrolled: boolean;
  getProgressOfCourseLesson: (courseLessonId: string) => void;
  traineeCourseId: string | null;
  completedLessonIds: string[];
  activePackage: PackageType | null;
  source: string;
  programId: string;
};

const ProgrameContent = ({
  data,
  navigation,
  isEnrolled,
  getProgressOfCourseLesson,
  traineeCourseId,
  completedLessonIds,
  activePackage,
  source,
  programId,
}: Props) => {
  // USE REF
  const listRef = useRef<FlatList>(null);

  // VARIABLE
  const currentLessonIndex = data.findIndex(
    lesson => !completedLessonIds.includes(lesson.courseLessonId),
  );
  const safeCurrentIndex =
    currentLessonIndex === -1 ? data.length - 1 : currentLessonIndex;

  // RENDER
  const renderItem = ({
    item,
    index,
  }: {
    item: CourseLessonDetailType;
    index: number;
  }) => {
    return (
      <ExerciseItem
        item={item}
        index={index}
        navigation={navigation}
        isEnrolled={isEnrolled}
        getProgressOfCourseLesson={getProgressOfCourseLesson}
        traineeCourseId={traineeCourseId}
        completedLessonIds={completedLessonIds}
        activePackage={activePackage}
        source={source}
        programId={programId}
        currentLessonIndex={safeCurrentIndex}
      />
    );
  };

  return (
    <View className="w-full flex-1 bg-background px-4 mt-4">
      <View className="w-full bg-background-sub1 py-2 px-4 rounded-3xl flex-row justify-between items-center">
        <View className="flex-row items-center">
          <Ionicons
            name="information-circle-outline"
            size={28}
            color="#A0522D"
          />
          <Text className="text-foreground text-fs16 font-medium ml-2">
            Lộ trình tập
          </Text>
        </View>
      </View>

      <FlatList
        ref={listRef}
        data={data}
        keyExtractor={item => item.courseLessonId}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 8, paddingBottom: 30 }}
      />
    </View>
  );
};
export default ProgrameContent;
