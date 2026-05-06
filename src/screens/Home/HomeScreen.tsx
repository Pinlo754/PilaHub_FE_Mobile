import React, { useEffect, useMemo } from 'react';
import { PermissionsAndroid, Platform, ScrollView, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import messaging from '@react-native-firebase/messaging';

import { RootStackParamList } from '../../navigation/AppNavigator';
import Header from './components/Header';
import DailyTask from './components/DailyTask';
import { useHomeScreen } from './useHomeScreen';
import RoadmapProgress from './components/RoadmapProgress';
import QuickActions, { ACTIONS } from './components/QuickActions';
import RecommendCourse from './components/RecommendCourse';
import NewExercise from './components/NewExercise';
import NewProduct from './components/NewProduct';
import { saveFcmToken } from '../../services/auth';
import MainGuideOverlay from '../../components/MainGuideOverlay';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const {  scrollRef } =
    useHomeScreen();

  /**
   * Refs dùng cho MainGuideOverlay.
   * Mỗi action trong QuickActions sẽ được gắn 1 ref riêng.
   */
  const targetRefs = useMemo(() => {
    const refs: Record<string, React.RefObject<any>> = {};

    ACTIONS.forEach(action => {
      refs[action.id] = React.createRef();
    });

    return refs;
  }, []);

  const requestPermission = async () => {
    try {
      /**
       * Android 13+ cần xin quyền POST_NOTIFICATIONS.
       * Android thấp hơn không cần request quyền này.
       */
      if (Platform.OS === 'android' && Platform.Version >= 33) {
        await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
        );
      }

      const token = await messaging().getToken();

      console.log('FCM Token:', token);

      if (token) {
        await saveFcmToken(token);
      }
    } catch (error) {
      console.log('Request notification permission error:', error);
    }
  };

  useEffect(() => {
    requestPermission();

    const unsubscribe = messaging().onTokenRefresh(async token => {
      console.log('New FCM Token:', token);

      if (token) {
        await saveFcmToken(token);
      }
    });

    return unsubscribe;
  }, []);

  return (
    <View className="flex-1 bg-background pt-14 pb-10">
      {/* Header */}
      <Header navigation={navigation} />

      <ScrollView
        ref={scrollRef}
        className="pt-2"
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Daily Task */}

        {/* Roadmap Progress */}
        <RoadmapProgress />

        {/* Quick Actions */}
        <QuickActions navigation={navigation} targetRefs={targetRefs} />
        <DailyTask navigation={navigation} />

        {/* Recommend Course */}
        <RecommendCourse  />

        {/* New Exercise */}
        <NewExercise  />

        {/* New Product */}
        <NewProduct  />
      </ScrollView>

      {/* Main Guide Overlay */}
      <MainGuideOverlay targetRefs={targetRefs} />
    </View>
  );
};

export default HomeScreen;