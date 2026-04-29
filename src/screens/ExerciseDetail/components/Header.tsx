import Ionicons from '@react-native-vector-icons/ionicons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Pressable, View } from 'react-native';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import { colors } from '../../../theme/colors';
import { ExerciseTab } from '../../../constants/exerciseTab';
import { WorkoutSessionType } from '../../../utils/WorkoutSessionType';

type Props = {
  activeTab: ExerciseTab;
  isVideoExpand: boolean;
  isVideoPlay: boolean;
  isShowFlag: boolean;
  navigation: NativeStackNavigationProp<RootStackParamList, 'ExerciseDetail'>;
  exerciseId: string;
  onPressBack: () => void;
  workoutHistory: WorkoutSessionType[];
  onPressWorkoutHistory: () => void;
};

const Header = ({
  activeTab,
  isVideoExpand,
  isVideoPlay,
  isShowFlag,
  onPressBack,
  workoutHistory,
  onPressWorkoutHistory,
}: Props) => {
  // CHECK
  const shouldHideBack = activeTab === ExerciseTab.Theory && isVideoExpand;
  const showBack = !shouldHideBack && (!isVideoPlay || isShowFlag);
  const showWorkoutIcon =
    !isVideoExpand && !isVideoPlay && workoutHistory.length > 0;

  // const onPressReport = () => {
  //   navigation.navigate('TraineeReport', { exercise_id: exerciseId });
  // };

  return (
    <View className="bg-black/40">
      {showBack && (
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
      )}

      {/* {showFlag && (
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
      )} */}

      {showWorkoutIcon && (
        <Pressable
          className="absolute top-16 right-4 z-10 bg-black/40 rounded-full w-10 h-10 flex justify-center items-center"
          onPress={onPressWorkoutHistory}
        >
          <Ionicons
            name="timer-outline"
            size={22}
            color={colors.background.DEFAULT}
          />
        </Pressable>
      )}

      {/* <EquipmentModal
        visible={showEquipmentModal}
        onClose={() => setShowEquipmentModal(false)}
        equipments={exerciseEquipments}
      /> */}
    </View>
  );
};

export default Header;
