import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { confirmPasswordReset } from '../../services/auth';
import Toast from '../../components/Toast';

export default function ResetPasswordConfirmScreen() {
  const route = useRoute();
  const navigation = useNavigation<any>();
  const { email } = (route.params || {}) as any;

  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState<'success'|'error'|'info'>('info');

  const handleConfirm = async () => {
    if (!otp || otp.trim() === '') { Alert.alert('Lỗi', 'Nhập mã OTP'); return; }
    if (!password || password.length < 6) { Alert.alert('Lỗi', 'Mật khẩu tối thiểu 6 ký tự'); return; }
    if (password !== confirm) { Alert.alert('Lỗi', 'Mật khẩu không khớp'); return; }

    setLoading(true);
    try {
      const res = await confirmPasswordReset(email, otp, password);
      setLoading(false);
      if (res.ok) {
        setToastType('success');
        setToastMsg('Mật khẩu đã được đặt lại.');
        setToastVisible(true);
        setTimeout(() => navigation.navigate('Login'), 1200);
      } else {
        const msg = typeof res.error === 'string' ? res.error : (res.error?.message ?? JSON.stringify(res.error));
        setToastType('error'); setToastMsg(msg); setToastVisible(true);
      }
    } catch (e: any) {
      setLoading(false);
      const msg = e?.message ?? String(e);
      setToastType('error'); setToastMsg(msg); setToastVisible(true);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="px-4 pt-6">
        <Text className="text-lg font-semibold text-foreground">Đặt lại mật khẩu</Text>
        <Text className="text-sm text-secondaryText mt-2">Nhập mã OTP đã gửi tới email và đặt mật khẩu mới.</Text>

        <View className="mt-6">
          <Text className="mb-1 text-secondaryText">Mã OTP</Text>
          <View className="bg-white rounded-lg px-4 h-12 border border-gray-200 flex-row items-center">
            <TextInput value={otp} onChangeText={setOtp} placeholder="Nhập mã OTP" className="flex-1" />
          </View>
        </View>

        <View className="mt-4">
          <Text className="mb-1 text-secondaryText">Mật khẩu mới</Text>
          <View className="bg-white rounded-lg px-4 h-12 border border-gray-200 flex-row items-center">
            <TextInput value={password} onChangeText={setPassword} placeholder="Mật khẩu mới" secureTextEntry className="flex-1" />
          </View>
        </View>

        <View className="mt-4">
          <Text className="mb-1 text-secondaryText">Xác nhận mật khẩu</Text>
          <View className="bg-white rounded-lg px-4 h-12 border border-gray-200 flex-row items-center">
            <TextInput value={confirm} onChangeText={setConfirm} placeholder="Nhập lại mật khẩu" secureTextEntry className="flex-1" />
          </View>
        </View>

        <TouchableOpacity className={`mt-6 h-12 rounded-lg items-center justify-center ${loading ? 'bg-gray-300' : 'bg-foreground'}`} onPress={handleConfirm} disabled={loading}>
          <Text className="text-white text-lg font-semibold">{loading ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}</Text>
        </TouchableOpacity>

        <TouchableOpacity className="mt-4 items-center" onPress={() => navigation.goBack()}>
          <Text className="text-secondaryText">Quay lại</Text>
        </TouchableOpacity>

        <Toast visible={toastVisible} message={toastMsg} type={toastType} onHidden={() => setToastVisible(false)} />
      </View>
    </SafeAreaView>
  );
}
