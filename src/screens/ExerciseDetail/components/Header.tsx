import Ionicons from '@react-native-vector-icons/ionicons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Pressable } from 'react-native';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import { colors } from '../../../theme/colors';

type Props = {
  isVideoExpand: boolean;
  isVideoPlay: boolean;
  isShowFlag: boolean;
  navigation: NativeStackNavigationProp<RootStackParamList, 'ExerciseDetail'>;
  navigatePracticeTab: () => void;
  exerciseId: string;
};

const Header = ({
  isVideoExpand,
  isVideoPlay,
  isShowFlag,
  navigation,
  navigatePracticeTab,
  exerciseId,
}: Props) => {
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

  const onPressReport = () => {
    navigation.navigate('TraineeReport', { exercise_id: exerciseId });
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
            color={isShowFlag ? colors.background.sub1 : colors.foreground}
          />
        </Pressable>
      )}

      {showFlag && (
        <Pressable
          className="absolute top-16 right-4 z-10"
          onPress={() => onPressReport()}
        >
          <Ionicons
            name="flag-outline"
            size={24}
            color={colors.background.sub1}
          />
        </Pressable>
      )}
    </>
  );
};

export default Header;
