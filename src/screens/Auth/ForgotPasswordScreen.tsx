import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { requestPasswordReset } from '../../services/auth';
import Toast from '../../components/Toast';
import { useNavigation } from '@react-navigation/native';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState<'success'|'error'|'info'>('info');
  const navigation = useNavigation<any>();

  const handleRequest = async () => {
    if (!email || email.trim() === '') {
      Alert.alert('Lỗi', 'Vui lòng nhập email đăng ký.');
      return;
    }
    setLoading(true);
    try {
      const res = await requestPasswordReset(email.trim());
      console.log('requestPasswordReset response', res);
      setLoading(false);
      if (res.ok) {
        setToastType('success');
        setToastMsg('Mã OTP đặt lại mật khẩu đã được gửi tới email.');
        setToastVisible(true);
        // navigate to reset confirmation screen with email
        setTimeout(() => navigation.navigate('ResetPasswordConfirm', { email: email.trim() }), 700);
      } else {
        const msg = typeof res.error === 'string' ? res.error : (res.error?.message ?? JSON.stringify(res.error));
        console.warn('requestPasswordReset error', res.error);
        setToastType('error');
        setToastMsg(msg);
        setToastVisible(true);
        Alert.alert('Lỗi', msg?.toString?.() ?? 'Không thể gửi OTP');
      }
    } catch (e: any) {
      console.error('requestPasswordReset thrown', e);
      setLoading(false);
      const msg = e?.message ?? String(e);
      setToastType('error');
      setToastMsg(msg);
      setToastVisible(true);
      Alert.alert('Lỗi', msg?.toString?.() ?? 'Không thể gửi OTP');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="px-4 pt-6">
        <Text className="text-lg font-semibold text-foreground">Quên mật khẩu</Text>
        <Text className="text-sm text-secondaryText mt-2">Nhập email đã đăng ký để nhận mã OTP đặt lại mật khẩu.</Text>

        <View className="mt-6">
          <Text className="mb-1 text-secondaryText">Email</Text>
          <View className="flex-row items-center bg-white rounded-lg px-4 h-12 border border-gray-200">
            <TextInput
              value={email}
              onChangeText={setEmail}
              autoCapitalize='none'
              placeholder="Nhập Email đăng ký"
              keyboardType="email-address"
              className="flex-1 text-base"
            />
          </View>
        </View>

        <TouchableOpacity className={`mt-6 h-12 rounded-lg items-center justify-center ${loading ? 'bg-gray-300' : 'bg-foreground'}`} onPress={handleRequest} disabled={loading}>
          <Text className="text-white text-lg font-semibold">{loading ? 'Đang gửi...' : 'Gửi mã OTP'}</Text>
        </TouchableOpacity>

        <TouchableOpacity className="mt-4 items-center" onPress={() => navigation.goBack()}>
          <Text className="text-secondaryText">Quay lại</Text>
        </TouchableOpacity>

        <Toast visible={toastVisible} message={toastMsg} type={toastType} onHidden={() => setToastVisible(false)} />
      </View>
    </SafeAreaView>
  );
}
