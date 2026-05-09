import Ionicons from '@react-native-vector-icons/ionicons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Pressable, Text, View } from 'react-native';
import { RootStackParamList } from '../../../../navigation/AppNavigator';
import { colors } from '../../../../theme/colors';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'CoachBooking'>;
  handleRefresh: () => void;
};

const CoachBookingHeader = ({ navigation, handleRefresh }: Props) => {
  const handleGoBack = () => {
    navigation.navigate('MainTabs', { screen: 'Home' });
  };

  return (
    <View className="px-4 pb-2">
      <Pressable onPress={handleGoBack} className="absolute left-4 top-1 z-10">
        <Ionicons
          name="chevron-back-outline"
          size={24}
          color={colors.foreground}
        />
      </Pressable>

      <Text className="color-foreground text-3xl font-bold text-center">
        Lịch sử buổi học
      </Text>

      <Pressable
        className="absolute top-1 right-4 z-10"
        onPress={handleRefresh}
      >
        <Ionicons name="refresh-outline" size={24} color={colors.foreground} />
      </Pressable>
    </View>
  );
};

export default CoachBookingHeader;