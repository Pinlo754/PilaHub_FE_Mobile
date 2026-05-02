import Ionicons from '@react-native-vector-icons/ionicons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Pressable, Text, View } from 'react-native';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import { colors } from '../../../theme/colors';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'List'>;
};

const Header = ({ navigation }: Props) => {
  return (
    <View className="px-4 pb-2">
      {/* Title */}
      <Text className="color-foreground text-3xl font-bold text-center">
        Khóa học của tôi
      </Text>

      {/* Search */}
      <Pressable
        onPress={() => navigation.navigate('Search', { navigateHome: false })}
        className="absolute right-4 top-1 z-10"
      >
        <Ionicons name="search-outline" size={24} color={colors.foreground} />
      </Pressable>
    </View>
  );
};

export default Header;
