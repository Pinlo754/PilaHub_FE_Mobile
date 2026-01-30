import React from 'react';
import { ScrollView, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import Header from './components/Header';
import DailyTask from './components/DailyTask';
import { useHomeScreen } from './useHomeScreen';
import RoadmapProgress from './components/RoadmapProgress';
import QuickActions from './components/QuickActions';
import RecommendCourse from './components/RecommendCourse';
import NewExercise from './components/NewExercise';
import NewProduct from './components/NewProduct';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const HomeScreen: React.FC<Props> = ({ navigation }) => {
  // HOOK
  const { dailyTasks, recommendCourses, newExercises, newProducts } =
    useHomeScreen();
  return (
    <View className="flex-1 bg-background pt-14 pb-10">
      <ScrollView contentContainerStyle={{ paddingBottom: 90 }}>
        {/* Header */}
        <Header navigation={navigation} />

        {/* Daily Task */}
        <DailyTask data={dailyTasks} />

        {/* Roadmap Progress */}
        <RoadmapProgress />

        {/* Quick Actions */}
        <QuickActions navigation={navigation} />

        {/* Recomend Course */}
        <RecommendCourse data={recommendCourses} />

        {/* New Exercise */}
        <NewExercise data={newExercises} />

        {/* New Product */}
        <NewProduct data={newProducts} />
      </ScrollView>
    </View>
  );
};

export default HomeScreen;
