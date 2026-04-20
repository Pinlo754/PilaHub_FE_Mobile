import Ionicons from '@react-native-vector-icons/ionicons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Pressable } from 'react-native';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import { colors } from '../../../theme/colors';
import { ExerciseTab } from '../../../constants/exerciseTab';
import { ExerciseEquipment } from '../../../utils/EquipmentType';
import { useState } from 'react';
import EquipmentModal from './EquipmentModal';

type Props = {
  activeTab: ExerciseTab;
  isVideoExpand: boolean;
  isVideoPlay: boolean;
  isShowFlag: boolean;
  navigation: NativeStackNavigationProp<RootStackParamList, 'ExerciseDetail'>;
  exerciseId: string;
  onPressBack: () => void;
  exerciseEquipments: ExerciseEquipment[];
};

const Header = ({
  activeTab,
  isVideoExpand,
  isVideoPlay,
  isShowFlag,
  navigation,
  exerciseId,
  onPressBack,
  exerciseEquipments,
}: Props) => {
  // CHECK
  const shouldHideBack = activeTab === ExerciseTab.Theory && isVideoExpand;
  const showBack = !shouldHideBack && (!isVideoPlay || isShowFlag);
  const showFlag = isShowFlag;
  const showEquipmentIcon = !isShowFlag;
  const [showEquipmentModal, setShowEquipmentModal] = useState(false);

  const onPressReport = () => {
    navigation.navigate('TraineeReport', { exercise_id: exerciseId });
  };

  return (
    <>
      {showBack && (
        <Pressable
          className="absolute top-16 left-4 z-10"
          onPress={onPressBack}
        >
          <Ionicons
            name="chevron-back-outline"
            size={24}
            color={isShowFlag ? colors.background.DEFAULT : colors.foreground}
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

      {showEquipmentIcon && (
        <Pressable
          className="absolute top-16 right-4 z-10"
          onPress={() => setShowEquipmentModal(true)}
        >
          <Ionicons
            name="barbell-outline"
            size={24}
            color={colors.foreground}
          />
        </Pressable>
      )}

      <EquipmentModal
        visible={showEquipmentModal}
        onClose={() => setShowEquipmentModal(false)}
        equipments={exerciseEquipments}
      />
    </>
  );
};

export default Header;
