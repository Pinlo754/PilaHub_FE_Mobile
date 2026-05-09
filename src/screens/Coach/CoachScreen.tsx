import { Alert, PermissionsAndroid, Text, TouchableOpacity, View } from 'react-native';
import Schedule from './components/Schedule';
import FeatureGrid from './components/NavigateMenu';
import { logout, saveFcmToken } from '../../services/auth';
import { useEffect } from 'react';
import messaging from '@react-native-firebase/messaging';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@react-native-vector-icons/ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

const CoachScreen = () => {
  const navigation: any = useNavigation();
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
  
  const onLogout = async () => {
    Alert.alert('Xác nhận', 'Bạn có chắc muốn đăng xuất?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Đăng xuất', style: 'destructive', onPress: async () => {
        try {
          await AsyncStorage.removeItem('account:isCoach');
          await logout();
        } catch {}
        navigation.reset({ index: 0, routes: [{ name: 'Login' }] } as any);
      } }
    ]);
  };
  
  return (
    <SafeAreaView className="flex-1 bg-background px-2">
      <View className="pb-4 pt-6 flex-row items-center justify-center relative">
      
            {/* Back button */}
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              className="absolute left-4"
            >
              <Ionicons name="arrow-back" size={24} color="#A0522D" />
            </TouchableOpacity>
      
            {/* Title */}
            <Text className="text-foreground text-2xl font-bold text-center">
              PilaHub
            </Text>
      
            {/* Logout */}
            <TouchableOpacity onPress={onLogout} className="absolute right-4">
              <Ionicons name="log-out-outline" size={22} color="#A0522D" />
            </TouchableOpacity>
      
          </View>
      <Schedule />
      <FeatureGrid />
    </SafeAreaView>
  );
};

export default CoachScreen;
