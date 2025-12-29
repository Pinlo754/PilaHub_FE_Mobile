import React, { useState } from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;
const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <View className="flex-1 justify-center px-6 bg-white">
      <Text className="text-3xl font-bold text-black mb-8 text-center">
        Login
      </Text>

      <View className="mb-4">
        <Text className="text-sm text-gray-600 mb-1">
          Email
        </Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Enter your email"
          keyboardType="email-address"
          autoCapitalize="none"
          className="border border-gray-300 rounded-xl px-4 py-3 text-black"
        />
      </View>

      {/* Password */}
      <View className="mb-6">
        <Text className="text-sm text-gray-600 mb-1">
          Password
        </Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Enter your password"
          secureTextEntry
          className="border border-gray-300 rounded-xl px-4 py-3 text-black"
        />
      </View>

      {/* Button */}
      <Pressable className="bg-blue-500 py-4 rounded-xl items-center">
        <Text className="text-white font-semibold text-base">
          Login
        </Text>
      </Pressable>
    </View>
  );
};

export default LoginScreen;
