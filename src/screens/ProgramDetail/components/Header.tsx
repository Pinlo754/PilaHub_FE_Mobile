import Ionicons from '@react-native-vector-icons/ionicons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Pressable } from 'react-native';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import { colors } from '../../../theme/colors';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'ProgramDetail'>;
};

const Header = ({ navigation }: Props) => {
  return (
    <>
      <Pressable
        className="absolute top-16 left-4 z-10"
        onPress={() => {
          navigation.goBack();
        }}
      >
        <Ionicons
          name="chevron-back-outline"
          size={24}
          color={colors.foreground}
        />
      </Pressable>
    </>
  );
};

export default Header;
