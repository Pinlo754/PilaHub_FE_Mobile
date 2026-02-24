import { useEffect, useState } from 'react';
import {
  COACH_OPTIONS,
  optionType,
  VIDEO_OPTIONS,
} from '../../constants/reportOption';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { RouteProp } from '@react-navigation/native';

type Props = {
  route: RouteProp<RootStackParamList, 'TraineeReport'>;
  navigation: NativeStackNavigationProp<RootStackParamList, 'TraineeReport'>;
};

export const useTraineeReport = ({ route, navigation }: Props) => {
  // CONSTANTS
  const TIMEOUT = 3010;

  // PARAM
  const selectedCoachId = route.params.coach_id ?? null;
  const selectedExerciseId = route.params.exercise_id ?? null;

  // STATE
  const [options, setOptions] = useState<optionType[] | null>(null);
  const [selectedOption, setSelectedOption] = useState<number>(0);
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string>('');

  // HANDLERS
  const openSuccessModal = (msg: string) => {
    setSuccessMsg(msg);
    setShowSuccessModal(true);
  };

  const closeSuccessModal = () => {
    setSuccessMsg('');
    setShowSuccessModal(false);
  };

  const onPressSubmit = () => {
    openSuccessModal('Đã báo cáo thành công!');
    setTimeout(() => {
      navigation.navigate('MainTabs');
    }, TIMEOUT);
  };

  // CHECK
  const isValid = selectedOption > 0;

  // USE EFFECT
  useEffect(() => {
    setOptions(selectedCoachId ? COACH_OPTIONS : VIDEO_OPTIONS);
  }, [selectedCoachId]);

  return {
    options,
    onPressSubmit,
    isValid,
    selectedOption,
    setSelectedOption,
    showSuccessModal,
    successMsg,
    closeSuccessModal,
    selectedCoachId,
    selectedExerciseId,
  };
};
