import Ionicons from '@react-native-vector-icons/ionicons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Pressable } from 'react-native';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import { colors } from '../../../theme/colors';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'ProgramDetail'>;
  onPressBack: () => void;
};

const Header = ({ onPressBack }: Props) => {
  return (
    <>
      <Pressable
        className="absolute top-16 left-4 z-10 bg-black/40 rounded-full w-10 h-10 flex justify-center items-center"
        onPress={onPressBack}
      >
        <Ionicons
          name="chevron-back-outline"
          size={24}
          color={colors.background.DEFAULT}
        />
      </Pressable>
    </>
  );
};

export default Header;
