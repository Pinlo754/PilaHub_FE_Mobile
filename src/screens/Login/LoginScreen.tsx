import React, { useState } from 'react';
import { View, Text, TextInput,  TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from '@react-native-vector-icons/feather';
import { login, getProfile } from '../../services/auth';
import { getBodySavedFor } from '../../utils/bodyCache';
import { setOnboardingCompletedFor } from '../../utils/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchTraineeProfile, fetchMyHealthProfiles } from '../../services/profile';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;
const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
        <View className="mt-12">
          <Text className="mb-1 text-secondaryText">Email</Text>
          <View className="flex-row items-center bg-white rounded-lg px-4 h-12 border border-gray-200">
            <TextInput
              value={email}
              onChangeText={setEmail}
              autoCapitalize='none'
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
              autoCapitalize='none'
              secureTextEntry={!showPassword}
              autoCorrect={false}
              textContentType="password"
              className="flex-1 text-base"
            />
            <TouchableOpacity onPress={() => setShowPassword(s => !s)} className="p-2 ml-4">
              <Feather name={showPassword ? 'eye' : 'eye-off'} size={20} color="#CD853F" />
            </TouchableOpacity>
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
        <TouchableOpacity
          className="mt-6 h-12 rounded-lg bg-foreground items-center justify-center"
          onPress={async () => {
            setError(null);
            setLoading(true);
            try {
              const res = await login({ email, password });
              if (!res.ok) {
                setLoading(false);
                setError(res.error?.message ?? JSON.stringify(res.error));
                return;
              }

              // Prefer role from login response when available (normalize to uppercase)
              const loginData: any = res.data ?? {};
              const roleFromLogin = String(loginData?.account?.role ?? '').toUpperCase();
              if (roleFromLogin === 'COACH') {
                setLoading(false);
                navigation.replace('CoachScreen');
                return;
              }

              // fetch current user profile to get userId (fallback if needed)
              const me = await getProfile();
              let userId: string | null = null;
              if (me.ok) {
                const d: any = me.data;
                userId = d?.id ?? d?.accountId ?? d?.memberId ?? null;
              }

              // If login response didn't indicate role, try profile role
              const profileRole = (me.ok ? String((me as any).data?.account?.role ?? (me as any).data?.role ?? '') : '').toUpperCase();
              if (!roleFromLogin && profileRole === 'COACH') {
                setLoading(false);
                navigation.replace('CoachScreen');
                return;
              }

              // Primary server-driven checks: trainee profile and health profiles
              let traineeExists = false;
              try {
                const tRes = await fetchTraineeProfile();
                if (tRes.ok) {
                  traineeExists = true;
                } else {
                  const err = tRes.error || {};
                  const msg = String(err?.message ?? err ?? '').toLowerCase();
                  const code = err?.errorCode ?? err?.code ?? err?.status;
                  if (code === 404 || msg.includes('not found') || code === 'TRAINEE_NOT_FOUND') {
                    traineeExists = false;
                  } else {
                    // unknown error: treat as not existing to be safe
                    traineeExists = false;
                  }
                }
              } catch {
                traineeExists = false;
              }

              // if server says no trainee profile -> require onboarding
              if (!traineeExists) {
                // mark loading done then navigate
                setLoading(false);
                navigation.replace('Onboarding');
                return;
              }

              // server has trainee -> mark per-user onboarding completed
              if (userId) {
                try {
                  await setOnboardingCompletedFor(userId);
                } catch {}
              }

              // check health profiles
              let hasHealth = false;
              try {
                const hRes = await fetchMyHealthProfiles();
                if (hRes.ok) {
                  const data = (hRes.data && (hRes.data.data ?? hRes.data)) ?? hRes.data;
                  if (Array.isArray(data)) hasHealth = data.length > 0;
                  else if (Array.isArray(hRes.data)) hasHealth = hRes.data.length > 0;
                }
              } catch {
                // ignore and fallback to local cache
                hasHealth = false;
              }

              // fallback to local per-user body cache if server check inconclusive
              if (!hasHealth) {
                if (userId) {
                  const saved = await getBodySavedFor(userId);
                  hasHealth = !!saved;
                } else {
                  const savedRaw = await AsyncStorage.getItem('bodygram:savedMeasurements');
                  hasHealth = !!savedRaw;
                }
              }

              setLoading(false);

              if (!hasHealth) {
                navigation.replace('InputBody');
                return;
              }

              // default
              navigation.replace('MainTabs');

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
        <TouchableOpacity className="mt-6 items-center" onPress={() => navigation.navigate('Register')}>
          <Text>
            Bạn chưa có tài khoản?{" "}
            <Text className="text-foreground font-family">Đăng Ký</Text>
          </Text>

          <View className="flex-row mt-3">
            <Text className="text-xs text-gray-500 mr-3">Chính Sách Bảo Mật</Text>
            <Text className="text-xs text-gray-500">Điều Khoản Dịch Vụ</Text>
          </View>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default LoginScreen;
