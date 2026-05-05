import Ionicons from '@react-native-vector-icons/ionicons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Image, Pressable, Text, View } from 'react-native';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import { colors } from '../../../theme/colors';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
};

const Header = ({ navigation }: Props) => {
  return (
    <View className="flex-row px-4 pb-2 justify-between items-center">
      {/* Logo */}
      <Text className="color-foreground text-3xl font-bold">PilaHub</Text>

      {/* Right section */}
      <View className="flex-row gap-4 items-center">
        {/* Bluetooth - open DeviceScan */}
        <Pressable onPress={() => navigation.navigate('DeviceScan')}>
          <Ionicons
            name="bluetooth-outline"
            size={22}
            color={colors.foreground}
          />
        </Pressable>
        {/* Search */}
        <Pressable onPress={() => navigation.navigate('Search')}>
          <Ionicons name="search-outline" size={24} color={colors.foreground} />
        </Pressable>
        {/* Notification */}
        <Pressable onPress={() => navigation.navigate('NotificationScreen')}>
          <Ionicons
            name="notifications-outline"
            size={24}
            color={colors.foreground}
          />
        </Pressable>
        <Pressable onPress={() => navigation.navigate('ListChatScreen')}>
          <Ionicons
            name="chatbox-ellipses-outline"
            size={24}
            color={colors.foreground}
          />
        </Pressable>
      </View>
    </View>
  );
};

export default Header;
