import { useEffect, useState } from 'react';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { RouteProp } from '@react-navigation/native';
import { courseService } from '../../hooks/course.service';
import { CourseDetailType } from '../../utils/CourseType';
import { traineeCourseService } from '../../hooks/traineeCourse.service';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { courseLessonProgressService } from '../../hooks/courseLessonProgress.service';
import {
  CreateScheduleReq,
  TrainingDay,
} from '../../utils/CourseLessonProgressType';
import { fetchTraineeProfile } from '../../services/profile';
import { formatVND } from '../../utils/number';
import { PackageType } from '../../utils/ExerciseType';
import { getProfile } from '../../services/auth';
import { WalletType } from '../../utils/WalletType';
import { WalletService } from '../../hooks/wallet.service';

type Props = {
  route: RouteProp<RootStackParamList, 'ProgramDetail'>;
  navigation: NativeStackNavigationProp<RootStackParamList, 'ProgramDetail'>;
};

export const useProgramDetail = ({ route, navigation }: Props) => {
  // PARAM
  const params: any = route.params ?? {};

  const program_id =
    params.program_id ??
    params.programId ??
    params.courseId ??
    params.id ??
    null;

  const traineeCourseId = params.traineeCourseId ?? null;
  const source = params?.source ?? '';

  console.log('PROGRAM_DETAIL_ROUTE_PARAMS:', params);
  console.log('PROGRAM_DETAIL_PROGRAM_ID:', program_id);

  // CONSTANT
  const TIMEOUT = 3010;

  // STATE
  const [programFullDetail, setProgramFullDetail] =
    useState<CourseDetailType>();
  const [progressOfCourse, setProgressOfCourse] = useState<number>(0);
  const [isEnrolled, setIsEnrolled] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, openErrorModalMsg] = useState<string | null>(null);
  const [showErrorModal, setShowErrorModal] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
  const [confirmMsg, setConfirmMsg] = useState<string>('');
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [showSchedule, setShowSchedule] = useState<boolean>(false);
  const [selectedDays, setSelectedDays] = useState<TrainingDay[]>([]);
  const [traineeId, setTraineeId] = useState<string | null>(null);
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>([]);
  const [selectedStartDate, setSelectedStartDate] = useState<string>('');
  const [activePackage, setActivePackage] = useState<PackageType | null>(null);
  const [showResetSchedule, setShowResetSchedule] = useState<boolean>(false);
  const [resetSelectedDays, setResetSelectedDays] = useState<TrainingDay[]>([]);
  const [pendingReset, setPendingReset] = useState<{
    startDate: string;
    mode: 'full' | 'incomplete';
  } | null>(null);
  const [wallet, setWallet] = useState<WalletType | null>(null);
  const [isInsufficientBalance, setIsInsufficientBalance] =
    useState<boolean>(false);
  const [walletError, setWalletError] = useState<boolean>(false);

  // VARIABLE
  const isFromList = source === 'List';
  const isFromSearch = source === 'Search';

  // MODAL HELPERS
  const openSuccessModal = (msg: string) => {
    setSuccessMsg(msg);
    setShowSuccessModal(true);
  };

  const closeSuccessModal = () => {
    setSuccessMsg('');
    setShowSuccessModal(false);
  };

  const openErrorModal = (msg: string) => {
    openErrorModalMsg(msg);
    setShowErrorModal(true);
  };

  const closeErrorModal = () => {
    openErrorModalMsg('');
    setShowErrorModal(false);
  };

  const openConfirmModal = (msg: string) => {
    setConfirmMsg(msg);
    setShowConfirmModal(true);
  };

  const closeConfirmModal = () => {
    setConfirmMsg('');
    setShowConfirmModal(false);
  };

  // FETCH
  const fetchInformation = async () => {
    try {
      const res = await getProfile();
      if (!res.ok) return;

      setActivePackage(res.data.activePackageType);
    } catch (err: any) {
      if (err?.type === 'BUSINESS_ERROR') {
        openErrorModal(err.message);
      } else {
        openErrorModal('Có lỗi xảy ra. Vui lòng thử lại.');
      }
    }
  };

  const fetchById = async () => {
    if (!program_id) {
      console.log('FETCH_PROGRAM_DETAIL_ERROR: missing program_id');
      openErrorModal('Không tìm thấy khóa học.');
      return;
    }

    try {
      let programDetail;
      let enrolled = false;

      console.log('FETCH_PROGRAM_DETAIL_BY_ID:', program_id);

      if (traineeCourseId) {
        const [resProgram, resCompletedLesson] = await Promise.all([
          courseService.getFullDetail(program_id),
          courseLessonProgressService.getCompletedLesson(traineeCourseId),
        ]);

        programDetail = resProgram;
        enrolled = true;

        if (resCompletedLesson.length > 0) {
          setProgressOfCourse(
            resCompletedLesson[0].traineeCourse.progressPercentage,
          );

          const completedIds = resCompletedLesson.map(
            item => item.courseLesson.courseLessonId,
          );

          setCompletedLessonIds(completedIds);
        } else {
          setProgressOfCourse(0);
          setCompletedLessonIds([]);
        }
      } else {
        const resTrainee = await fetchTraineeProfile();

        if (!resTrainee.ok) {
          console.log('FETCH_TRAINEE_PROFILE_ERROR:', resTrainee);
          return;
        }

        const currentTraineeId = resTrainee.data.traineeId;
        setTraineeId(currentTraineeId);

        const [resProgram, resEnrolled] = await Promise.all([
          courseService.getFullDetail(program_id),
          traineeCourseService.checkEnrollment(currentTraineeId, program_id),
        ]);

        programDetail = resProgram;
        enrolled = resEnrolled;
      }

      console.log('FETCH_PROGRAM_DETAIL_SUCCESS:', programDetail);

      setProgramFullDetail(programDetail);
      setIsEnrolled(enrolled);
    } catch (err: any) {
      console.log('FETCH_PROGRAM_DETAIL_ERROR:', err);

      if (err?.type === 'BUSINESS_ERROR') {
        openErrorModal(err.message);
      } else {
        openErrorModal('Có lỗi xảy ra. Vui lòng thử lại.');
      }
    }
  };

  const fetchWallet = async () => {
    try {
      const res = await WalletService.getMyWallet();

      setWalletError(false);
      setWallet(res);

      if (programFullDetail) {
        setIsInsufficientBalance(
          res.availableVND < programFullDetail.course.price,
        );
      }
    } catch (err: any) {
      console.log('FETCH_WALLET_ERROR:', err);
      setWalletError(true);
    }
  };

  // ACTIONS
  const enrollCourse = async () => {
    if (!program_id || selectedDays.length === 0 || !traineeId) return;

    setIsLoading(true);

    try {
      const resEnroll = await traineeCourseService.enrollCourse(
        traineeId,
        program_id,
      );

      const payload: CreateScheduleReq = {
        traineeCourseId: resEnroll.traineeCourseId,
        trainingDays: selectedDays,
        startDate: selectedStartDate,
      };

      await courseLessonProgressService.createSchedule(payload);

      openSuccessModal('Đăng ký khóa học thành công!');

      setTimeout(() => {
        navigation.navigate('MainTabs', {
          screen: 'List',
        });
      }, TIMEOUT);
    } catch (err: any) {
      if (err?.type === 'BUSINESS_ERROR') {
        openErrorModal(err.message);
      } else {
        openErrorModal('Có lỗi xảy ra. Vui lòng thử lại.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getProgressOfCourseLesson = async (courseLessonId: string) => {
    if (!traineeCourseId) return;

    setIsLoading(true);

    try {
      const res = await courseLessonProgressService.getProgressOfCourseLesson(
        traineeCourseId,
        courseLessonId,
      );

      return res.progressId;
    } catch (err: any) {
      if (err?.type === 'BUSINESS_ERROR') {
        openErrorModal(err.message);
      } else {
        openErrorModal('Có lỗi xảy ra. Vui lòng thử lại.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const resetSchedule = async (startDate: string) => {
    if (!traineeCourseId || resetSelectedDays.length === 0) return;

    setIsLoading(true);

    try {
      const payload: CreateScheduleReq = {
        traineeCourseId,
        trainingDays: resetSelectedDays,
        startDate,
      };

      await courseLessonProgressService.resetSchedule(payload);
      closeResetSchedule();
      await fetchById();
      openSuccessModal('Đặt lại lịch tập thành công!');
    } catch (err: any) {
      if (err?.type === 'BUSINESS_ERROR') {
        openErrorModal(err.message);
      } else {
        openErrorModal('Có lỗi xảy ra. Vui lòng thử lại.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const resetIncompleteLesson = async (startDate: string) => {
    if (!traineeCourseId || resetSelectedDays.length === 0) return;

    setIsLoading(true);

    try {
      const payload: CreateScheduleReq = {
        traineeCourseId,
        trainingDays: resetSelectedDays,
        startDate,
      };

      await courseLessonProgressService.resetIncompleteLesson(payload);
      closeResetSchedule();
      await fetchById();
      openSuccessModal('Lên lịch lại các bài chưa hoàn thành thành công!');
    } catch (err: any) {
      if (err?.type === 'BUSINESS_ERROR') {
        openErrorModal(err.message);
      } else {
        openErrorModal('Có lỗi xảy ra. Vui lòng thử lại.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // HANDLERS
  const onPress = () => {
    setShowSchedule(true);
  };

  const onPressBack = () => {
    if (isFromList) {
      navigation.navigate('MainTabs', {
        screen: 'List',
      });
      return;
    }

    if (isFromSearch) {
      navigation.navigate('Search', { navigateHome: true });
      return;
    }

    navigation.goBack();
  };

  const onConfirmModal = () => {
    closeConfirmModal();

    if (pendingReset) {
      const { startDate, mode } = pendingReset;
      setPendingReset(null);

      if (mode === 'full') {
        resetSchedule(startDate);
      } else {
        resetIncompleteLesson(startDate);
      }

      return;
    }

    closeSchedule();
    enrollCourse();
  };

  const closeSchedule = () => {
    setShowSchedule(false);
    setSelectedDays([]);
    setSelectedStartDate('');
  };

  const handleSelectDay = (day: TrainingDay) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter(d => d !== day));
      return;
    }

    setSelectedDays([...selectedDays, day]);
  };

  const onPressRegister = (startDate: string) => {
    if (!programFullDetail) return;

    setSelectedStartDate(startDate);

    openConfirmModal(
      `Bạn có chắc muốn đăng ký khóa học với giá ${formatVND(
        programFullDetail.course.price,
      )}?`,
    );
  };

  const openResetSchedule = () => {
    setShowResetSchedule(true);
  };

  const closeResetSchedule = () => {
    setShowResetSchedule(false);
    setResetSelectedDays([]);
  };

  const handleSelectResetDay = (day: TrainingDay) => {
    if (resetSelectedDays.includes(day)) {
      setResetSelectedDays(resetSelectedDays.filter(d => d !== day));
      return;
    }

    setResetSelectedDays([...resetSelectedDays, day]);
  };

  const onPressConfirmReset = (
    startDate: string,
    mode: 'full' | 'incomplete',
  ) => {
    if (mode === 'full') {
      openConfirmModal(
        'Bạn có chắc muốn đặt lại toàn bộ lịch tập? Tiến độ hiện tại sẽ bị xóa.',
      );
    } else {
      openConfirmModal(
        'Bạn có chắc muốn lên lịch lại các bài chưa hoàn thành?',
      );
    }

    setPendingReset({ startDate, mode });
  };

  // CHECK
  const isValid = !isInsufficientBalance && !walletError;

  // USE EFFECT
  useEffect(() => {
    let mounted = true;

    const fetchAll = async () => {
      if (!program_id) {
        console.log('PROGRAM_DETAIL_MISSING_ID:', params);
        openErrorModal('Không tìm thấy khóa học.');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        await Promise.allSettled([
          fetchInformation(),
          fetchById(),
          fetchWallet(),
        ]);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    fetchAll();

    return () => {
      mounted = false;
    };
  }, [program_id]);

  useEffect(() => {
    if (!programFullDetail || !wallet) return;

    setIsInsufficientBalance(
      wallet.availableVND < programFullDetail.course.price,
    );
  }, [programFullDetail, wallet]);

  return {
    programFullDetail,
    programDetail: programFullDetail?.course,
    lessons: programFullDetail?.lessons ?? [],
    isLoading,
    isEnrolled,
    closeConfirmModal,
    closeErrorModal,
    closeSuccessModal,
    confirmMsg,
    errorMsg,
    successMsg,
    onConfirmModal,
    showConfirmModal,
    showErrorModal,
    showSuccessModal,
    onPress,
    showSchedule,
    closeSchedule,
    handleSelectDay,
    selectedDays,
    onPressRegister,
    getProgressOfCourseLesson,
    traineeCourseId,
    progressOfCourse,
    completedLessonIds,
    activePackage,
    source,
    onPressBack,
    showResetSchedule,
    closeResetSchedule,
    onPressConfirmReset,
    openResetSchedule,
    handleSelectResetDay,
    resetSelectedDays,
    isFromList,
    wallet,
    isInsufficientBalance,
    walletError,
    isValid,
  };
};