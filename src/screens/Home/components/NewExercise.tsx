import Ionicons from '@react-native-vector-icons/ionicons';
import { useCallback } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { colors } from '../../../theme/colors';
import { ExerciseType } from '../../../utils/ExerciseType';
import CardExercise from './CardExercise';

type Props = {
  data: ExerciseType[];
};

const NewExercise = ({ data }: Props) => {
  // RENDER
  const renderItem = useCallback(({ item }: { item: ExerciseType }) => {
    return <CardExercise item={item} onPress={() => {}} />;
  }, []);
  return (
    <View className="pl-4 mt-4">
      {/* Header */}
      <View className="flex-row gap-2 items-center mb-2">
        <Text className="color-foreground text-lg font-semibold">
          Bài tập mới
        </Text>
        <Pressable>
          <Ionicons
            name="chevron-forward-outline"
            size={20}
            color={colors.foreground}
          />
        </Pressable>
      </View>

      {/* List */}
      <FlatList
        data={data}
        keyExtractor={item => String(item.exercise_id)}
        renderItem={renderItem}
        horizontal={true}
        showsHorizontalScrollIndicator={false}
      />
    </View>
  );
};

export default NewExercise;
