import { useEffect, useRef, useState } from 'react';
import { ExerciseTab } from '../../constants/exerciseTab';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { RouteProp } from '@react-navigation/native';
import {
  ExerciseType,
  PackageType,
  TutorialType,
} from '../../utils/ExerciseType';
import { exerciseService } from '../../hooks/exercise.service';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { tutorialService } from '../../hooks/tutorial.service';
import { workoutSessionService } from '../../hooks/workoutSession.service';
import {
  GetByExerciseIdParams,
  WorkoutExerciseReq,
  WorkoutLessonExerciseReq,
  WorkoutSessionType,
} from '../../utils/WorkoutSessionType';
import { courseLessonProgressService } from '../../hooks/courseLessonProgress.service';
import { getProfile } from '../../services/auth';
import { lessonExerciseProgressService } from '../../hooks/lessonExerciseProgress.service';
import { ExerciseEquipment } from '../../utils/EquipmentType';
import { workoutFeedbackService } from '../../hooks/workoutFeedback.service';
import { mistakeLogService } from '../../hooks/mistakeLog.service';
import { heartRateService } from '../../hooks/heartRate.service';

type Props = {
  route: RouteProp<RootStackParamList, 'ExerciseDetail'>;
  navigation: NativeStackNavigationProp<RootStackParamList, 'ExerciseDetail'>;
};

export const useExerciseDetail = ({ route, navigation }: Props) => {
  // ─── PARAMS ───────────────────────────────────────────────────────────────z
  const { exercise_id, allowedPractice, allowedTheory } = route.params;
  const practicePayload = route.params.practicePayload ?? null;
  const lessonExerciseIdParam = route.params.lessonExerciseId ?? null;
  const source = route.params?.source;

  // ─── CONSTANTS ────────────────────────────────────────────────────────────
  const TIMEOUT = 3010;
  const COUNTDOWN_START = 5;
  const COUNTDOWN_REST = 15;

  // ─── STATE ────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<ExerciseTab>(ExerciseTab.Theory);
  const [exerciseDetail, setExerciseDetail] = useState<ExerciseType>();
  const [currentExercise, setCurrentExercise] = useState<ExerciseType>();
  const [tutorial, setTutorial] = useState<TutorialType>();
  const [currentTutorial, setCurrentTutorial] = useState<TutorialType>();
  const [isShowFlag, setIsShowFlag] = useState<boolean>(false);
  const [isVideoVisible, setIsVideoVisible] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isVideoExpand, setIsVideoExpand] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [haveAITracking, setHaveAITracking] = useState<boolean>(false);
  const [haveIOTDeviceTracking, setHaveIOTDeviceTracking] =
    useState<boolean>(false);
  const [workoutSession, setWorkoutSession] = useState<WorkoutSessionType>();
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
  const [confirmMsg, setConfirmMsg] = useState<string>('');
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [recommendMsg, setRecommendMsg] = useState<string>('');
  const [recommendAction, setRecommendAction] = useState<
    'UPGRADE' | 'LIST' | null
  >(null);
  const [showRecommendModal, setShowRecommendModal] = useState<boolean>(false);
  const [notiMsg, setNotiMsg] = useState<string>('');
  const [showNotiModal, setShowNotiModal] = useState<boolean>(false);
  const [activePackage, setActivePackage] = useState<PackageType | null>(null);
  const [workoutHistory, setWorkoutHistory] = useState<WorkoutSessionType[]>(
    [],
  );
  const [exerciseEquipments, setExerciseEquipments] = useState<
    ExerciseEquipment[]
  >([]);
  const [showWorkoutHistory, setShowWorkoutHistory] = useState(false);
  // Countdown states
  const [showStartCountdown, setShowStartCountdown] = useState<boolean>(false);
  const [showRestCountdown, setShowRestCountdown] = useState<boolean>(false);
  const [restCountdownDuration, setRestCountdownDuration] =
    useState<number>(COUNTDOWN_REST);

  // Exercise duration countdown
  const [exerciseTimeLeft, setExerciseTimeLeft] = useState<number>(0);
  const [isExerciseRunning, setIsExerciseRunning] = useState<boolean>(false);

  // ─── REFS ─────────────────────────────────────────────────────────────────
  const exerciseTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentExerciseIndexRef = useRef<number>(0);
  const exerciseTimeLeftRef = useRef<number>(0);
  const timerStartedRef = useRef<boolean>(false);
  const workoutSessionRef = useRef<WorkoutSessionType | undefined>(undefined);

  // CHECK
  const isFromList = source === 'List';
  const isFromSearch = source === 'Search';
  const isFromRoadmap = source === 'Roadmap';
  const isPracticeTab = activeTab === ExerciseTab.Practice;
  const id = route.params.exercise_id;
  const isPaidUser = [PackageType.VIP_MEMBER, PackageType.MEMBER].includes(
    activePackage as PackageType,
  );
  const isCourseFlow = !!practicePayload;
  const isEnrolledCourse = practicePayload?.isEnrolled;
  const hasAccess = Boolean(isPaidUser || isEnrolledCourse);
  // const canPractice = [PackageType.VIP_MEMBER, PackageType.MEMBER].includes(
  //   activePackage as PackageType,
  // )
  //   ? true
  //   : (allowedPractice ?? false);

  //   const canPractice = (() => {
  //   // 3. Tập lẻ → luôn true
  //   if (!isCourseFlow) return true;

  //   // fallback nếu không có source
  //   if (!source) return true;

  //   // 1. Từ Search → cần có gói
  //   if (isFromSearch) return isPaidUser;

  //   // 2. Từ List → dùng allowedPractice
  //   if (isFromList) return allowedPractice ?? false;

  //   return false;
  // })();
  const canPractice = allowedPractice ?? true;
  const canPlayTheory = isPaidUser || (allowedTheory ?? false);

  // ─── HELPERS ──────────────────────────────────────────────────────────────
  /** Lấy duration (giây) cho bài hiện tại.
   *  - Course flow → lessonDurations[index]
   *  - Single flow  → exercise.duration
   */
  const getCurrentDuration = (index: number): number => {
    if (practicePayload) {
      return (
        practicePayload.lessonDurations?.[index] ??
        practicePayload.durations?.[index] ??
        60
      );
    }
    return exerciseDetail?.duration ?? 60;
  };

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

  const setWorkoutSessionSynced = (session: WorkoutSessionType | undefined) => {
    workoutSessionRef.current = session;
    setWorkoutSession(session);
  };

  // ─── FETCH ────────────────────────────────────────────────────────────────
  const fetchInformation = async () => {
    try {
      const res = await getProfile();
      if (!res.ok) return;
      setActivePackage(res.data.activePackageType);
    } catch (err: any) {
      if (err?.type === 'BUSINESS_ERROR') {
        setError(err.message);
      } else {
        setError('Có lỗi xảy ra. Vui lòng thử lại.');
      }
    }
  };

  const fetchById = async () => {
    if (!exercise_id) return;
    try {
      const [resExercise, resTutorial] = await Promise.all([
        exerciseService.getById(exercise_id),
        tutorialService.getById(exercise_id),
      ]);

      setExerciseDetail(resExercise);
      setCurrentExercise(resExercise);
      setTutorial(resTutorial);
      setCurrentTutorial(resTutorial);
    } catch (err: any) {
      if (err?.type === 'BUSINESS_ERROR') {
        setError(err.message);
      } else {
        setError('Có lỗi xảy ra. Vui lòng thử lại.');
      }
    }
  };

  const fetchWorkoutHistory = async () => {
    if (!exercise_id) return;
    try {
      const params: GetByExerciseIdParams = {};

      const lessonExerciseId =
        lessonExerciseIdParam ??
        practicePayload?.lessonExerciseIds[currentExerciseIndex];

      if (practicePayload?.progressId && lessonExerciseId) {
        const lessonExerciseProgressList =
          await lessonExerciseProgressService.getByCourseLessonProgressId(
            practicePayload.progressId,
          );

        const matched = lessonExerciseProgressList.find(
          item =>
            item.exerciseId === exercise_id &&
            item.lessonExerciseId === lessonExerciseId,
        );

        if (!matched) return;

        params.lessonExerciseProgressId = matched.lessonExerciseProgressId;
      }

      const res = await workoutSessionService.getByExerciseId(
        exercise_id,
        params,
      );

      setWorkoutHistory(res.filter(session => session.completed));
    } catch (err: any) {
      console.error('Fetch history error:', err);
    }
  };

  const fetchAllWorkoutHistory = async () => {
    if (!exercise_id) return;
    try {
      const res = await workoutSessionService.getAll(exercise_id);
      setWorkoutHistory(res.filter(session => session.completed));
    } catch (err: any) {
      console.error('Fetch history error:', err);
    }
  };

  const fetchEquipment = async () => {
    if (!exercise_id) return;
    try {
      const res = await exerciseService.getExerciseEquipment(exercise_id);
      setExerciseEquipments(res);
    } catch (err: any) {
      console.error('Fetch equipment error:', err);
    }
  };

  const fetchAISummary = async (
    workoutSessionId: string,
    recordUrl: string,
  ) => {
    setIsLoading(true);
    try {
      const [feedback, mistakeLog, heartRateLogs] = await Promise.all([
        workoutFeedbackService.getByWorkoutSessionId(workoutSessionId),
        mistakeLogService.getByWorkoutSessionId(workoutSessionId),
        heartRateService.getByWorkoutSessionId(workoutSessionId),
      ]);

      const formattedMistakes = mistakeLog.map(log => {
        // Trích xuất side từ chuỗi details (vd: lấy chữ "both" từ "Form error at Hips (both)")
        const sideMatch = log.details.match(/\(([^)]+)\)/);
        const side = sideMatch ? sideMatch[1] : "unknown";

        return {
          bodyPart: log.bodyPartName,
          side: side,
          recordedAtSecond: log.recordedAtSecond,
          duration: log.duration,
          imagePath: log.imageUrl
        };
      });

      navigation.navigate('AISummary', {
        feedback,
        videoUrl: recordUrl,
        mistakeLog: formattedMistakes,
        heartRateLogs: heartRateLogs.map(h => ({
          heartRate: h.heartRate,
          recordedAt: h.recordedAt,
        })),
      });
    } catch (err) {
      console.error('Fetch AI summary error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // ─── WORKOUT SESSION ───────────────────────────────────────────────────────
  const startWorkoutExerciseFree = async (exerciseIdParam?: string) => {
    const exerciseId = exerciseIdParam ?? id;

    if (!exerciseId) return;

    setIsLoading(true);
    setError(null);
    try {
      const payload: WorkoutExerciseReq = {
        exerciseId,
        haveAITracking: false,
        haveIOTDeviceTracking: false,
      };

      const res = await workoutSessionService.startFreeWorkout(payload);

      setWorkoutSessionSynced(res);
      return res;
    } catch (err: any) {
      if (err?.type === 'BUSINESS_ERROR') {
        setError(err.message);
      } else {
        setError('Có lỗi xảy ra. Vui lòng thử lại.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const startWorkoutExerciseAI = async () => {
    if (!exercise_id) return;

    setIsLoading(true);
    setError(null);

    try {
      const payload: WorkoutExerciseReq = {
        exerciseId: id,
        haveAITracking: true,
        haveIOTDeviceTracking: true,
      };

      console.log('startWorkoutExerciseAI payload', payload);
      const res = await workoutSessionService.startFreeWorkout(payload);

      setWorkoutSessionSynced(res);

      return res;
    } catch (err: any) {
      if (err?.type === 'BUSINESS_ERROR') {
        setError(err.message);
      } else {
        setError('Có lỗi xảy ra. Vui lòng thử lại.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const startWorkoutForLessonExercise = async (index?: number) => {
    if (!practicePayload) return Promise.reject('No payload');
    if (!practicePayload?.isEnrolled) return;

    const currentIndex = index ?? currentExerciseIndex;
    const lessonExerciseId = practicePayload.lessonExerciseIds[currentIndex];

    const payload: WorkoutLessonExerciseReq = {
      courseLessonProgressId: practicePayload.progressId,
      lessonExerciseId,
      haveAITracking,
      haveIOTDeviceTracking,
    };

    const res =
      await workoutSessionService.startWorkoutForLessonExercise(payload);
    setWorkoutSessionSynced(res);
    return res;
  };

  const startCourseLessonProgress = async () => {
    if (!practicePayload) return Promise.reject('No payload');
    if (!practicePayload?.isEnrolled) return;

    return courseLessonProgressService.startLesson(practicePayload.progressId);
  };

  const endWorkout = async () => {
    const session = workoutSessionRef.current;
    if (!session) return Promise.reject('No workout session');
    const recordUrl =
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';

    return workoutSessionService.endWorkout(
      session.workoutSessionId,
      recordUrl,
    );
  };

  const endCourseLessonProgress = async () => {
    if (!practicePayload) return Promise.reject('No payload');
    if (!practicePayload?.isEnrolled) return;

    return courseLessonProgressService.completeLesson(
      practicePayload.progressId,
    );
  };

  // ─── CORE LOGIC: bắt đầu tập (sau countdown) ──────────────────────────────
  /** Được gọi sau khi CountdownModal đếm ngược xong → hiện video + bắt đầu đếm duration */
  const onStartCountdownFinished = () => {
    setShowStartCountdown(false);
    setIsVideoVisible(true);
    setIsPlaying(true);
    setIsVideoExpand(true);

    if (isPracticeTab) {
      const duration = getCurrentDuration(currentExerciseIndexRef.current);
      startExerciseTimer(duration);
    }
  };

  /** Được gọi sau khi CountdownModal nghỉ giữa bài xong → chuyển bài tiếp */
  const onRestCountdownFinished = async () => {
    setShowRestCountdown(false);
    await doTransitionToNextExercise();
  };

  // ─── LOGIC CHUYỂN BÀI ────────────────────────────────────────────────────
  /**
   * Gọi khi đếm ngược duration hết.
   * Xử lý tất cả các TH: lẻ / course-paid / course-enrolled
   */
  const handleExerciseDone = async () => {
    try {
      // THEORY
      if (!isPracticeTab) {
        openSuccessModal('Bạn đã xem xong lý thuyết.');
        if (isVideoExpand) {
          setTimeout(() => toggleVideoExpand(), TIMEOUT);
        }
        return;
      }

      // BÀI TẬP LẺ
      if (!isCourseFlow) {
        await endWorkout();
        openSuccessModal('Bạn đã hoàn thành bài tập.');
        setTimeout(() => navigatePracticeTab(), TIMEOUT);
        return;
      }
      // COURSE FLOW
      const isLast =
        currentExerciseIndexRef.current ===
        practicePayload!.exerciseIds.length - 1;

      await endWorkout();

      if (!isLast) {
        setIsPlaying(false);
        const rest =
          practicePayload!.restSeconds?.[currentExerciseIndexRef.current] ??
          COUNTDOWN_REST;
        setRestCountdownDuration(rest);
        setShowRestCountdown(true);
      } else {
        // Hết tất cả bài trong lesson
        if (isEnrolledCourse) {
          await endCourseLessonProgress();
          openSuccessModal('Bạn đã hoàn thành buổi tập.');
          setTimeout(() => {
            navigation.navigate('ProgramDetail', {
              program_id: practicePayload!.programId,
              traineeCourseId: practicePayload!.traineeCourseId ?? undefined,
              source: 'List',
            });
          }, TIMEOUT);
        } else {
          // Mua gói
          openSuccessModal('Bạn đã hoàn thành buổi tập.');
          setTimeout(() => {
            navigation.navigate('ProgramDetail', {
              program_id: practicePayload!.programId,
              source: 'Search',
            });
          }, TIMEOUT);
        }
      }
    } catch (err) {
      console.error('handleExerciseDone error:', err);
      setError('Có lỗi khi kết thúc bài tập');
    }
  };

  /** Thực sự chuyển sang bài tiếp theo (sau rest countdown) */
  const doTransitionToNextExercise = async () => {
    const nextIndex = currentExerciseIndexRef.current + 1;
    const nextExerciseId = practicePayload!.exerciseIds[nextIndex];

    currentExerciseIndexRef.current = nextIndex;
    setCurrentExerciseIndex(nextIndex);

    const [nextExercise, nextTutorial] = await Promise.all([
      exerciseService.getById(nextExerciseId),
      tutorialService.getById(nextExerciseId),
    ]);
    setCurrentExercise(nextExercise);
    setCurrentTutorial(nextTutorial);

    if (isEnrolledCourse) {
      await startWorkoutForLessonExercise(nextIndex);
    } else {
      await startWorkoutExerciseFree(nextExerciseId);
    }

    // Bắt đầu đếm ngược duration bài tiếp
    const duration =
      practicePayload!.lessonDurations?.[nextIndex] ??
      practicePayload!.durations?.[nextIndex] ??
      60;
    startExerciseTimer(duration);
  };

  // ─── HANDLERS ─────────────────────────────────────────────────────────────
  const onChangeTab = (tabId: ExerciseTab) => {
    if (tabId === ExerciseTab.Practice) {
      hideVideo();
    }
    setActiveTab(tabId);
  };

  const showVideo = () => {
    setIsVideoVisible(true);
    setIsPlaying(true);
  };

  const hideVideo = () => {
    setIsVideoVisible(false);
    setIsPlaying(false);
  };

  const togglePlayButton = () => {
    if (!hasAccess) {
      if (practicePayload) {
        openRecommendModal(
          'Bạn cần mua gói hoặc mua khóa học để xem bài này!',
          'UPGRADE',
        );
      } else {
        openRecommendModal('Bạn cần mua gói để xem bài này!', 'UPGRADE');
      }
      return;
    }

    setIsVideoVisible(true);
    setIsPlaying(prev => !prev);
  };

  const toggleVideoExpand = () => {
    // startWorkoutExerciseFree();
    setIsVideoExpand(prev => {
      if (activeTab === ExerciseTab.Practice) {
        togglePlayButton();
      }
      return !prev;
    });
  };

  const navigatePracticeTab = async () => {
    clearExerciseTimer();
    timerStartedRef.current = false;
    setIsShowFlag(false);
    setIsVideoVisible(false);
    setIsPlaying(false);
    setIsVideoExpand(false);
    setCurrentExercise(exerciseDetail);
    setCurrentTutorial(tutorial);
    setCurrentExerciseIndex(0);
    currentExerciseIndexRef.current = 0;
    if (isPracticeTab) {
      await fetchAllWorkoutHistory();
    }
  };

  const onPressStartCourseLesson = async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (!practicePayload) {
        await startWorkoutExerciseFree();
      } else if (isEnrolledCourse) {
        const [workoutRes] = await Promise.all([
          startWorkoutForLessonExercise(0),
          startCourseLessonProgress(),
        ]);

        setWorkoutSession(workoutRes);
      } else {
        await startWorkoutExerciseFree();
      }
      setShowStartCountdown(true);
    } catch (err: any) {
      if (err?.type === 'BUSINESS_ERROR') {
        setError(err.message);
      } else {
        setError('Có lỗi xảy ra. Vui lòng thử lại.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const onPressPractice = async () => {
    // FROM LIST → luôn cho chạy
    if (isFromList) {
      await onPressStartCourseLesson();
      return;
    }

    // FROM SEARCH
    if (isFromSearch) {
      // đã có gói → cho chạy
      if (isPaidUser) {
        if (isEnrolledCourse) {
          openRecommendModal(
            "Bạn cần chuyển sang 'Danh sách của tôi' để tập!",
            'LIST',
          );
          return;
        }
        await onPressStartCourseLesson();
        return;
      }

      // chưa có gói
      if (isEnrolledCourse) {
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

    // fallback
    if (!hasAccess) {
      if (practicePayload) {
        openRecommendModal(
          'Bạn cần mua gói hoặc mua khóa học để tập bài này!',
          'UPGRADE',
        );
      } else {
        openRecommendModal('Bạn cần mua gói để tập bài này!', 'UPGRADE');
      }
      return;
    }

    await onPressStartCourseLesson();
  };

  const onPressAIPractice = async () => {
    if (!exerciseDetail || !tutorial) return;

    if (activePackage !== PackageType.VIP_MEMBER) {
      openRecommendModal(
        'Tính năng này chỉ dành cho gói VIP. Bạn có muốn tham khảo thử không?',
        'UPGRADE',
      );
      return;
    }

    if (
      !exerciseDetail.haveAIsupported ||
      !exerciseDetail.nameInModelAI?.trim()
    ) {
      // Nếu bài không hỗ trợ AI, chuyển về self-practice
      await onPressPractice();
      return;
    }

    setHaveAITracking(true);

    const session = await startWorkoutExerciseAI();

    if (!session) return;

    navigation.navigate('AIPractice', {
      exercise_id: id,
      imgUrl: exerciseDetail.imageUrl,
      videoUrl: tutorial.practiceVideoUrl,
      workoutSessionId: session.workoutSessionId,
      nameAITracking: exerciseDetail.nameInModelAI || '',
    });
  };

  const onPressBack = () => {
    if (isVideoExpand) {
      openConfirmModal('Nếu thoát ra, bạn sẽ phải tập lại từ đầu!');
    } else {
      navigation.goBack();
    }
  };

  // ─── VIDEO END (giữ lại cho TH Theory dùng video end) ────────────────────
  /** Chỉ xử lý khi ở Theory tab – Practice tab dùng timer riêng */
  const handleVideoEnd = async () => {
    if (isPracticeTab) return; // Practice đã xử lý bởi timer

    // THEORY
    openSuccessModal('Bạn đã xem xong lý thuyết!');
    if (isVideoExpand) {
      setTimeout(() => toggleVideoExpand(), TIMEOUT);
    }
  };

  // ─── MODALS ───────────────────────────────────────────────────────────────
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
    navigatePracticeTab();
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
      navigation.navigate('MainTabs', {
        screen: 'List',
      });
    }
  };

  const openNotiModal = (msg: string) => {
    setNotiMsg(msg);
    setShowNotiModal(true);
  };

  const closeNotiModal = () => {
    setNotiMsg('');
    setShowNotiModal(false);
  };

  // ─── EFFECTS ──────────────────────────────────────────────────────────────
  useEffect(() => {
    currentExerciseIndexRef.current = currentExerciseIndex;
  }, [currentExerciseIndex]);

  useEffect(() => {
    if (!exercise_id) return;

    const fetchAll = async () => {
      setIsLoading(true);
      try {
        await Promise.allSettled([
          await fetchInformation(),
          await fetchById(),
          await fetchAllWorkoutHistory(),
          await fetchEquipment(),
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAll();
  }, [exercise_id]);

  useEffect(() => {
    if (!isPracticeTab) return;
    if (!timerStartedRef.current) return;

    if (isPlaying) {
      resumeExerciseTimer();
    } else {
      pauseExerciseTimer();
    }
  }, [isPlaying]);

  useEffect(() => {
    return () => clearExerciseTimer();
  }, []);

  // ─── RETURN ───────────────────────────────────────────────────────────────
  return {
    activeTab,
    exerciseEquipments,
    exerciseDetail,
    currentExercise,
    tutorial,
    onChangeTab,
    isVideoVisible,
    isPlaying,
    togglePlayButton,
    isPracticeTab,
    isShowFlag,
    isVideoExpand,
    toggleVideoExpand,
    navigatePracticeTab,
    showVideo,
    hideVideo,
    setIsShowFlag,
    isLoading,
    error,
    canPractice,
    onPressStartCourseLesson,
    onPressAIPractice,
    // expose ids for video player
    personalExerciseId: exerciseDetail?.exerciseId ?? undefined,
    personalScheduleId:
      (exerciseDetail as any)?.personalScheduleId ?? undefined,
    onPressPractice,
    currentExerciseIndex,
    handleVideoEnd,
    showSuccessModal,
    closeSuccessModal,
    successMsg,
    activePackage,
    currentTutorial,
    confirmMsg,
    showConfirmModal,
    closeConfirmModal,
    onConfirmModal,
    onPressBack,
    practicePayload,
    workoutHistory,
    canPlayTheory,
    fetchAISummary,
    openRecommendModal,
    recommendMsg,
    closeRecommendModal,
    onConfirmRecommendModal,
    showRecommendModal,
    hasAccess,
    isFromList,
    isFromSearch,
    isFromRoadmap,
    // countdown
    showStartCountdown,
    onStartCountdownFinished,
    showRestCountdown,
    restCountdownDuration,
    onRestCountdownFinished,
    // exercise timer
    exerciseTimeLeft,
    isExerciseRunning,
    COUNTDOWN_START,
    closeNotiModal,
    showNotiModal,
    notiMsg,
    showWorkoutHistory,
    setShowWorkoutHistory,
  };
};
