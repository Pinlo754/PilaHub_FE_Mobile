import Ionicons from '@react-native-vector-icons/ionicons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Pressable, Text, View } from 'react-native';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import { colors } from '../../../theme/colors';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'TraineeBooking'>;
  openReportList: () => void;
  handleRefresh: () => void;
};

const Header = ({ navigation, openReportList, handleRefresh }: Props) => {
  // HANDLERS
  const handleGoBack = () => {
    navigation.navigate('MainTabs', { screen: 'Home' });
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
        Gọi video
      </Text>

      <Pressable
        className="absolute top-1 right-4 z-10"
        onPress={handleRefresh}
      >
        <Ionicons name="refresh-outline" size={24} color={colors.foreground} />
      </Pressable>

      {/* <Pressable
        className="absolute top-1 right-4 z-10"
        onPress={openReportList}
      >
        <Ionicons name="flag-outline" size={24} color={colors.foreground} />
      </Pressable> */}
    </View>
  );
};

export default Header;
