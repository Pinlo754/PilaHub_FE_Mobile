import React from 'react';
import { View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import Header from './components/Header';
import DailyTask from './components/DailyTask';
import { useHomeScreen } from './useHomeScreen';
import RoadmapProgress from './components/RoadmapProgress';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const HomeScreen: React.FC<Props> = ({ navigation }) => {
  // HOOK
  const { dailyTasks } = useHomeScreen();
  return (
    <View className="flex-1 bg-background-sub2">
      {/* Header */}
      <Header navigation={navigation} />

      {/* Daily Task */}
      <DailyTask data={dailyTasks} />

      {/* Roadmap Progress */}
      <RoadmapProgress />
    </View>
  );
};

export default HomeScreen;
