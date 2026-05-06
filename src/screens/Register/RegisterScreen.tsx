import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  LayoutChangeEvent,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from '@react-native-vector-icons/feather';
import { register } from '../../services/auth';
import Toast from '../../components/Toast';
import Ionicons from '@react-native-vector-icons/ionicons';
import { colors } from '../../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'Register'>;

const RegisterScreen: React.FC<Props> = ({ navigation, route }) => {
  const scrollRef = useRef<ScrollView | null>(null);
  const inputPositions = useRef<Record<string, number>>({});

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
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>(
    'info',
  );

  const googleIdToken = (route.params as any)?.googleIdToken as
    | string
    | undefined;
  const prefillEmail = (route.params as any)?.email as string | undefined;

  useEffect(() => {
    if (prefillEmail) {
      setEmail(prefillEmail);
    }
  }, [prefillEmail]);

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

  const saveInputPosition = (key: string, e: LayoutChangeEvent) => {
    inputPositions.current[key] = e.nativeEvent.layout.y;
  };

  const scrollToInput = (key: string) => {
    setTimeout(() => {
      const y = inputPositions.current[key] ?? 0;

      scrollRef.current?.scrollTo({
        y: Math.max(y - 80, 0),
        animated: true,
      });
    }, Platform.OS === 'ios' ? 250 : 350);
  };

  const scrollToPhoneInput = () => {
    setTimeout(() => {
      const y = inputPositions.current.phone ?? 0;

      scrollRef.current?.scrollTo({
        y: Math.max(y - 40, 0),
        animated: true,
      });
    }, Platform.OS === 'ios' ? 250 : 450);
  };

  const handleRegister = async () => {
    Keyboard.dismiss();
    setError(null);

    if (!canRegister) return;

    setLoading(true);

    try {
      const payload: any = {
        email,
        phoneNumber: phone,
        password,
      };

      if (googleIdToken) {
        payload.googleIdToken = googleIdToken;
      }

      const res = await register(payload);

      setLoading(false);

      if (res.ok) {
        setToastMsg('Đã gửi mã xác nhận tới email');
        setToastType('success');
        setToastVisible(true);

        navigation.replace('VerifyEmail', {
          email,
          password,
        });
      } else {
        const msg =
          typeof res.error.message === 'string'
            ? res.error.message
            : JSON.stringify(res.error.message);

        setError(msg);
        setToastMsg(msg);
        setToastType('error');
        setToastVisible(true);
      }
    } catch (e: any) {
      setLoading(false);

      const err =
        e.response?.data?.message ??
        e.response?.data ??
        e.message ??
        String(e);

      setError(err);
      setToastMsg(err);
      setToastType('error');
      setToastVisible(true);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <View className="flex-row items-center px-4 py-3">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="w-8 h-8 items-center justify-center"
          >
            <Text className="text-2xl text-foreground">←</Text>
          </TouchableOpacity>

          <Text className="flex-1 text-center text-lg font-semibold text-foreground">
            Đăng Ký
          </Text>

          <View className="w-8" />
        </View>

        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          contentContainerStyle={{
            paddingHorizontal: 24,
            paddingBottom: Platform.OS === 'ios' ? 100 : 100
          }}
        >
          <View className="items-center mt-6 mb-4">
            <View className="w-16 h-16 rounded-full bg-black items-center justify-center">
              <Text className="text-white text-xl">🏋️</Text>
            </View>

            <Text className="mt-3 text-xl font-semibold text-foreground">
              PilaHub
            </Text>

            <Text className="mt-2 text-sm text-secondaryText text-center">
              Tạo tài khoản mới để bắt đầu hành trình của bạn
            </Text>
          </View>

          <View
            className="mt-12"
            onLayout={e => saveInputPosition('email', e)}
          >
            <Text className="mb-1 text-secondaryText">Email</Text>

            <View className="flex-row items-center bg-white rounded-lg px-4 h-12 border border-gray-200">
              <TextInput
                value={email}
                onChangeText={setEmail}
                onFocus={() => scrollToInput('email')}
                placeholder="Nhập Email"
                className="flex-1 text-base text-black"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                textContentType="emailAddress"
                returnKeyType="next"
                placeholderTextColor="#9CA3AF"
              />

              <Feather name="mail" size={20} color="#CD853F" />
            </View>

            {!validateEmail(email) && email.length > 0 && (
              <Text className="mt-1 text-xs text-red-500">
                Email không hợp lệ
              </Text>
            )}
          </View>

          <View
            className="mt-4"
            onLayout={e => saveInputPosition('password', e)}
          >
            <Text className="mb-1 text-secondaryText">Password</Text>

            <View className="flex-row items-center bg-white rounded-lg px-4 h-12 border border-gray-200">
              <TextInput
                value={password}
                onChangeText={setPassword}
                onFocus={() => scrollToInput('password')}
                placeholder="Nhập Mật Khẩu"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="newPassword"
                className="flex-1 text-base text-black"
                returnKeyType="next"
                placeholderTextColor="#9CA3AF"
              />

              <TouchableOpacity
                onPress={() => setShowPassword(s => !s)}
                className="p-2"
              >
                <Feather
                  name={showPassword ? 'eye' : 'eye-off'}
                  size={20}
                  color="#CD853F"
                />
              </TouchableOpacity>
            </View>

            {password.length < 6 && password.length > 0 && (
              <Text className="mt-1 text-xs text-red-500">
                Mật khẩu tối thiểu 6 ký tự
              </Text>
            )}
          </View>

          <View
            className="mt-4"
            onLayout={e => saveInputPosition('confirmPassword', e)}
          >
            <Text className="mb-1 text-secondaryText">
              Xác nhận mật khẩu
            </Text>

            <View className="flex-row items-center bg-white rounded-lg px-4 h-12 border border-gray-200">
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                onFocus={() => scrollToInput('confirmPassword')}
                placeholder="Nhập lại Mật Khẩu"
                secureTextEntry={!showConfirm}
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="password"
                className="flex-1 text-base text-black"
                returnKeyType="next"
                placeholderTextColor="#9CA3AF"
              />

              <TouchableOpacity
                onPress={() => setShowConfirm(s => !s)}
                className="p-2"
              >
                <Feather
                  name={showConfirm ? 'eye' : 'eye-off'}
                  size={20}
                  color="#CD853F"
                />
              </TouchableOpacity>
            </View>

            {confirmPassword.length > 0 && password !== confirmPassword && (
              <Text className="mt-1 text-xs text-red-500">
                Mật khẩu không khớp
              </Text>
            )}
          </View>

          <View
            className="mt-4"
            onLayout={e => saveInputPosition('phone', e)}
          >
            <Text className="mb-1 text-secondaryText">Số điện thoại</Text>

            <View className="flex-row items-center bg-white rounded-lg px-4 h-12 border border-gray-200">
              <TextInput
                value={phone}
                onChangeText={setPhone}
                onFocus={scrollToPhoneInput}
                placeholder="Nhập Số Điện Thoại"
                className="flex-1 text-base text-black"
                keyboardType="phone-pad"
                returnKeyType="done"
                placeholderTextColor="#9CA3AF"
              />

              <Feather name="phone" size={20} color="#CD853F" />
            </View>

            {!validatePhone(phone) && phone.length > 0 && (
              <Text className="mt-1 text-xs text-red-500">
                Số điện thoại không hợp lệ
              </Text>
            )}
          </View>

          <TouchableOpacity
            className={`mt-6 h-12 rounded-lg items-center justify-center ${canRegister ? 'bg-foreground' : 'bg-gray-300'
              }`}
            onPress={handleRegister}
            disabled={!canRegister || loading}
          >
            <Text
              className="text-white text-lg font-semibold"
              numberOfLines={1}
              ellipsizeMode="tail" // Hiện "Đang đăng k..." nếu quá dài
            >
              {loading ? 'Đang đăng ký...' : 'Đăng ký'}
            </Text>
          </TouchableOpacity>

          {error ? (
            <Text className="mt-2 text-red-500 text-center">{error}</Text>
          ) : null}

          <View className="flex-row items-center my-6">
            <View className="flex-1 h-px bg-gray-300" />
            <Text className="mx-3 text-gray-500">Hoặc tiếp tục với</Text>
            <View className="flex-1 h-px bg-gray-300" />
          </View>

          <TouchableOpacity className="h-12 rounded-lg bg-white border border-gray-300 flex-row items-center justify-center mb-3">
            <Text className="text-base text-black">G</Text>
            <Text className="ml-2 text-base text-black">
              Tiếp tục với Google
            </Text>
          </TouchableOpacity>

          <View className="mt-6 items-center">
            <Text className="text-gray-700">
              Bạn đã có tài khoản?{' '}
              <Text
                className="text-foreground font-semibold"
                onPress={() => navigation.navigate('Login')}
              >
                Đăng nhập
              </Text>
            </Text>

            <View className="flex-row mt-3 mb-6">
              <Text className="text-xs text-gray-500 mr-3">
                Chính Sách Bảo Mật
              </Text>
              <Text className="text-xs text-gray-500">
                Điều Khoản Dịch Vụ
              </Text>
            </View>
          </View>
        </ScrollView>

        <Toast
          visible={toastVisible}
          message={toastMsg}
          type={toastType}
          onHidden={() => setToastVisible(false)}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default RegisterScreen;