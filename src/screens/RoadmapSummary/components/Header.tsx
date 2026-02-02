import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Pressable, Text, View } from 'react-native';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import Ionicons from '@react-native-vector-icons/ionicons';
import { colors } from '../../../theme/colors';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'RoadmapSummary'>;
};
const Header = ({ navigation }: Props) => {
  return (
    <View className="px-4 pb-2">
      {/* Back */}
      <Pressable
        className="absolute top-1 left-4 z-10"
        onPress={() => navigation.goBack()}
      >
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
