import Ionicons from '@react-native-vector-icons/ionicons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Pressable } from 'react-native';
import { RootStackParamList } from '../../../navigation/AppNavigator';

type Props = {
  isVideoExpand: boolean;
  isVideoPlay: boolean;
  isShowFlag: boolean;
  navigation: NativeStackNavigationProp<RootStackParamList, 'ExerciseDetail'>;
  navigatePracticeTab: () => void;
};

const Header = ({
  isVideoExpand,
  isVideoPlay,
  isShowFlag,
  navigation,
  navigatePracticeTab,
}: Props) => {
  // COLOR
  const FOREGROUND = '#A0522D';
  const SUB1 = '#FFFAF0';

  // CHECK
  const showBack = !isVideoPlay || isShowFlag;
  const showFlag = isShowFlag;

  // HANDLERS
  const onPressBack = () => {
    if (isVideoExpand) {
      navigatePracticeTab();
    } else {
      navigation.goBack();
    }
  };

  return (
    <>
      {showBack && (
        <Pressable
          className="absolute top-16 left-4 z-10"
          onPress={() => onPressBack()}
        >
          <Ionicons
            name="chevron-back-outline"
            size={24}
            color={isShowFlag ? SUB1 : FOREGROUND}
          />
        </Pressable>
      )}

      {showFlag && (
        <Pressable className="absolute top-5 right-4 z-10" onPress={() => {}}>
          <Ionicons name="flag-outline" size={24} color={SUB1} />
        </Pressable>
      )}
    </>
  );
};

export default Header;
