import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { useNavigation } from '@react-navigation/native';
import { logout } from '../../../services/auth';
import ModalPopup from '../../../components/ModalPopup';

type Props = { profile?: any };

export default function SettingList(_: Props) {
  const navigation = useNavigation();
  const [modalProps, setModalProps] = useState<any>({ visible: false });

  const showLogoutConfirm = () => {
    setModalProps({
      visible: true,
      mode: 'confirm',
      titleText: 'Đăng xuất',
      contentText: 'Bạn có muốn đăng xuất không?',
      onCancel: () => setModalProps({ visible: false }),
      onConfirm: async () => {
        setModalProps({ visible: false });
        try {
          await logout();
        } catch (err) {
          console.warn('Logout error', err);
        }
        try {
          // @ts-ignore
          navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        } catch (err) {
          console.warn('Navigation reset failed', err);
          // @ts-ignore
          navigation.navigate('Login');
        }
      },
    });
  };

  return (
    <View className="px-4 my-4">
      <Text className="text-sm font-medium text-gray-700 mb-2">Cài đặt</Text>
      <View className="bg-white rounded-xl shadow">
        <Pressable className="p-4 border-b border-gray-100 flex-row items-center" onPress={() => (navigation as any).navigate('Notifications')}> 
          <Ionicons name="notifications-outline" size={18} color="#A0522D" />
          <Text className="ml-3">Thông báo</Text>
        </Pressable>

        <Pressable className="p-4 border-b border-gray-100 flex-row items-center" onPress={() => (navigation as any).navigate('ProfileInfo')}>
          <Ionicons name="person-outline" size={18} color="#A0522D" />
          <Text className="ml-3">Thông tin cá nhân</Text>
        </Pressable>

        <Pressable className="p-4 border-b border-gray-100 flex-row items-center" onPress={() => (navigation as any).navigate('Support') }>
          <Ionicons name="help-circle-outline" size={18} color="#A0522D" />
          <Text className="ml-3">Trợ giúp & Hỗ trợ</Text>
        </Pressable>

        <Pressable className="p-4 border-b border-gray-100 flex-row items-center" onPress={() => (navigation as any).navigate('MyDevices')}>
          <Ionicons name="phone-portrait-outline" size={18} color="#A0522D" />
          <Text className="ml-3">Thiết bị kết nối</Text>
        </Pressable>

        <Pressable className="p-4 flex-row items-center" onPress={showLogoutConfirm}>
          <Ionicons name="log-out-outline" size={18} color="#ef4444" />
          <Text className="ml-3 text-red-500">Đăng xuất</Text>
        </Pressable>
      </View>
      <ModalPopup {...(modalProps as any)} />
    </View>
  );
}
