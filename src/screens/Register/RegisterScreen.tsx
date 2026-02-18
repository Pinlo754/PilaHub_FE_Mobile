import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from '@react-native-vector-icons/feather';
import { register } from '../../services/auth';
import Toast from '../../components/Toast';

type Props = NativeStackScreenProps<RootStackParamList, 'Register'>;

const RegisterScreen: React.FC<Props> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState<'success'|'error'|'info'>('info');

   const validateEmail = (value: string) => {
    return /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(value);
  };
  const validatePhone = (value: string) => {
    return /^\d{9,11}$/.test(value.replace(/\s+/g, ''));
  };

  const canRegister =
    validateEmail(email) &&
    password.length >= 6 &&
    validatePhone(phone) &&
    password === confirmPassword;

  const handleRegister = async () => {
    setError(null);
    if (!canRegister) return;
    setLoading(true);
    try {
      const payload = { email, phoneNumber: phone, password };
      const res = await register(payload);
      // success typical status 201
      setLoading(false);
      if (res.ok) {
        // go to OTP verify screen and pass email+password for optional auto-login
        navigation.replace('VerifyEmail', { email, password });
        setToastMsg('Đã gửi mã xác nhận tới email');
        setToastType('success');
        setToastVisible(true);
      } else {
        const msg = typeof res.error === 'string' ? res.error : JSON.stringify(res.error);
        setError(msg);
        setToastMsg(msg);
        setToastType('error');
        setToastVisible(true);
      }
    } catch (e: any) {
      setLoading(false);
      const err = e.response?.data?.message ?? e.response?.data ?? e.message ?? String(e);
      setError(err);
      setToastMsg(err);
      setToastType('error');
      setToastVisible(true);
    }
  };

   return (
     <SafeAreaView className="flex-1 bg-background">
       <View className="flex-row items-center px-4 py-3">
        <Text className="text-lg">←</Text>
        <Text className="flex-1 text-center text-lg font-semibold text-foreground">          
          Đăng Ký
        </Text>
      </View>
      <ScrollView>
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
          {/* Subtitle to differentiate register screen */}
          <Text className="mt-2 text-sm text-secondaryText">Tạo tài khoản mới để bắt đầu hành trình của bạn</Text>
        </View>

        {/* Email */}
        <View className="mt-12">
          <Text className="mb-1 text-secondaryText">Email</Text>
          <View className="flex-row items-center bg-white rounded-lg px-4 h-12 border border-gray-200">
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Nhập Email"
              className="flex-1 text-base"
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <Feather name="mail" size={20} color="#CD853F" />
          </View>
          {/* Inline error message for email */}
          {!validateEmail(email) && email.length > 0 && (
            <Text className="mt-1 text-xs text-red-500">Email không hợp lệ</Text>
          )}
        </View>

        {/* Password */}
        <View className="mt-4">
          <Text className="mb-1 text-secondaryText">Password</Text>
          <View className="flex-row items-center bg-white rounded-lg px-4 h-12 border border-gray-200">
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Nhập Mật Khẩu"
              secureTextEntry={!showPassword}
              autoCapitalize='none'
              autoCorrect={false}
              textContentType="newPassword"
              className="flex-1 text-base"
            />
            <TouchableOpacity onPress={() => setShowPassword(s => !s)} className="p-2">
              <Feather name={showPassword ? 'eye' : 'eye-off'} size={20} color="#CD853F" />
            </TouchableOpacity>
          </View>
          {/* Inline error message for password */}
          {password.length < 6 && password.length > 0 && (
            <Text className="mt-1 text-xs text-red-500">Mật khẩu tối thiểu 6 ký tự</Text>
          )}
        </View>

        {/* Confirm Password */}
        <View className="mt-4">
          <Text className="mb-1 text-secondaryText">Xác nhận mật khẩu</Text>
          <View className="flex-row items-center bg-white rounded-lg px-4 h-12 border border-gray-200">
            <TextInput
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Nhập lại Mật Khẩu"
              secureTextEntry={!showConfirm}
              autoCapitalize='none'
              autoCorrect={false}
              textContentType="password"
              className="flex-1 text-base"
            />
            <TouchableOpacity onPress={() => setShowConfirm(s => !s)} className="p-2">
              <Feather name={showConfirm ? 'eye' : 'eye-off'} size={20} color="#CD853F" />
            </TouchableOpacity>
          </View>
          {confirmPassword.length > 0 && password !== confirmPassword && (
            <Text className="mt-1 text-xs text-red-500">Mật khẩu không khớp</Text>
          )}
        </View>

        {/* Phone Number */}
        <View className="mt-4">
          <Text className="mb-1 text-secondaryText">Số điện thoại</Text>
          <View className="flex-row items-center bg-white rounded-lg px-4 h-12 border border-gray-200">
            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder="Nhập Số Điện Thoại"
              className="flex-1 text-base"
              keyboardType="phone-pad"
            />
            <Feather name="phone" size={20} color="#CD853F" />
          </View>
          {/* Inline error message for phone number */}
          {!validatePhone(phone) && phone.length > 0 && (
            <Text className="mt-1 text-xs text-red-500">Số điện thoại không hợp lệ</Text>
          )}
        </View>

        {/* Register Button */}
        <TouchableOpacity 
          className={`mt-6 h-12 rounded-lg items-center justify-center ${canRegister ? 'bg-foreground' : 'bg-gray-300'}`} 
          onPress={handleRegister}
          disabled={!canRegister || loading}
        >
          <Text className="text-white text-lg font-semibold">
            {loading ? 'Đang đăng ký...' : 'Đăng ký'}
          </Text>
        </TouchableOpacity>
        
        {error ? <Text className="mt-2 text-red-500">{error}</Text> : null}
        <Toast visible={toastVisible} message={toastMsg} type={toastType} onHidden={() => setToastVisible(false)} />

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
            Bạn đã có tài khoản?{' '}
            <Text className="text-foreground font-family" onPress={() => navigation.navigate('Login')}>Đăng nhập</Text>
          </Text>

          <View className="flex-row mt-3">
            <Text className="text-xs text-gray-500 mr-3">Chính Sách Bảo Mật</Text>
            <Text className="text-xs text-gray-500">Điều Khoản Dịch Vụ</Text>
          </View>
        </View>
      </View>
      </ScrollView>
      {/* Header */}
     
    </SafeAreaView>
  );
};

export default RegisterScreen;
