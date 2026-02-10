import Ionicons from '@react-native-vector-icons/ionicons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Pressable, Text, View } from 'react-native';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import { colors } from '../../../theme/colors';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'AISummary'>;
};

const Header = ({ navigation }: Props) => {
  // HANDLERS
  const handleGoBack = () => {
    navigation.goBack();
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
        Tổng kết
      </Text>
    </View>
  );
};

export default Header;
