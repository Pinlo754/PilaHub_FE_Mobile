import Ionicons from '@react-native-vector-icons/ionicons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Image, Pressable, Text, View } from 'react-native';
import { RootStackParamList } from '../../../navigation/AppNavigator';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
};

const Header = ({ navigation }: Props) => {
  // COLOR
  const FOREGROUND = '#A0522D';

  return (
    <View className="flex-row px-4 pb-4 justify-between items-center">
      {/* Logo */}
      <Text className="color-foreground text-3xl font-bold">Pilahub</Text>

      {/* Right section */}
      <View className="flex-row gap-3 items-center">
        {/* Search */}
        <Pressable onPress={() => navigation.navigate('Search')}>
          <Ionicons name="search" size={24} color={FOREGROUND} />
        </Pressable>
        {/* Notification */}
        <Pressable>
          <Ionicons name="notifications-outline" size={24} color={FOREGROUND} />
        </Pressable>
        {/* Profile */}
        <Pressable className="w-10 h-10 rounded-full overflow-hidden">
          <Image
            source={{
              uri: 'https://www.toponseek.com/wp-content/uploads/2024/07/celeb-la-gi-6.jpg',
            }}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
          />
        </Pressable>
      </View>
    </View>
  );
};

export default Header;
