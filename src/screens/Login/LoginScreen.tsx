import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from '@react-native-vector-icons/feather';
import { login } from '../../services/auth';
import { configureGoogleSignIn, signInWithGoogle } from '../../utils/google';
import { googleAuth } from '../../services/googleAuth';
import { WEB_CLIENT_ID } from '../../config/key';

import { handlePostLogin } from '../../utils/postLoginHandler';
import Ionicons from '@react-native-vector-icons/ionicons';
import { colors } from '../../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;
const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    configureGoogleSignIn({
      webClientId: WEB_CLIENT_ID,
    });
  }, []);

  async function handleGoogle() {
    setLoading(true);
    setError(null);
    try {
      const res = await signInWithGoogle();
      console.log('Google Sign-In Response:', res);
      if (!res.ok) {
        setError(String(res.error));
        setLoading(false);
        return;
      }
      const idToken = res.idToken;
      const googleEmail = res.email;
      if (!idToken) {
        setError('Không lấy được idToken từ Google');
        setLoading(false);
        return;
      }

      const backendRes = await googleAuth({
        email: googleEmail,
        googleIdToken: idToken,
      });
      // Log backend response for debugging
      console.log('Google Sign-In Backend Response:', backendRes);

      if (!backendRes.ok) {
        setError(JSON.stringify(backendRes.error));
        setLoading(false);
        return;
      }

      const data = backendRes.data ?? {};
      // Log backend data payload
      console.log('Google Sign-In Backend Data:', data);

      if (data.requiresRegistration) {
        // open register screen with prefilled email and idToken stored in route params for later
        navigation.navigate('Register', {
          googleIdToken: idToken,
          email: googleEmail,
        } as any);
        setLoading(false);
        return;
      }

      // delegate post-login routing
      await handlePostLogin(data, navigation);
      setLoading(false);
      return;
    } catch (e: any) {
      setLoading(false);
      setError(e?.message ?? String(e));
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center px-4 py-3">
        <Text className="flex-1 text-center text-lg font-semibold text-foreground">
          Đăng Nhập
        </Text>
      </View>

      {/* Content */}
      <View className="flex-1 px-6">
        {/* Logo */}
        <View className="items-center mt-6">
          {/* <View className="w-16 h-16 rounded-full bg-black items-center justify-center">
            <Text className="text-white text-xl">🏋️</Text>
          </View>
          <Text className="mt-3 text-xl font-semibold text-foreground">
            PilaHub
          </Text> */}
          <View className="rounded-full w-28 h-28">
            <Image
              source={require('../../assets/logo.png')}
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
            />
          </View>
        </View>

        {/* Email */}
        <View className="mt-12">
          <Text className="mb-1 text-secondaryText">Email</Text>
          <View className="flex-row items-center bg-white rounded-lg px-4 h-12 border border-gray-200">
            <TextInput
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              placeholder="Nhập Email"
              className="flex-1 text-base"
              keyboardType="email-address"
            />
            <Feather name="mail" size={20} color="#CD853F" />
          </View>
        </View>

        {/* Password */}
        <View className="mt-4">
          <Text className="mb-1 text-secondaryText">Mật khẩu</Text>
          <View className="flex-row items-center bg-white rounded-lg px-4 h-12 border border-gray-200">
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Nhập Mật Khẩu"
              autoCapitalize="none"
              secureTextEntry={!showPassword}
              autoCorrect={false}
              textContentType="password"
              className="flex-1 text-base"
            />
            <TouchableOpacity
              onPress={() => setShowPassword(s => !s)}
              className="p-2 ml-4"
            >
              <Feather
                name={showPassword ? 'eye' : 'eye-off'}
                size={20}
                color="#CD853F"
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Remember & Forgot */}
        <View className="flex-row items-center justify-between mt-4">
          <TouchableOpacity
            onPress={() => navigation.navigate('ForgotPassword')}
          >
            <Text className="text-secondaryText">Quên mật khẩu?</Text>
          </TouchableOpacity>
        </View>

        {/* Login Button */}
        <TouchableOpacity
          className="mt-6 h-12 rounded-lg bg-foreground items-center justify-center"
          onPress={async () => {
            setError(null);
            setLoading(true);
            try {
              // const emailMock = 'nvmthoai14738837@gmail.com';
              // const passwordMock = 'Thoai12345@';
              // const res = await login({ email: emailMock, password: passwordMock });

              // const emailMock = 'pinlo752004@gmail.com';
              // const passwordMock = 'Phongpinlo123@';
              // const res = await login({ email: emailMock, password: passwordMock });

              const res = await login({ email, password });
              if (!res.ok) {
                setLoading(false);
                setError(res.error?.message ?? JSON.stringify(res.error));
                return;
              }

              // success: delegate remaining flow to handler
              const loginPayload = res.data ?? {};
              await handlePostLogin(loginPayload, navigation);
              setLoading(false);
            } catch (e: any) {
              setLoading(false);
              setError(e?.message ?? String(e));
            }
          }}
          disabled={loading}
        >
          <Text className="text-white text-lg font-semibold">
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </Text>
        </TouchableOpacity>

        {error ? <Text className="text-red-500 mt-2">{error}</Text> : null}

        {/* Divider */}
        <View className="flex-row items-center my-6">
          <View className="flex-1 h-px bg-gray-300" />
          <Text className="mx-3 text-gray-500">Hoặc tiếp tục với</Text>
          <View className="flex-1 h-px bg-gray-300" />
        </View>

        {/* Google */}
        <TouchableOpacity
          className="h-12 rounded-lg bg-white border border-gray-300 flex-row items-center justify-center mb-3"
          onPress={handleGoogle}
        >
          {/* <Text className="text-base">G</Text> */}
          <Ionicons name="logo-google" size={18} color={colors.foreground} />
          <Text className="ml-2 text-base">Tiếp tục với Google</Text>
        </TouchableOpacity>

        {/* Apple */}

        {/* Footer */}
        <TouchableOpacity
          className="mt-6 items-center"
          onPress={() => navigation.navigate('Register')}
        >
          <Text>
            Bạn chưa có tài khoản?{' '}
            <Text className="text-foreground font-family">Đăng Ký</Text>
          </Text>

          <View className="flex-row mt-3">
            <Text className="text-xs text-gray-500 mr-3">
              Chính Sách Bảo Mật
            </Text>
            <Text className="text-xs text-gray-500">Điều Khoản Dịch Vụ</Text>
          </View>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default LoginScreen;
