import Ionicons from '@react-native-vector-icons/ionicons';
import { useRef, useState } from 'react';
import { FlatList, Image, Pressable, Text, View } from 'react-native';
import { CourseLessonType } from '../../../utils/CourseLessonType';
import ExerciseItem from './ExerciseItem';
import ExerciseDetail from '../../ExerciseDetail/ExerciseDetail';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import { CourseType } from '../../../utils/CourseType';

type Props = {
  data: CourseType[];
  navigation: NativeStackNavigationProp<RootStackParamList, 'ProgramDetail'>;
};

const ProgrameContent = ({ data, navigation }: Props) => {
  // STATE
  const [isExpand, setIsExpand] = useState<boolean>(false);

  // USE REF
  const listRef = useRef<FlatList>(null);

  // HANDLERS
  const onToggle = (id: number) => {};

  // RENDER
  // const renderItem = ({
  //   item,
  //   index,
  // }: {
  //   item: CourseLessonType;
  //   index: number;
  // }) => {
  //   return (
  //     <ExerciseItem
  //       item={item}
  //       isFirst={index === 0}
  //       onPress={() => {
  //         navigation.navigate('ExerciseDetail', {
  //           exercise_id: item.courseId,
  //         });
  //       }}
  //     />
  //   );
  // };

  return (
    <View className="w-full bg-background px-4 mt-4">
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

      {/* <FlatList
        ref={listRef}
        data={data}
        keyExtractor={item => item.courseId}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingVertical: 8 }}
      /> */}
    </View>
  );
};
export default ProgrameContent;
