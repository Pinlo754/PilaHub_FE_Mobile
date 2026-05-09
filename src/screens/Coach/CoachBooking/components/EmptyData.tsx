import { View, Text } from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { colors } from '../../../../theme/colors';

const EmptyData = () => {
  return (
    <View className="flex-1 items-center justify-center mt-24 pt-4">
      <Ionicons
        name="calendar-outline"
        size={60}
        color={colors.inactive.darker}
      />

      <Text className="mt-4 text-xl font-semibold color-foreground">
        Không có lịch gọi video
      </Text>

      <Text className="mt-1 color-inactive-darker text-center px-10">
        Bạn chưa có buổi tập nào trong danh sách này
      </Text>
    </View>
  );
};

export default EmptyData;
