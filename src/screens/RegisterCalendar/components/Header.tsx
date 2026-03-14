import Ionicons from '@react-native-vector-icons/ionicons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Pressable, Text, View } from 'react-native';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import { colors } from '../../../theme/colors';
import { useNavigationState } from '@react-navigation/native';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'RegisterCalendar'>;
  selectedCoachId: string | null;
  clearCoachId: () => void;
  clearBooking: () => void;
};

const Header = ({
  navigation,
  selectedCoachId,
  clearCoachId,
  clearBooking,
}: Props) => {
  // VARIABLES
  const previousRouteName = useNavigationState(state => {
    const index = state.index;
    return index > 0 ? state.routes[index - 1]?.name : null;
  });

  // HANDLERS
  const handleGoBack = () => {
    clearBooking();
    if (previousRouteName === 'CoachDetail') {
      clearCoachId();
      navigation.goBack();
      return;
    }

    if (selectedCoachId) {
      clearCoachId();
    } else {
      navigation.goBack();
    }
  };

  return (
    <View className="px-4 pb-2">
      {/* Back */}
      <Pressable onPress={handleGoBack} className="absolute left-4 top-1 z-10">
        <Ionicons
          name="chevron-back-outline"
          size={24}
          color={colors.foreground}
        />
      </Pressable>

      {/* Title */}
      <Text className="color-foreground text-3xl font-bold text-center">
        Đăng ký lịch
      </Text>
    </View>
  );
};

export default Header;
