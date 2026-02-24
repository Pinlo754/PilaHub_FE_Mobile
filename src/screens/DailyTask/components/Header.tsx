import Ionicons from '@react-native-vector-icons/ionicons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Pressable, Text, View } from 'react-native';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import { colors } from '../../../theme/colors';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'DailyTask'>;
};

const Header = ({ navigation }: Props) => {
  return (
    <View className="px-4 pb-2">
      {/* Back */}
      <Pressable
        onPress={() => navigation.goBack()}
        className="absolute left-4 top-1 z-10"
      >
        <Ionicons
          name="chevron-back-outline"
          size={24}
          color={colors.foreground}
        />
      </Pressable>

      {/* Title */}
      <Text className="color-foreground text-3xl font-bold text-center">
        Nhiệm vụ hôm nay
      </Text>
    </View>
  );
};

export default Header;
