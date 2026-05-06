import Ionicons from '@react-native-vector-icons/ionicons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  View,
} from 'react-native';

import { RootStackParamList } from '../../../navigation/AppNavigator';
import { colors } from '../../../theme/colors';
import CardDaily from './CardDaily';
import { DailyTaskItem, dailyTaskService } from '../../../hooks/dailyTask.service';


type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
};

const ItemSeparator = () => <View className="w-3" />;

const contentContainerStyle = {
  paddingRight: 16,
  paddingVertical: 4,
};

const DailyTask = ({ navigation }: Props) => {
  const [tasks, setTasks] = useState<DailyTaskItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const fetchDailyTasks = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMessage('');

      const data = await dailyTaskService.getDailyTasks();

      console.log('DAILY TASKS:', JSON.stringify(data, null, 2));

      setTasks(data ?? []);
    } catch (error: any) {
      console.log('Fetch daily tasks error:', error);

      setErrorMessage(error?.message || 'Không thể tải nhiệm vụ hôm nay.');
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDailyTasks();
  }, [fetchDailyTasks]);

  const handlePressTask = useCallback(
    (item: DailyTaskItem) => {
      console.log('PRESS DAILY TASK:', item);

      if (item.type === 'BOOKING') {
        const booking = item.raw as any;
        // Navigate to VideoCall if available
        if (booking.id) {
          navigation.navigate('VideoCall', { bookingId: booking.id });
        }
      } else if (item.type === 'ROADMAP') {
        // Navigate to Roadmap/SchedulePlayer
        navigation.navigate('Roadmap');
      } else if (item.type === 'COURSE') {
        // Navigate to Courses
        navigation.navigate('Courses');
      }
    },
    [navigation],
  );

  const renderItem = useCallback(
    ({ item }: { item: DailyTaskItem }) => {
      if (!item || !item.type) {
        return null;
      }

      return (
        <CardDaily item={item} onPress={() => handlePressTask(item)} />
      );
    },
    [handlePressTask],
  );

  return (
    <View className="pl-4">
     
        <Text className="color-foreground text-lg font-semibold">
          Nhiệm vụ hôm nay
        </Text>

      

      {loading ? (
        <View className="h-32 items-center justify-center">
          <ActivityIndicator size="small" color={colors.background.DEFAULT} />

          <Text className="mt-2 text-sm color-secondaryText">
            Đang tải nhiệm vụ...
          </Text>
        </View>
      ) : errorMessage ? (
        <View className="h-32 mr-4 rounded-2xl bg-red-50 items-center justify-center px-4">
          <Text className="text-sm text-red-500 text-center">
            {errorMessage}
          </Text>

          <Pressable
            onPress={fetchDailyTasks}
            className="mt-3 px-4 py-2 rounded-full bg-red-100"
          >
            <Text className="text-red-500 font-medium">Thử lại</Text>
          </Pressable>
        </View>
      ) : tasks.length === 0 ? (
        <View className="h-32 mr-4 rounded-2xl bg-gray-100 items-center justify-center px-4">
          <Ionicons
            name="checkmark-done-outline"
            size={26}
            color={colors.secondaryText}
          />

          <Text className="mt-2 text-sm color-secondaryText text-center">
            Hôm nay chưa có nhiệm vụ nào.
          </Text>
        </View>
      ) : (
        <FlatList
          data={tasks ?? []}
          keyExtractor={(item, index) => item?.id || String(index)}
          renderItem={renderItem}
          horizontal
          showsHorizontalScrollIndicator={false}
          ItemSeparatorComponent={ItemSeparator}
          contentContainerStyle={contentContainerStyle}
        />
      )}
    </View>
  );
};

export default DailyTask;