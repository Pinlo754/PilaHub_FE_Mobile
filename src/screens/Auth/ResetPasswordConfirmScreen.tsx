import React, { useState, useMemo } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { confirmPasswordReset } from '../../services/auth';
import ModalPopup from '../../components/ModalPopup';

// Password validation regex
const PASSWORD_REGEX = {
  uppercase: /[A-Z]/,
  lowercase: /[a-z]/,
  number: /[0-9]/,
  special: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/,
};

// Error messages mapping
const ERROR_MESSAGES: Record<string, string> = {
  'INVALID_OTP': 'Mã OTP không hợp lệ',
  'OTP_EXPIRED': 'Mã OTP đã hết hạn',
  'INVALID_EMAIL': 'Email không hợp lệ',
  'USER_NOT_FOUND': 'Người dùng không tồn tại',
  'WEAK_PASSWORD': 'Mật khẩu không đủ mạnh',
  'PASSWORD_RESET_FAILED': 'Đặt lại mật khẩu thất bại',
};

export default function ResetPasswordConfirmScreen() {
  const route = useRoute();
  const navigation = useNavigation<any>();
  const { email } = (route.params || {}) as any;

  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalData, setModalData] = useState<{ 
    titleText?: string
    contentText: string
    iconName?: string
    iconBgColor?: 'green' | 'red' | 'blue' | 'yellow' | 'grey'
  }>({
    contentText: ''
  });

  // Validate password strength
  const passwordValidation = useMemo(() => {
    if (!password) return { isValid: false, errors: [] };
    
    const errors: string[] = [];
    if (password.length < 8) errors.push('Tối thiểu 8 ký tự');
    if (!PASSWORD_REGEX.uppercase.test(password)) errors.push('Ít nhất 1 chữ hoa (A-Z)');
    if (!PASSWORD_REGEX.lowercase.test(password)) errors.push('Ít nhất 1 chữ thường (a-z)');
    if (!PASSWORD_REGEX.number.test(password)) errors.push('Ít nhất 1 số (0-9)');
    if (!PASSWORD_REGEX.special.test(password)) errors.push('Ít nhất 1 ký tự đặc biệt (!@#$...)');
    
    return {
      isValid: errors.length === 0,
      errors,
    };
  }, [password]);

  // Validate OTP (6 digits)
  const otpValidation = useMemo(() => {
    if (!otp) return { isValid: false, error: '' };
    if (!/^\d{6}$/.test(otp)) return { isValid: false, error: 'OTP phải là 6 chữ số' };
    return { isValid: true, error: '' };
  }, [otp]);

  // Validate password match
  const passwordMatchValid = useMemo(() => {
    if (!confirm) return { isValid: false, error: '' };
    if (password !== confirm) return { isValid: false, error: 'Mật khẩu không khớp' };
    return { isValid: true, error: '' };
  }, [password, confirm]);

  const mapErrorMessage = (error: any): string => {
    if (typeof error === 'string') {
      return ERROR_MESSAGES[error] || error;
    }
    if (error?.otpCode) {
      return ERROR_MESSAGES[error.otpCode] || error.otpCode;
    }
    if (error?.code) {
      return ERROR_MESSAGES[error.code] || error.code;
    }
    return 'Có lỗi xảy ra, vui lòng thử lại';
  };

  const handleConfirm = async () => {
    // Validate all fields
    if (!otpValidation.isValid) {
      setModalData({
        titleText: 'Lỗi OTP',
        contentText: otpValidation.error,
        iconName: 'alert-circle',
        iconBgColor: 'red',
      });
      setModalVisible(true);
      return;
    }

    if (!passwordValidation.isValid) {
      setModalData({
        titleText: 'Mật khẩu không đủ mạnh',
        contentText: passwordValidation.errors.join('\n'),
        iconName: 'shield-alert',
        iconBgColor: 'yellow',
      });
      setModalVisible(true);
      return;
    }

    if (!passwordMatchValid.isValid) {
      setModalData({
        titleText: 'Lỗi',
        contentText: passwordMatchValid.error,
        iconName: 'alert-circle',
        iconBgColor: 'red',
      });
      setModalVisible(true);
      return;
    }

    setLoading(true);
    try {
      const res = await confirmPasswordReset(email, otp, password);
      setLoading(false);
      
      if (res.ok) {
        setModalData({
          titleText: 'Thành công',
          contentText: 'Mật khẩu đã được đặt lại. Vui lòng đăng nhập lại.',
          iconName: 'checkmark-circle',
          iconBgColor: 'green',
        });
        setModalVisible(true);
        setTimeout(() => {
          setModalVisible(false);
          navigation.navigate('Login');
        }, 1500);
      } else {
        const msg = mapErrorMessage(res.error);
        setModalData({
          titleText: 'Lỗi',
          contentText: msg,
          iconName: 'alert-circle',
          iconBgColor: 'red',
        });
        setModalVisible(true);
      }
    } catch (e: any) {
      setLoading(false);
      const msg = mapErrorMessage(e);
      setModalData({
        titleText: 'Lỗi',
        contentText: msg,
        iconName: 'alert-circle',
        iconBgColor: 'red',
      });
      setModalVisible(true);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="px-4 pt-6">
        <Text className="text-lg font-semibold text-foreground">Đặt lại mật khẩu</Text>
        <Text className="text-sm text-secondaryText mt-2">Nhập mã OTP đã gửi tới email và đặt mật khẩu mới.</Text>

        {/* OTP Field */}
        <View className="mt-6">
          <Text className="mb-1 text-secondaryText font-medium">Mã OTP</Text>
          <View className={`bg-white rounded-lg px-4 h-12 border ${otpValidation.error ? 'border-red-500' : 'border-gray-200'} flex-row items-center`}>
            <TextInput 
              value={otp} 
              onChangeText={setOtp} 
              placeholder="Nhập 6 chữ số" 
              keyboardType="number-pad"
              maxLength={6}
              className="flex-1 text-base"
            />
          </View>
          {otp && otpValidation.error && (
            <Text className="text-xs text-red-500 mt-2">{otpValidation.error}</Text>
          )}
        </View>

        {/* Password Field with Toggle */}
        <View className="mt-5">
          <Text className="mb-1 text-secondaryText font-medium">Mật khẩu mới</Text>
          <View className={`bg-white rounded-lg px-4 h-12 border ${password && !passwordValidation.isValid ? 'border-red-500' : 'border-gray-200'} flex-row items-center`}>
            <TextInput 
              value={password} 
              onChangeText={setPassword} 
              placeholder="Mật khẩu mới" 
              secureTextEntry={!showPassword}
              className="flex-1 text-base"
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} className="pl-2">
              <Ionicons 
                name={showPassword ? 'eye-off' : 'eye'} 
                size={20} 
                color="#666"
              />
            </TouchableOpacity>
          </View>
          {password && !passwordValidation.isValid && (
            <View className="mt-2">
              {passwordValidation.errors.map((err, idx) => (
                <Text key={idx} className="text-xs text-red-500 mt-1">• {err}</Text>
              ))}
            </View>
          )}
        </View>

        {/* Confirm Password Field with Toggle */}
        <View className="mt-5">
          <Text className="mb-1 text-secondaryText font-medium">Xác nhận mật khẩu</Text>
          <View className={`bg-white rounded-lg px-4 h-12 border ${confirm && !passwordMatchValid.isValid ? 'border-red-500' : 'border-gray-200'} flex-row items-center`}>
            <TextInput 
              value={confirm} 
              onChangeText={setConfirm} 
              placeholder="Nhập lại mật khẩu" 
              secureTextEntry={!showConfirm}
              className="flex-1 text-base"
            />
            <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)} className="pl-2">
              <Ionicons 
                name={showConfirm ? 'eye-off' : 'eye'} 
                size={20} 
                color="#666"
              />
            </TouchableOpacity>
          </View>
          {confirm && !passwordMatchValid.isValid && (
            <Text className="text-xs text-red-500 mt-2">⚠ {passwordMatchValid.error}</Text>
          )}
        </View>

        <TouchableOpacity 
          className={`mt-7 h-12 rounded-lg items-center justify-center ${loading || !otpValidation.isValid || !passwordValidation.isValid || !passwordMatchValid.isValid ? 'bg-gray-300' : 'bg-foreground'}`} 
          onPress={handleConfirm} 
          disabled={loading || !otpValidation.isValid || !passwordValidation.isValid || !passwordMatchValid.isValid}
        >
          <Text className="text-white text-lg font-semibold">{loading ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}</Text>
        </TouchableOpacity>

        <TouchableOpacity className="mt-4 items-center" onPress={() => navigation.goBack()}>
          <Text className="text-secondaryText">Quay lại</Text>
        </TouchableOpacity>

        {/* Modal Popup for Results */}
        <ModalPopup
          visible={modalVisible}
          mode="noti"
          onClose={() => setModalVisible(false)}
          titleText={modalData.titleText}
          contentText={modalData.contentText}
          iconName={modalData.iconName}
          iconBgColor={modalData.iconBgColor}
        />
      </View>
    </SafeAreaView>
  );
}
