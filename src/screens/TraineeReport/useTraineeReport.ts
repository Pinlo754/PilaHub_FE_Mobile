import { useEffect, useState } from 'react';
import {
  COACH_OPTIONS,
  LIVESESSION_OPTIONS,
  optionType,
  VIDEO_OPTIONS,
} from '../../constants/reportOption';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { RouteProp } from '@react-navigation/native';
import { liveSessionReportService } from '../../hooks/liveSessionReport.service';

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
  const liveSessionIdParam = route.params.liveSessionId ?? null;

  // STATE
  const [options, setOptions] = useState<optionType[] | null>(null);
  const [selectedOption, setSelectedOption] = useState<number>(0);
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [confirmMsg, setConfirmMsg] = useState<string>('');
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);

  // API
  const createReport = async () => {
    setIsLoading(true);
    try {
      if (!liveSessionIdParam) return;

      const selectedReason = options?.find(o => o.id === selectedOption)?.value;

      if (!selectedReason) return;

      await liveSessionReportService.createReport(
        liveSessionIdParam,
        selectedReason,
        description.trim() || undefined,
      );

      openSuccessModal('Đã đánh giá thành công!');

      setTimeout(() => {
        navigation.navigate('MainTabs', { screen: 'Home' });
      }, TIMEOUT);
    } catch (err: any) {
      if (err?.type === 'BUSINESS_ERROR') {
        setErrorMsg(err.message);
      } else {
        setErrorMsg('Có lỗi xảy ra. Vui lòng thử lại.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // HANDLERS
  const openSuccessModal = (msg: string) => {
    setSuccessMsg(msg);
    setShowSuccessModal(true);
  };

  const closeSuccessModal = () => {
    setSuccessMsg('');
    setShowSuccessModal(false);
  };

  const openConfirmModal = (msg: string) => {
    setConfirmMsg(msg);
    setShowConfirmModal(true);
  };

  const closeConfirmModal = () => {
    setConfirmMsg('');
    setShowConfirmModal(false);
  };

  const onConfirmModal = () => {
    closeConfirmModal();
    createReport();
  };

  const onPressSubmit = () => {
    openConfirmModal('Bạn có chắc muốn gửi báo cáo không?');
  };

  // CHECK
  const isOtherReason = liveSessionIdParam && selectedOption === 6;
  const isValid =
    selectedOption > 0 && (!isOtherReason || description.trim().length > 0);

  // USE EFFECT
  useEffect(() => {
    setOptions(
      selectedCoachId
        ? COACH_OPTIONS
        : selectedExerciseId
          ? VIDEO_OPTIONS
          : LIVESESSION_OPTIONS,
    );
  }, [selectedCoachId, selectedExerciseId]);

  useEffect(() => {
    if (!isOtherReason) {
      setDescription('');
    }
  }, [isOtherReason]);

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
    liveSessionIdParam,
    description,
    setDescription,
    isOtherReason,
    showConfirmModal,
    closeConfirmModal,
    onConfirmModal,
    confirmMsg,
    isLoading,
  };
};
