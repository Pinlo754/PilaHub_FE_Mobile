import React, { useEffect, useMemo, useCallback } from 'react';
import { PermissionsAndroid, Platform, ScrollView, View, RefreshControl } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import messaging from '@react-native-firebase/messaging';
import { useFocusEffect } from '@react-navigation/native';

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

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const HomeScreen: React.FC<Props> = ({ navigation }) => {
  // Lấy các state và hàm fetch từ hook quản lý logic
  const { scrollRef, loading, refreshData } = useHomeScreen();

  /**
   * Tạo refs cho Guide Overlay
   */
  const targetRefs = useMemo(() => {
    const refs: Record<string, React.RefObject<any>> = {};
    ACTIONS.forEach(action => {
      refs[action.id] = React.createRef();
    });
    return refs;
  }, []);

  /**
   * Xử lý xin quyền thông báo
   */
  const requestPermission = async () => {
    try {
      if (Platform.OS === 'android' && Platform.Version >= 33) {
        await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
        );
      }
      const token = await messaging().getToken();
      if (token) {
        await saveFcmToken(token);
      }
    } catch (error) {
      console.log('Request notification error:', error);
    }
  };

  /**
   * Tự động gọi lại data mỗi khi màn hình được Focus
   */
  useFocusEffect(
    useCallback(() => {
      refreshData(); // Hàm này sẽ gọi API lấy data mới
    }, [])
  );

  useEffect(() => {
    requestPermission();
    const unsubscribe = messaging().onTokenRefresh(async token => {
      if (token) await saveFcmToken(token);
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
        // Thêm tính năng vuốt xuống để làm mới (Pull to refresh)
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refreshData} />
        }
      >
        {/* Roadmap Progress */}
        <RoadmapProgress />

        {/* Quick Actions */}
        <QuickActions navigation={navigation} targetRefs={targetRefs} />

        {/* Daily Task */}
        <DailyTask navigation={navigation} />

        {/* Thêm các section khác nếu cần */}
        <RecommendCourse />
        <NewExercise />
        <NewProduct />
      </ScrollView>
    </View>
  );
};

export default HomeScreen;