import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  View,
} from 'react-native';

import { colors } from '../../../theme/colors';
import { ExerciseType } from '../../../utils/ExerciseType';
import CardExercise from './CardExercise';
import { exerciseService } from '../../../hooks/exercise.service';

const NewExercise = () => {
  const [exercises, setExercises] = useState<ExerciseType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const fetchExercises = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMessage('');

      const data = await exerciseService.getAll();

      setExercises(data ?? []);
    } catch (error: any) {
      console.log('Fetch exercises error:', error);

      setErrorMessage(
        error?.message || 'Không thể tải danh sách bài tập. Vui lòng thử lại.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExercises();
  }, [fetchExercises]);

  const renderItem = useCallback(({ item }: { item: ExerciseType }) => {
    return <CardExercise item={item} onPress={() => {}} />;
  }, []);

  return (
    <View className="pl-4 mt-4">
      {/* Header */}
      <View className="flex-row gap-2 items-center mb-2 pr-4">
        <Text className="color-foreground text-lg font-semibold">
          Bài tập mới
        </Text>

      </View>

      {/* Loading */}
      {loading ? (
        <View className="h-32 items-center justify-center">
          <ActivityIndicator size="small" color={colors.background.DEFAULT} />
          <Text className="mt-2 text-sm color-secondaryText">
            Đang tải bài tập...
          </Text>
        </View>
      ) : errorMessage ? (
        <View className="h-32 mr-4 rounded-2xl bg-red-50 items-center justify-center px-4">
          <Text className="text-sm text-red-500 text-center">
            {errorMessage}
          </Text>

          <Pressable
            onPress={fetchExercises}
            className="mt-3 px-4 py-2 rounded-full bg-red-100"
          >
            <Text className="text-red-500 font-medium">Thử lại</Text>
          </Pressable>
        </View>
      ) : exercises.length === 0 ? (
        <View className="h-32 mr-4 rounded-2xl bg-gray-100 items-center justify-center px-4">
          <Text className="text-sm color-secondaryText text-center">
            Chưa có bài tập mới.
          </Text>
        </View>
      ) : (
        <FlatList
          data={exercises}
          keyExtractor={item => String(item.exerciseId)}
          renderItem={renderItem}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingRight: 16,
          }}
        />
      )}
    </View>
  );
};

export default NewExercise;