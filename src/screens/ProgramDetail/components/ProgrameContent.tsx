import Ionicons from '@react-native-vector-icons/ionicons';
import { useRef } from 'react';
import { FlatList, Text, View } from 'react-native';
import ExerciseItem from './ExerciseItem';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import { CourseLessonDetailType } from '../../../utils/CourseType';

type Props = {
  data: CourseLessonDetailType[];
  navigation: NativeStackNavigationProp<RootStackParamList, 'ProgramDetail'>;
  isEnrolled: boolean;
  getProgressOfCourseLesson: (courseLessonId: string) => void;
  traineeCourseId: string | null;
  completedLessonIds: string[];
};

const ProgrameContent = ({
  data,
  navigation,
  isEnrolled,
  getProgressOfCourseLesson,
  traineeCourseId,
  completedLessonIds,
}: Props) => {
  // USE REF
  const listRef = useRef<FlatList>(null);

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
