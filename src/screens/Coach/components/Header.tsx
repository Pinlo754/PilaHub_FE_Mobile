import React from "react";
import { Text, View, TouchableOpacity, Alert } from "react-native";
import Ionicons from '@react-native-vector-icons/ionicons'; 
import { useNavigation } from "@react-navigation/native";
import { logout } from '../../../services/auth';
import AsyncStorage from "@react-native-async-storage/async-storage";

const Header = () => {
  const navigation = useNavigation<any>();

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
  );
};

export default Header;
