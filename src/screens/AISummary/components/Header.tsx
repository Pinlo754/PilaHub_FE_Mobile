import Ionicons from '@react-native-vector-icons/ionicons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Pressable, Text, View } from 'react-native';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import { colors } from '../../../theme/colors';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'AISummary'>;
  showBackToList?: boolean;
  onBackToList?: () => void;
  title?: string;
};

const Header = ({ navigation, showBackToList = false, onBackToList, title = 'Tổng kết' }: Props) => {
  // HANDLERS
  const handleGoBack = () => {
    if (showBackToList && onBackToList) {
      onBackToList();
    } else {
      navigation.goBack();
    }
  };

  return (
    <View className="px-4 pb-2 pt-14">
      {/* Back */}
      <Pressable
        onPress={handleGoBack}
        className="absolute left-4 top-[55px] z-10"
      >
        <Ionicons
          name="chevron-back-outline"
          size={24}
          color={colors.foreground}
        />
      </Pressable>

      {/* Title */}
      <Text className="color-foreground text-3xl font-bold text-center">
        {title}
      </Text>
    </View>
  );
};

export default Header;
