import Ionicons from '@react-native-vector-icons/ionicons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Pressable } from 'react-native';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import { colors } from '../../../theme/colors';
import { ExerciseTab } from '../../../constants/exerciseTab';

type Props = {
  activeTab: ExerciseTab;
  isVideoExpand: boolean;
  isVideoPlay: boolean;
  isShowFlag: boolean;
  navigation: NativeStackNavigationProp<RootStackParamList, 'ExerciseDetail'>;
  navigatePracticeTab: () => void;
  exerciseId: string;
};

const Header = ({
  activeTab,
  isVideoExpand,
  isVideoPlay,
  isShowFlag,
  navigation,
  navigatePracticeTab,
  exerciseId,
}: Props) => {
  // CHECK
  const shouldHideBack = activeTab === ExerciseTab.Theory && isVideoExpand;
  const showBack = !shouldHideBack && (!isVideoPlay || isShowFlag);
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
            color={isShowFlag ? colors.background.DEFAULT : colors.foreground}
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
            color={colors.background.DEFAULT}
          />
        </Pressable>
      )}
    </>
  );
};

export default Header;
