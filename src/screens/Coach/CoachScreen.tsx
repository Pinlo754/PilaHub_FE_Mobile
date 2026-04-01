import { PermissionsAndroid, Text, View } from 'react-native';
import Schedule from './components/Schedule';
import Header from './components/Header';
import FeatureGrid from './components/NavigateMenu';
import { saveFcmToken } from '../../services/auth';
import { useEffect } from 'react';
import messaging from '@react-native-firebase/messaging';
const CoachScreen = () => {
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
    <View className="flex-1 bg-background px-2">
      <Header />
      <Schedule />
      <FeatureGrid />
    </View>
  );
};

export default CoachScreen;
