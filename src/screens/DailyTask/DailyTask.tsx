import { View } from 'react-native';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Header from './components/Header';
import Calendar from './components/Calendar';
import List from './components/List';
import { mockApi } from '../../hooks/mockapiHook';
import { CardItem } from '../../utils/DailyTaskType';
import { useState, useEffect } from 'react';

type Props = NativeStackScreenProps<RootStackParamList, 'DailyTask'>;

const DailyTask = (props: Props) => {
  const [dailyTasks, setDailyTasks] = useState<CardItem[]>([]);

  useEffect(() => {
    const fetchDailyTasks = async () => {
      const data = await mockApi.getSchedules();
      setDailyTasks(data);
    };

    fetchDailyTasks();
  }, []);

  return (
    <View className="flex-1 pt-14 bg-background">
      <Header navigation={props.navigation} />
      <Calendar />
      <List data={dailyTasks} navigation={props.navigation} />
    </View>
  );
};

export default DailyTask;