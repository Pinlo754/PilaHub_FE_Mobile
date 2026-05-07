import { useEffect, useRef, useState } from 'react';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { RouteProp } from '@react-navigation/native';
import { courseService } from '../../hooks/course.service';
import {
  CourseDetailType,
  CourseLessonDetailType,
} from '../../utils/CourseType';
import { traineeCourseService } from '../../hooks/traineeCourse.service';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { courseLessonProgressService } from '../../hooks/courseLessonProgress.service';
import {
  CreateScheduleReq,
  PracticePayload,
  TrainingDay,
} from '../../utils/CourseLessonProgressType';
import { fetchTraineeProfile } from '../../services/profile';
import { formatVND } from '../../utils/number';
import { ExerciseType, PackageType, TutorialType } from '../../utils/ExerciseType';
import { getProfile } from '../../services/auth';
import { WalletType } from '../../utils/WalletType';
import { WalletService } from '../../hooks/wallet.service';
import { workoutSessionService } from '../../hooks/workoutSession.service';
import {
  WorkoutExerciseReq,
  WorkoutLessonExerciseReq,
  WorkoutSessionType,
} from '../../utils/WorkoutSessionType';
import { exerciseService } from '../../hooks/exercise.service';
import { tutorialService } from '../../hooks/tutorial.service';
import { useBle } from '../../services/BleProvider';

type Props = {
  route: RouteProp<RootStackParamList, 'ProgramDetail'>;
  navigation: NativeStackNavigationProp<RootStackParamList, 'ProgramDetail'>;
};

export const useProgramDetail = ({ route, navigation }: Props) => {
  // ─── PARAMS ───────────────────────────────────────────────────────────────
  const { program_id } = route.params;
  const traineeCourseId = route.params.traineeCourseId ?? null;
  const source = route.params?.source ?? '';

  // ─── CONSTANTS ────────────────────────────────────────────────────────────
  const TIMEOUT = 3010;
  const COUNTDOWN_START = 5;
  const COUNTDOWN_REST = 15;

  // ─── STATE: Program ───────────────────────────────────────────────────────
  const [programFullDetail, setProgramFullDetail] =
    useState<CourseDetailType>();
  const [progressOfCourse, setProgressOfCourse] = useState<number>(0);
  const [isEnrolled, setIsEnrolled] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [traineeId, setTraineeId] = useState<string | null>(null);
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>([]);
  const [activePackage, setActivePackage] = useState<PackageType | null>(null);
  const [wallet, setWallet] = useState<WalletType | null>(null);
  const [isInsufficientBalance, setIsInsufficientBalance] =
    useState<boolean>(false);
  const [walletError, setWalletError] = useState<boolean>(false);
  const [aiAllowed, setAiAllowed] = useState<boolean>(false);

  // ─── STATE: Schedule ──────────────────────────────────────────────────────
  const [showSchedule, setShowSchedule] = useState<boolean>(false);
  const [selectedDays, setSelectedDays] = useState<TrainingDay[]>([]);
  const [selectedStartDate, setSelectedStartDate] = useState<string>('');
  const [showResetSchedule, setShowResetSchedule] = useState<boolean>(false);
  const [resetSelectedDays, setResetSelectedDays] = useState<TrainingDay[]>([]);
  const [pendingReset, setPendingReset] = useState<{
    startDate: string;
    mode: 'full' | 'incomplete';
  } | null>(null);

  // ─── STATE: Modals ────────────────────────────────────────────────────────
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showErrorModal, setShowErrorModal] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
  const [confirmMsg, setConfirmMsg] = useState<string>('');
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [recommendMsg, setRecommendMsg] = useState<string>('');
  const [recommendAction, setRecommendAction] = useState<
    'UPGRADE' | 'LIST' | null
  >(null);
  const [showRecommendModal, setShowRecommendModal] = useState<boolean>(false);

  // ─── STATE: Practice ──────────────────────────────────────────────────────
  const [isPracticing, setIsPracticing] = useState(false);
  const [isVideoVisible, setIsVideoVisible] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentExercise, setCurrentExercise] = useState<ExerciseType>();
  const [currentTutorial, setCurrentTutorial] = useState<TutorialType>();
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [practicePayload, setPracticePayload] =
    useState<PracticePayload | null>(null);

  // Countdown
  const [showStartCountdown, setShowStartCountdown] = useState(false);
  const [showRestCountdown, setShowRestCountdown] = useState(false);
  const [restCountdownDuration, setRestCountdownDuration] =
    useState(COUNTDOWN_REST);

  // Timer
  const [exerciseTimeLeft, setExerciseTimeLeft] = useState(0);
  const [isExerciseRunning, setIsExerciseRunning] = useState(false);

  // Practice modal
  const [practiceSuccessMsg, setPracticeSuccessMsg] = useState('');
  const [showPracticeSuccessModal, setShowPracticeSuccessModal] =
    useState(false);
  const [practiceConfirmMsg, setPracticeConfirmMsg] = useState('');
  const [showPracticeConfirmModal, setShowPracticeConfirmModal] =
    useState(false);

  // ─── REFS ─────────────────────────────────────────────────────────────────
  const exerciseTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentExerciseIndexRef = useRef(0);
  const exerciseTimeLeftRef = useRef(0);
  const timerStartedRef = useRef(false);
  const workoutSessionRef = useRef<WorkoutSessionType | undefined>(undefined);
  const practicePayloadRef = useRef<PracticePayload | null>(null);
  const isEnrolledRef = useRef(false);

  // ─── VARIABLES ────────────────────────────────────────────────────────────
  const isFromList = source === 'List';
  const isFromSearch = source === 'Search';
  const isPaidUser =
    activePackage === PackageType.VIP_MEMBER ||
    activePackage === PackageType.MEMBER;

  // ─── SYNC REFS ────────────────────────────────────────────────────────────
  useEffect(() => {
    currentExerciseIndexRef.current = currentExerciseIndex;
  }, [currentExerciseIndex]);

  useEffect(() => {
    practicePayloadRef.current = practicePayload;
  }, [practicePayload]);

  useEffect(() => {
    isEnrolledRef.current = isEnrolled;
  }, [isEnrolled]);

  useEffect(() => {
    return () => clearExerciseTimer();
  }, []);

  // Pause/resume timer theo isPlaying
  useEffect(() => {
    if (!isPracticing) return;
    if (!timerStartedRef.current) return;
    if (isPlaying) {
      resumeExerciseTimer();
    } else {
      pauseExerciseTimer();
    }
  }, [isPlaying]);

  useEffect(() => {
    if (!programFullDetail || !wallet) return;
    setIsInsufficientBalance(
      wallet.availableVND < programFullDetail.course.price,
    );
  }, [programFullDetail, wallet]);

  // ─── FETCH: Program ───────────────────────────────────────────────────────
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
    if (!program_id) return;

    try {
      let programDetail;
      let enrolled = false;

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

        if (!resTrainee.ok) return;

        const currentTraineeId = resTrainee.data.traineeId;
        setTraineeId(currentTraineeId);

        const [resProgram, resEnrolled] = await Promise.all([
          courseService.getFullDetail(program_id),
          traineeCourseService.checkEnrollment(currentTraineeId, program_id),
        ]);

        programDetail = resProgram;
        enrolled = resEnrolled;
      }

      setProgramFullDetail(programDetail);
      setIsEnrolled(enrolled);
    } catch (err: any) {
      if (err?.type === 'BUSINESS_ERROR') {
        openErrorModal(err.message);
      } else {
        openErrorModal('Có lỗi xảy ra. Vui lòng thử lại.');
      }
    }
  };

  // ─── FETCH: Enroll ────────────────────────────────────────────────────────
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
      // console.error('Fetch wallet error:', err);
      setWalletError(true);
    }
  };

  const getProgressOfCourseLessonRaw = async (
    courseLessonId: string,
  ): Promise<string | undefined> => {
    if (!traineeCourseId) return undefined;
    try {
      const res = await courseLessonProgressService.getProgressOfCourseLesson(
        traineeCourseId,
        courseLessonId,
      );
      return res.progressId;
    } catch {
      return undefined;
    }
  };

  // ─── TIMER ────────────────────────────────────────────────────────────────
  const clearExerciseTimer = () => {
    if (exerciseTimerRef.current) {
      clearInterval(exerciseTimerRef.current);
      exerciseTimerRef.current = null;
    }
  };

  const createTimerInterval = () => {
    exerciseTimerRef.current = setInterval(() => {
      exerciseTimeLeftRef.current -= 1;
      setExerciseTimeLeft(exerciseTimeLeftRef.current);
      if (exerciseTimeLeftRef.current <= 0) {
        clearInterval(exerciseTimerRef.current!);
        exerciseTimerRef.current = null;
        setIsExerciseRunning(false);
        timerStartedRef.current = false;
        handleExerciseDone();
      }
    }, 1000);
  };

  const startExerciseTimer = (durationSec: number) => {
    clearExerciseTimer();
    exerciseTimeLeftRef.current = durationSec;
    setExerciseTimeLeft(durationSec);
    setIsExerciseRunning(true);
    timerStartedRef.current = true;
    createTimerInterval();
  };

  const pauseExerciseTimer = () => {
    clearExerciseTimer();
    setIsExerciseRunning(false);
  };

  const resumeExerciseTimer = () => {
    if (!timerStartedRef.current) return;
    if (exerciseTimeLeftRef.current <= 0) return;
    if (exerciseTimerRef.current) return;
    setIsExerciseRunning(true);
    createTimerInterval();
  };

  // ─── WORKOUT SESSION ──────────────────────────────────────────────────────
  const setWorkoutSessionSynced = (s: WorkoutSessionType | undefined) => {
    workoutSessionRef.current = s;
  };

  const startWorkoutForLessonExercise = async (
    payload: PracticePayload,
    index: number,
  ) => {
    if (!payload.isEnrolled) return;
    const req: WorkoutLessonExerciseReq = {
      courseLessonProgressId: payload.progressId,
      lessonExerciseId: payload.lessonExerciseIds[index],
      haveAITracking: false,
      haveIOTDeviceTracking: false,
    };
    const res = await workoutSessionService.startWorkoutForLessonExercise(req);
    setWorkoutSessionSynced(res);
    return res;
  };

  const startWorkoutFree = async (exerciseId: string) => {
    const req: WorkoutExerciseReq = {
      exerciseId,
      haveAITracking: false,
      haveIOTDeviceTracking: false,
    };
    const res = await workoutSessionService.startFreeWorkout(req);
    setWorkoutSessionSynced(res);
    return res;
  };

  const endWorkout = async () => {
    const session = workoutSessionRef.current;
    if (!session) return;
    const recordUrl =
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
    return workoutSessionService.endWorkout(
      session.workoutSessionId,
      recordUrl,
    );
  };

  // ─── BUILD PAYLOAD ────────────────────────────────────────────────────────
  const buildPayload = (
    lesson: CourseLessonDetailType,
    progressId: string,
  ): PracticePayload => {
    const sorted = [...lesson.exercises].sort(
      (a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0),
    );
    return {
      isEnrolled: isEnrolledRef.current,
      progressId: isEnrolledRef.current ? progressId : '',
      lessonExerciseIds: isEnrolledRef.current
        ? sorted.map(ex => ex.lessonExerciseId)
        : [],
      exerciseIds: sorted.map(ex => ex.exercise.exerciseId),
      durations: sorted.map(ex => ex.exercise.duration ?? 60),
      lessonDurations: sorted.map(
        ex => ex.durationSeconds ?? ex.exercise.duration ?? 60,
      ),
      restSeconds: sorted.map(ex => ex.restSeconds ?? COUNTDOWN_REST),
      programId: program_id,
      traineeCourseId,
    };
  };

  // ─── AI HELPERS ───────────────────────────────────────────────────────────
  const supportsAI = (exercise: ExerciseType) => {
    return Boolean(exercise?.haveAIsupported || exercise?.nameInModelAI);
  };

  const fetchAiAllowed = async () => {
    try {
      setAiAllowed(activePackage === PackageType.VIP_MEMBER);
    } catch {
      setAiAllowed(false);
    }
  };

  // ─── START LESSON ─────────────────────────────────────────────────────────
  const onStartLesson = async (
    lesson: CourseLessonDetailType,
    progressId: string,
  ) => {
    if (isFromList) {
      // luôn cho tập
    } else if (isFromSearch) {
      if (isPaidUser) {
        if (isEnrolledRef.current) {
          // Giống ExerciseDetail: đã có gói + đã enroll → bảo chuyển sang List
          openRecommendModal(
            "Bạn cần chuyển sang 'Danh sách của tôi' để tập!",
            'LIST',
          );
          return;
        }
        // đã có gói, chưa enroll → cho tập
      } else {
        // chưa có gói
        if (isEnrolledRef.current) {
          openRecommendModal(
            "Bạn cần chuyển sang 'Danh sách của tôi' để tập!",
            'LIST',
          );
        } else {
          openRecommendModal(
            'Bạn cần mua gói hoặc mua khóa học để tập bài này!',
            'UPGRADE',
          );
        }
        return;
      }
    } else {
      // fallback
      if (!isPaidUser && !isEnrolledRef.current) {
        openRecommendModal('Bạn cần mua gói để tập bài này!', 'UPGRADE');
        return;
      }
    }

    setIsLoading(true);
    try {
      const payload = buildPayload(lesson, progressId);
      setPracticePayload(payload);
      practicePayloadRef.current = payload;

      const firstExerciseId = payload.exerciseIds[0];
      const [exercise, tutorial] = await Promise.all([
        exerciseService.getById(firstExerciseId),
        tutorialService.getById(firstExerciseId),
      ]);

      setCurrentExercise(exercise);
      setCurrentTutorial(tutorial);
      setCurrentExerciseIndex(0);
      currentExerciseIndexRef.current = 0;

      if (isEnrolledRef.current) {
        await Promise.all([
          courseLessonProgressService.startLesson(payload.progressId),
          startWorkoutForLessonExercise(payload, 0),
        ]);
      } else {
        await startWorkoutFree(firstExerciseId);
      }
      setIsPracticing(true);
      setShowStartCountdown(true);
    } catch (err: any) {
      openErrorModal(err?.message ?? 'Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  // ─── START AI LESSON ──────────────────────────────────────────────────────
  const onStartAILesson = async (
    lesson: CourseLessonDetailType,
    progressId: string,
  ) => {
    if (activePackage !== PackageType.VIP_MEMBER) {
      openRecommendModal(
        'Tính năng này chỉ dành cho gói VIP. Bạn có muốn tham khảo thử không?',
        'UPGRADE',
      );
      return;
    }

    if (isFromList) {
      // luôn cho tập
    } else if (isFromSearch) {
      if (isPaidUser) {
        if (isEnrolledRef.current) {
          openRecommendModal(
            "Bạn cần chuyển sang 'Danh sách của tôi' để tập!",
            'LIST',
          );
          return;
        }
        // đã có gói, chưa enroll → cho tập
      } else {
        if (isEnrolledRef.current) {
          openRecommendModal(
            "Bạn cần chuyển sang 'Danh sách của tôi' để tập!",
            'LIST',
          );
        } else {
          openRecommendModal(
            'Bạn cần mua gói hoặc mua khóa học để tập bài này!',
            'UPGRADE',
          );
        }
        return;
      }
    } else {
      if (!isPaidUser && !isEnrolledRef.current) {
        openRecommendModal('Bạn cần mua gói để tập bài này!', 'UPGRADE');
        return;
      }
    }

    setIsLoading(true);
    try {
      const payload = buildPayload(lesson, progressId);
      setPracticePayload(payload);
      practicePayloadRef.current = payload;

      const firstExerciseId = payload.exerciseIds[0];
      const [exercise, tutorial] = await Promise.all([
        exerciseService.getById(firstExerciseId),
        tutorialService.getById(firstExerciseId),
      ]);

      setCurrentExercise(exercise);
      setCurrentTutorial(tutorial);
      setCurrentExerciseIndex(0);
      currentExerciseIndexRef.current = 0;

      if (!aiAllowed) {
        openErrorModal('Tính năng AI chỉ dành cho hội viên VIP');
        return;
      }

      if (!supportsAI(exercise)) {
        // Fallback tự tập nếu bài không hỗ trợ AI
        await onStartLesson(lesson, progressId);
        return;
      }

      const { isIotDeviceConnected, hr, status, } = useBle();

      useEffect(() => {
        if (isIotDeviceConnected) {
          console.log("Thiết bị đã sẵn sàng với nhịp tim:", hr);
        } else {
          console.log("Đang chờ thiết bị... Trạng thái hiện tại:", status);
        }
      }, [isIotDeviceConnected, hr]);
      
      const req: WorkoutLessonExerciseReq = {
        courseLessonProgressId: progressId,
        lessonExerciseId: payload.lessonExerciseIds[0],
        haveAITracking: true,
        haveIOTDeviceTracking: isIotDeviceConnected,
      };

      const session =
        await workoutSessionService.startWorkoutForLessonExercise(req);
      setWorkoutSessionSynced(session);

      if (isEnrolledRef.current) {
        await courseLessonProgressService.startLesson(payload.progressId);
      }

      setIsPracticing(true);
      setShowStartCountdown(true);
    } catch (err: any) {
      openErrorModal(err?.message ?? 'Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  // ─── COUNTDOWN ────────────────────────────────────────────────────────────
  const onStartCountdownFinished = () => {
    setShowStartCountdown(false);
    setIsVideoVisible(true);
    setIsPlaying(true);

    const payload = practicePayloadRef.current;
    const duration =
      payload?.lessonDurations?.[currentExerciseIndexRef.current] ??
      payload?.durations?.[currentExerciseIndexRef.current] ??
      60;
    startExerciseTimer(duration);
  };

  const onRestCountdownFinished = async () => {
    setShowRestCountdown(false);
    setIsPlaying(true); // resume video bài tiếp
    await doTransitionToNextExercise();
  };

  // ─── EXERCISE DONE ────────────────────────────────────────────────────────
  const handleExerciseDone = async () => {
    const payload = practicePayloadRef.current;
    if (!payload) return;

    try {
      await endWorkout();

      const isLast =
        currentExerciseIndexRef.current === payload.exerciseIds.length - 1;

      if (!isLast) {
        // Dừng video khi nghỉ giữa bài
        setIsPlaying(false);
        const rest =
          payload.restSeconds?.[currentExerciseIndexRef.current] ??
          COUNTDOWN_REST;
        setRestCountdownDuration(rest);
        setShowRestCountdown(true);
      } else {
        if (isEnrolledRef.current) {
          await courseLessonProgressService.completeLesson(payload.progressId);
        }
        openPracticeSuccessModal('Bạn đã hoàn thành buổi tập!');
        setTimeout(async () => {
          stopPractice();
          // Fetch lại sau khi hoàn thành
          setIsLoading(true);
          try {
            await fetchById();
          } finally {
            setIsLoading(false);
          }
        }, TIMEOUT);
      }
    } catch (err) {
      console.error('handleExerciseDone error:', err);
    }
  };

  const doTransitionToNextExercise = async () => {
    const payload = practicePayloadRef.current;
    if (!payload) return;

    const nextIndex = currentExerciseIndexRef.current + 1;
    const nextExerciseId = payload.exerciseIds[nextIndex];

    currentExerciseIndexRef.current = nextIndex;
    setCurrentExerciseIndex(nextIndex);

    const [nextExercise, nextTutorial] = await Promise.all([
      exerciseService.getById(nextExerciseId),
      tutorialService.getById(nextExerciseId),
    ]);
    setCurrentExercise(nextExercise);
    setCurrentTutorial(nextTutorial);

    if (isEnrolledRef.current) {
      await startWorkoutForLessonExercise(payload, nextIndex);
    } else {
      await startWorkoutFree(nextExerciseId);
    }

    const duration =
      payload.lessonDurations?.[nextIndex] ??
      payload.durations?.[nextIndex] ??
      60;
    startExerciseTimer(duration);
  };

  // ─── STOP PRACTICE ────────────────────────────────────────────────────────
  const stopPractice = () => {
    clearExerciseTimer();
    timerStartedRef.current = false;
    setIsPracticing(false);
    setIsVideoVisible(false);
    setIsPlaying(false);
    setCurrentExercise(undefined);
    setCurrentTutorial(undefined);
    setCurrentExerciseIndex(0);
    currentExerciseIndexRef.current = 0;
    setPracticePayload(null);
    practicePayloadRef.current = null;
    setWorkoutSessionSynced(undefined);
  };

  const onPressExitPractice = () => {
    openPracticeConfirmModal('Nếu thoát ra, bạn sẽ phải tập lại từ đầu!');
  };

  // ─── VIDEO ────────────────────────────────────────────────────────────────
  const togglePlayButton = () => {
    setIsVideoVisible(true);
    setIsPlaying(prev => !prev);
  };

  // ─── HANDLERS: Program ────────────────────────────────────────────────────
  const onPress = () => {
    setShowSchedule(true);
  };

  const onPressBack = () => {
    if (isPracticing) {
      onPressExitPractice();
      return;
    }

    if (isFromList) {
      navigation.navigate('MainTabs', {
        screen: 'List',
      });

      return;
    } else if (isFromSearch) {
      navigation.navigate('Search', { navigateHome: true });
      return;
    }
    navigation.goBack();
  };

  const closeSchedule = () => {
    setShowSchedule(false);
    setSelectedDays([]);
    setSelectedStartDate('');
  };

  const handleSelectDay = (day: TrainingDay) => {
    setSelectedDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day],
    );
  };

  const onPressRegister = (startDate: string) => {
    if (!programFullDetail) return;
    setSelectedStartDate(startDate);
    openConfirmModal(
      `Bạn có chắc muốn đăng ký khóa học với giá ${formatVND(programFullDetail.course.price)}?`,
    );
  };

  const openResetSchedule = () => setShowResetSchedule(true);

  const closeResetSchedule = () => {
    setShowResetSchedule(false);
    setResetSelectedDays([]);
  };

  const handleSelectResetDay = (day: TrainingDay) => {
    setResetSelectedDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day],
    );
  };

  const onPressConfirmReset = (
    startDate: string,
    mode: 'full' | 'incomplete',
  ) => {
    openConfirmModal(
      mode === 'full'
        ? 'Bạn có chắc muốn đặt lại toàn bộ lịch tập? Tiến độ hiện tại sẽ bị xóa.'
        : 'Bạn có chắc muốn lên lịch lại các bài chưa hoàn thành?',
    );
    setPendingReset({ startDate, mode });
  };

  // ─── MODALS: Program ──────────────────────────────────────────────────────
  const openSuccessModal = (msg: string) => {
    setSuccessMsg(msg);
    setShowSuccessModal(true);
  };

  const closeSuccessModal = () => {
    setSuccessMsg('');
    setShowSuccessModal(false);
  };

  const openErrorModal = (msg: string) => {
    setErrorMsg(msg);
    setShowErrorModal(true);
  };

  const closeErrorModal = () => {
    setErrorMsg('');
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

  const onConfirmModal = () => {
    closeConfirmModal();

    if (pendingReset) {
      // Đây là confirm reset
      const { startDate, mode } = pendingReset;
      setPendingReset(null);
      if (mode === 'full') {
        resetSchedule(startDate);
      } else {
        resetIncompleteLesson(startDate);
      }
    } else {
      // Đây là confirm đăng ký khóa học
      closeSchedule();
      enrollCourse();
    }
  };

  const openRecommendModal = (msg: string, action: 'UPGRADE' | 'LIST') => {
    setRecommendMsg(msg);
    setRecommendAction(action);
    setShowRecommendModal(true);
  };

  const closeRecommendModal = () => {
    setRecommendMsg('');
    setShowRecommendModal(false);
  };

  const onConfirmRecommendModal = () => {
    closeRecommendModal();
    if (recommendAction === 'UPGRADE') {
      navigation.navigate('UpgradePlan');
    }
    if (recommendAction === 'LIST') {
      navigation.navigate('MainTabs', { screen: 'List' });
    }
  };

  // ─── MODALS: Practice ─────────────────────────────────────────────────────
  const openPracticeSuccessModal = (msg: string) => {
    setPracticeSuccessMsg(msg);
    setShowPracticeSuccessModal(true);
  };
  const closePracticeSuccessModal = () => {
    setPracticeSuccessMsg('');
    setShowPracticeSuccessModal(false);
  };

  const openPracticeConfirmModal = (msg: string) => {
    setPracticeConfirmMsg(msg);
    setShowPracticeConfirmModal(true);
  };
  const closePracticeConfirmModal = () => {
    setPracticeConfirmMsg('');
    setShowPracticeConfirmModal(false);
  };
  const onPracticeConfirmModal = () => {
    closePracticeConfirmModal();
    stopPractice();
  };

  // ─── CHECK ──────────────────────────────────────────────────────────────
  const isValid = !isInsufficientBalance && !walletError;

  // ─── EFFECTS ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!program_id) return;

    const fetchAll = async () => {
      setIsLoading(true);
      try {
        await Promise.allSettled([
          fetchInformation(),
          fetchById(),
          fetchWallet(),
          fetchAiAllowed(),
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAll();
  }, [program_id]);

  useEffect(() => {
    if (!programFullDetail || !wallet) return;
    setIsInsufficientBalance(
      wallet.availableVND < programFullDetail.course.price,
    );
  }, [programFullDetail, wallet]);

  // ─── RETURN ───────────────────────────────────────────────────────────────
  return {
    // Program
    programFullDetail,
    programDetail: programFullDetail?.course,
    lessons: programFullDetail?.lessons ?? [],
    isLoading,
    isEnrolled,
    progressOfCourse,
    completedLessonIds,
    activePackage,
    source,
    isFromList,
    isFromSearch,
    isValid,
    isInsufficientBalance,
    walletError,
    traineeCourseId,
    getProgressOfCourseLessonRaw,
    onPress,
    onPressBack,
    // Schedule
    showSchedule,
    closeSchedule,
    handleSelectDay,
    selectedDays,
    onPressRegister,
    showResetSchedule,
    closeResetSchedule,
    openResetSchedule,
    handleSelectResetDay,
    resetSelectedDays,
    onPressConfirmReset,
    // Modals: Program
    errorMsg,
    showErrorModal,
    closeErrorModal,
    successMsg,
    showSuccessModal,
    closeSuccessModal,
    confirmMsg,
    showConfirmModal,
    closeConfirmModal,
    onConfirmModal,
    recommendMsg,
    showRecommendModal,
    closeRecommendModal,
    onConfirmRecommendModal,
    // Practice
    isPracticing,
    isVideoVisible,
    isPlaying,
    currentExercise,
    currentTutorial,
    currentExerciseIndex,
    practicePayload,
    onStartLesson,
    stopPractice,
    onPressExitPractice,
    togglePlayButton,
    aiAllowed,
    onStartAILesson,
    // Countdown
    showStartCountdown,
    onStartCountdownFinished,
    showRestCountdown,
    restCountdownDuration,
    onRestCountdownFinished,
    COUNTDOWN_START,
    // Timer
    exerciseTimeLeft,
    isExerciseRunning,
    // Modals: Practice
    practiceSuccessMsg,
    showPracticeSuccessModal,
    closePracticeSuccessModal,
    practiceConfirmMsg,
    showPracticeConfirmModal,
    closePracticeConfirmModal,
    onPracticeConfirmModal,
  };
};
