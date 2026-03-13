import React from 'react';
import { View, Text, Pressable, Alert } from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { useNavigation } from '@react-navigation/native';
import { logout } from '../../../services/auth';

type Props = { profile: any };

export default function SettingList({ profile }: Props) {
  const navigation = useNavigation();

  const handleLogout = async () => {
    Alert.alert('Đăng xuất', 'Bạn có muốn đăng xuất không?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Đăng xuất',
        style: 'destructive',
        onPress: async () => {
          try {
            await logout();
          } catch (err) {
            console.warn('Logout error', err);
          }
          // Reset navigation to Login screen
          try {
            // @ts-ignore -- simple reset without strong typing here
            navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
          } catch (e) {
            // fallback: navigate to Login
            // @ts-ignore
            navigation.navigate('Login');
          }
        },
      },
    ]);
  };

  return (
    <View className="px-4 my-4">
      <Text className="text-sm font-medium text-gray-700 mb-2">Cài đặt</Text>
      <View className="bg-white rounded-xl shadow">
        <Pressable className="p-4 border-b border-gray-100 flex-row items-center" onPress={() => Alert.alert('Thông báo', 'Thiết lập thông báo')}> 
          <Ionicons name="notifications-outline" size={18} color="#A0522D" />
          <Text className="ml-3">Thông báo</Text>
        </Pressable>

        <Pressable className="p-4 border-b border-gray-100 flex-row items-center" onPress={() => Alert.alert('Thông tin cá nhân', JSON.stringify(profile ?? {}, null, 2))}>
          <Ionicons name="person-outline" size={18} color="#A0522D" />
          <Text className="ml-3">Thông tin cá nhân</Text>
        </Pressable>

        <Pressable className="p-4 border-b border-gray-100 flex-row items-center" onPress={() => Alert.alert('Trợ giúp', 'Liên hệ hỗ trợ') }>
          <Ionicons name="help-circle-outline" size={18} color="#A0522D" />
          <Text className="ml-3">Trợ giúp & Hỗ trợ</Text>
        </Pressable>

        <Pressable className="p-4 border-b border-gray-100 flex-row items-center" onPress={() => (navigation as any).navigate('MyDevices')}>
          <Ionicons name="phone-portrait-outline" size={18} color="#A0522D" />
          <Text className="ml-3">Thiết bị kết nối</Text>
        </Pressable>

        <Pressable className="p-4 flex-row items-center" onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={18} color="#ef4444" />
          <Text className="ml-3 text-red-500">Đăng xuất</Text>
        </Pressable>
      </View>
    </View>
  );
}
