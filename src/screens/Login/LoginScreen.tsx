import React, { useState } from 'react';
import { View, Text, TextInput,  TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from '@react-native-vector-icons/feather';
type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;
const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
   return (
    <SafeAreaView  className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center px-4 py-3">
        <Text className="text-lg">←</Text>
        <Text className="flex-1 text-center text-lg font-semibold text-foreground">
          Đăng Nhập
        </Text>
      </View>

      {/* Content */}
      <View className="flex-1 px-6">
        {/* Logo */}
        <View className="items-center mt-6 mb-4">
          <View className="w-16 h-16 rounded-full bg-black items-center justify-center">
            <Text className="text-white text-xl">🏋️</Text>
          </View>
          <Text className="mt-3 text-xl font-semibold text-foreground">
            PilaHub
          </Text>
        </View>

        {/* Email */}
        <View className="mt-6">
          <Text className="mb-1 text-secondaryText">Email</Text>
          <View className="flex-row items-center bg-white rounded-lg px-4 h-12 border border-gray-200">
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Nhập Email"
              className="flex-1 text-base"
              keyboardType="email-address"
            />
            <Feather name="mail" size={20} color="#CD853F" />
          </View>
        </View>

        {/* Password */}
        <View className="mt-4">
          <Text className="mb-1 text-secondaryText">Password</Text>
          <View className="flex-row items-center bg-white rounded-lg px-4 h-12 border border-gray-200">
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Nhập Mật Khẩu"
              secureTextEntry
              className="flex-1 text-base"
            />
            <Feather name="lock" size={20} color="#CD853F" />
          </View>
        </View>

        {/* Remember & Forgot */}
        <View className="flex-row items-center justify-between mt-4">
          <TouchableOpacity
            className="flex-row items-center"
            onPress={() => setRemember(!remember)}
          >
            <View
              className={`w-4 h-4 border mr-2 ${
                remember ? "bg-secondaryText" : "bg-white"
              }`}
            />
            <Text>Nhớ tài khoản</Text>
          </TouchableOpacity>

          <Text className="text-secondaryText">Quên mật khẩu?</Text>
        </View>

        {/* Login Button */}
        <TouchableOpacity className="mt-6 h-12 rounded-lg bg-foreground items-center justify-center">
          <Text className="text-white text-lg font-semibold">
            Đăng nhập
          </Text>
        </TouchableOpacity>

        {/* Divider */}
        <View className="flex-row items-center my-6">
          <View className="flex-1 h-px bg-gray-300" />
          <Text className="mx-3 text-gray-500">Hoặc tiếp tục với</Text>
          <View className="flex-1 h-px bg-gray-300" />
        </View>

        {/* Google */}
        <TouchableOpacity className="h-12 rounded-lg bg-white border border-gray-300 flex-row items-center justify-center mb-3">
          <Text className="text-base">G</Text>
          <Text className="ml-2 text-base">Tiếp tục với Google</Text>
        </TouchableOpacity>

        {/* Apple */}
        <TouchableOpacity className="h-12 rounded-lg bg-white border border-gray-300 flex-row items-center justify-center">
          <Text className="text-base"></Text>
          <Text className="ml-2 text-base">Tiếp tục với Apple</Text>
        </TouchableOpacity>

        {/* Footer */}
        <View className="mt-6 items-center">
          <Text>
            Bạn chưa có tài khoản?{" "}
            <Text className="text-foreground font-family">Đăng Ký</Text>
          </Text>

          <View className="flex-row mt-3">
            <Text className="text-xs text-gray-500 mr-3">Chính Sách Bảo Mật</Text>
            <Text className="text-xs text-gray-500">Điều Khoản Dịch Vụ</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default LoginScreen;
