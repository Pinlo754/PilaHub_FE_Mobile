import { View, Text } from 'react-native';
import Button from '../../../components/Button';
import { formatVND } from '../../../utils/number';
import { formatHours } from '../../../utils/time';

type Props = {
  isValid: boolean;
  onPressRegister: () => void;
  totalPrice: number;
  totalHours: number;
  pricePerHour: number;
  isInsufficientBalance: boolean;
  walletError: boolean;
};

const Footer = ({
  isValid,
  onPressRegister,
  totalPrice,
  pricePerHour,
  totalHours,
  isInsufficientBalance,
  walletError,
}: Props) => {
  return (
    <View className="bg-background-sub1 border-t border-background-sub1 absolute bottom-0 left-0 right-0 pt-2 px-4 pb-6">
      <View className="flex-row justify-between items-center mb-1">
        <Text className="text-secondaryText">Tổng số tiếng</Text>

        <Text className="text-foreground font-semibold text-lg">
          {formatHours(totalHours)}
        </Text>
      </View>

      <View className="flex-row justify-between items-center mb-2">
        <Text className="text-secondaryText">Giá</Text>

        <Text className="text-foreground font-semibold text-lg">
          {formatVND(pricePerHour)}/1h
        </Text>
      </View>

      {/* Total */}
      <View className="flex-row justify-between items-center mb-2 pt-2 border-t border-foreground">
        <Text className="text-secondaryText font-medium text-lg">
          Tổng tiền
        </Text>

        <Text className="text-foreground font-bold text-2xl">
          {formatVND(totalPrice)}
        </Text>
      </View>

      {isInsufficientBalance && !walletError && (
        <Text className="text-danger-darker font-medium text-center mb-2">
          Số dư ví không đủ để đặt lịch. Vui lòng nạp thêm tiền.
        </Text>
      )}

      {walletError && (
        <Text className="text-danger-darker font-medium text-center mb-2">
          Bạn chưa mở ví để thanh toán!
        </Text>
      )}

      {/* Button */}
      <Button
        text="Đăng ký"
        onPress={onPressRegister}
        colorType={!isValid ? 'grey' : 'primary'}
        rounded="full"
        iconName="today-outline"
        iconSize={26}
        disabled={!isValid}
      />
    </View>
  );
};

export default Footer;
