import { useEffect, useState } from 'react';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { RouteProp } from '@react-navigation/native';
import { liveSessionReportService } from '../../hooks/liveSessionReport.service';
import { ReportReasonType } from '../../utils/ReportReasonType';
import { ReportReasonService } from '../../hooks/reportReason.service';

type Props = {
  route: RouteProp<RootStackParamList, 'TraineeReport'>;
  navigation: NativeStackNavigationProp<RootStackParamList, 'TraineeReport'>;
};

export const useTraineeReport = ({ route, navigation }: Props) => {
  // CONSTANTS
  const TIMEOUT = 3010;

  // PARAM
  const selectedCoachId = route.params?.coach_id ?? null;
  const selectedExerciseId = route.params?.exercise_id ?? null;
  const liveSessionIdParam = route.params?.liveSessionId ?? null;

  // STATE
  const [reasons, setReasons] = useState<ReportReasonType[]>([]);
  const [selectedReason, setSelectedReason] = useState<ReportReasonType | null>(
    null,
  );
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showErrorModal, setShowErrorModal] = useState<boolean>(false);
  const [confirmMsg, setConfirmMsg] = useState<string>('');
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);

  // API
  const fetchReasons = async () => {
    try {
      const data = await ReportReasonService.getAll();
      setReasons(data);
    } catch (err: any) {
      openErrorModal('Không thể tải danh sách lý do báo cáo!');
    }
  };

  const createReport = async () => {
    setIsLoading(true);
    try {
      if (!liveSessionIdParam || !selectedReason) return;

      await liveSessionReportService.createReport(
        liveSessionIdParam,
        selectedReason.code,
        description.trim() || undefined,
      );

      openSuccessModal('Đã báo cáo thành công!');

      setTimeout(() => {
        navigation.navigate('MainTabs', { screen: 'Home' });
      }, TIMEOUT);
    } catch (err: any) {
      if (err?.type === 'BUSINESS_ERROR') {
        openErrorModal(err.message);
      } else {
        openErrorModal('Bạn đã báo cáo buổi tập này rồi!');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // HANDLERS
  const onSelectReason = (reason: ReportReasonType) => {
    setSelectedReason(reason);
    setDescription('');
  };

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

  const openErrorModal = (msg: string) => {
    setErrorMsg(msg);
    setShowErrorModal(true);
  };

  const closeErrorModal = () => {
    setErrorMsg('');
    setShowErrorModal(false);
  };

  // CHECK
  const isOtherReason = !!selectedReason?.requiresDescription;
  const isValid =
    !!selectedReason && (!isOtherReason || description.trim().length > 0);
  // USE EFFECT
  useEffect(() => {
    fetchReasons();
  }, []);

  useEffect(() => {
    if (!isOtherReason) {
      setDescription('');
    }
  }, [isOtherReason]);

  return {
    reasons,
    selectedReason,
    onSelectReason,
    onPressSubmit,
    isValid,
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
    openErrorModal,
    closeErrorModal,
    errorMsg,
    showErrorModal,
  };
};
