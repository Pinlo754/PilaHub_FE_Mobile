import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { SafeAreaView } from 'react-native-safe-area-context';
import LoadingOverlay from '../../components/LoadingOverlay';
import { verifyEmail, resendOtp, login } from '../../services/auth';
import Toast from '../../components/Toast';

type Props = NativeStackScreenProps<RootStackParamList, 'VerifyEmail'>;

const OtpScreen: React.FC<Props> = ({ route, navigation }) => {
  const email = route.params?.email ?? '';
  const password = route.params?.password;
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState<'success'|'error'|'info'>('info');

  useEffect(() => {
    let t: any;
    if (resendCooldown > 0) {
      t = setTimeout(() => setResendCooldown((s) => s - 1), 1000);
    }
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const handleVerify = async () => {
    setError(null);
    if (code.trim().length === 0) {
      setError('Nhập mã OTP');
      return;
    }
    setLoading(true);
    try {
      const res = await verifyEmail(email, code);
      setLoading(false);
      if (res.ok) {
        setToastType('success');
        setToastMsg('Xác thực thành công');
        setToastVisible(true);
        // auto login then go to MainTabs
        if (password) {
          const r = await login({ email, password });
          if (r.ok) {
            navigation.replace('MainTabs');
            return;
          }
        }
        // fallback: go to Login
        navigation.replace('Login');
      } else {
        const msg = typeof res.error === 'string' ? res.error : JSON.stringify(res.error);
        setError(msg);
        setToastType('error');
        setToastMsg(msg);
        setToastVisible(true);
      }
    } catch (e: any) {
      setLoading(false);
      const err = e.response?.data?.message ?? e.response?.data ?? e.message ?? String(e);
      setError(err);
    }
  };

  const handleResend = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await resendOtp(email);
      setLoading(false);
      if (res.ok) {
        setResendCooldown(30);
        setToastType('success');
        setToastMsg('Mã đã được gửi lại');
        setToastVisible(true);
      } else {
        const msg = typeof res.error === 'string' ? res.error : JSON.stringify(res.error);
        setError(msg);
        setToastType('error');
        setToastMsg(msg);
        setToastVisible(true);
      }
    } catch (e: any) {
      setLoading(false);
      const err = e.response?.data?.message ?? e.response?.data ?? e.message ?? String(e);
      setError(err);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1 px-6">
        <View className="items-center mt-8">
          <Text className="text-2xl font-semibold text-foreground">Xác nhận Email</Text>
          <Text className="mt-2 text-sm text-secondaryText text-center">Mã xác thực đã được gửi tới {email}</Text>
        </View>

        <View className="mt-12">
          <Text className="mb-1 text-secondaryText">Mã OTP</Text>
          <View className="flex-row items-center bg-white rounded-lg px-4 h-12 border border-gray-200">
            <TextInput
              value={code}
              onChangeText={(t) => setCode(t.replace(/[^0-9]/g, ''))}
              placeholder="Nhập mã 6 chữ số"
              keyboardType="number-pad"
              className="flex-1 text-base"
              maxLength={6}
            />
          </View>
          {error ? <Text className="mt-2 text-red-500">{error}</Text> : null}
        </View>

        <TouchableOpacity
          className={`mt-6 h-12 rounded-lg items-center justify-center ${code.length === 6 ? 'bg-foreground' : 'bg-gray-300'}`}
          onPress={handleVerify}
          disabled={code.length !== 6 || loading}
        >
          <Text className="text-white text-lg font-semibold">Xác nhận</Text>
        </TouchableOpacity>

        <View className="mt-4 flex-row items-center justify-between">
          <Text className="text-secondaryText">Không nhận được mã?</Text>
          <TouchableOpacity onPress={handleResend} disabled={resendCooldown > 0 || loading}>
            <Text className={`text-sm ${resendCooldown > 0 ? 'text-gray-400' : 'text-foreground'}`}>
              {resendCooldown > 0 ? `Gửi lại (${resendCooldown}s)` : 'Gửi lại mã'}
            </Text>
          </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>

      {loading ? <LoadingOverlay message={resendCooldown > 0 ? 'Đang gửi lại mã...' : 'Đang xác thực...'} /> : null}
      <Toast visible={toastVisible} message={toastMsg} type={toastType} onHidden={() => setToastVisible(false)} />
    </SafeAreaView>
  );
};

export default OtpScreen;
