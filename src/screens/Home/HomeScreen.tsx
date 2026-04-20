import React, { useEffect, useMemo, useState } from 'react';
import { PermissionsAndroid, ScrollView, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import Header from './components/Header';
import DailyTask from './components/DailyTask';
import { useHomeScreen } from './useHomeScreen';
import RoadmapProgress from './components/RoadmapProgress';
import QuickActions, { ACTIONS } from './components/QuickActions';
import RecommendCourse from './components/RecommendCourse';
import NewExercise from './components/NewExercise';
import NewProduct from './components/NewProduct';
import messaging from '@react-native-firebase/messaging';
import { saveFcmToken } from '../../services/auth';
import MainGuideOverlay from '../../components/MainGuideOverlay';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const HomeScreen: React.FC<Props> = ({ navigation }) => {
  // HOOK
  const { dailyTasks, recommendCourses, newExercises, newProducts, scrollRef } =
    useHomeScreen();

  // refs for onboarding overlay (stable refs created once)
  const targetRefs = useMemo(() => {
    const m: Record<string, React.RefObject<any>> = {};
    ACTIONS.forEach((a) => { m[a.id] = React.createRef(); });
    return m;
  }, []);

  const [measures, setMeasures] = useState<Record<string, any>>({});
  const handleMeasure = (id: string, rect: { x: number; y: number; width: number; height: number }) => {
    setMeasures((s) => ({ ...s, [id]: rect }));
  };

  async function requestPermission() {
    await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
    );
    const token = await messaging().getToken();
    console.log("FCM Token:", token);
    saveFcmToken(token)
  }

  requestPermission();

  useEffect(() => {
    const unsubscribe = messaging().onTokenRefresh(async (token) => {
      console.log('New FCM Token:', token);
      await saveFcmToken(token);
    });

    return unsubscribe;
  }, []);
  return (
    <View className="flex-1 bg-background pt-14 pb-10">
      {/* Header */}
      <Header navigation={navigation} />

      <MainGuideOverlay targetRefs={targetRefs} measures={measures} />
      <ScrollView
        ref={scrollRef}
        className="pt-2"
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Daily Task */}
        <DailyTask data={dailyTasks} navigation={navigation} />

        {/* Roadmap Progress */}
        <RoadmapProgress />

        {/* Quick Actions */}
        <QuickActions navigation={navigation} targetRefs={targetRefs} onMeasure={handleMeasure} />

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
