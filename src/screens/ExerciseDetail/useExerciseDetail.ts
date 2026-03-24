import { useEffect, useState } from 'react';
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
  WorkoutExerciseReq,
  WorkoutLessonExerciseReq,
  WorkoutSessionType,
} from '../../utils/WorkoutSessionType';
import { courseLessonProgressService } from '../../hooks/courseLessonProgress.service';
import { getProfile } from '../../services/auth';

type Props = {
  route: RouteProp<RootStackParamList, 'ExerciseDetail'>;
  navigation: NativeStackNavigationProp<RootStackParamList, 'ExerciseDetail'>;
};

export const useExerciseDetail = ({ route, navigation }: Props) => {
  // PARAM
  const { exercise_id, allowedPractice } = route.params;
  const practicePayload = route.params.practicePayload ?? null;

  // CONSTANT
  const TIMEOUT = 3010;

  // STATE
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
  const [activePackage, setActivePackage] = useState<PackageType | null>(null);

  // CHECK
  const isPracticeTab = activeTab === ExerciseTab.Practice;
  const id = route.params.exercise_id;
  const canPractice = allowedPractice ?? true;

  // FETCH
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

  const startWorkoutExerciseAI = async () => {
    if (!exercise_id) return;

    setIsLoading(true);
    setError(null);

    try {
      const payload: WorkoutExerciseReq = {
        exerciseId: id,
        haveAITracking: true,
        // haveIOTDeviceTracking: Boolean(connectedDevice) || haveIOTDeviceTracking,
        haveIOTDeviceTracking,
      };

      const res = await workoutSessionService.startFreeWorkout(payload);

      setWorkoutSession(res);

      return res; // 🔥 return session
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

  const startWorkoutForLessonExercise = async () => {
    if (!practicePayload) return Promise.reject('No payload');

    const payload: WorkoutLessonExerciseReq = {
      courseLessonProgressId: practicePayload.progressId,
      lessonExerciseId: practicePayload.lessonExericseId,
      haveAITracking,
      haveIOTDeviceTracking,
    };

    return workoutSessionService.startWorkoutForLessonExercise(payload);
  };

  const startCourseLessonProgress = async () => {
    if (!practicePayload) return Promise.reject('No payload');

    return courseLessonProgressService.startLesson(practicePayload.progressId);
  };

  const endWorkout = async () => {
    if (!workoutSession) return Promise.reject('No workout session');
    const recordUrl = '';

    return workoutSessionService.endWorkout(
      workoutSession?.workoutSessionId,
      recordUrl,
    );
  };

  const endCourseLessonProgress = async () => {
    if (!practicePayload) return Promise.reject('No payload');

    return courseLessonProgressService.completeLesson(
      practicePayload.progressId,
    );
  };

  // HANDLERS
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
    setIsVideoVisible(true);
    setIsPlaying(prev => !prev);
  };

  const toggleVideoExpand = () => {
    setIsVideoExpand(prev => {
      if (activeTab === ExerciseTab.Practice) {
        togglePlayButton();
      }
      return !prev;
    });
  };

  const navigatePracticeTab = () => {
    setIsShowFlag(false);
    setIsVideoVisible(false);
    setIsPlaying(false);
    setIsVideoExpand(false);
    setCurrentExercise(exerciseDetail);
    setCurrentTutorial(tutorial);
    setCurrentExerciseIndex(0);
  };

  const onPressStartCourseLesson = async () => {
    if (!practicePayload) return;

    setIsLoading(true);
    setError(null);

    try {
      const [workoutRes] = await Promise.all([
        startWorkoutForLessonExercise(),
        startCourseLessonProgress(),
      ]);

      setWorkoutSession(workoutRes);
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
    await onPressStartCourseLesson();
    toggleVideoExpand();
  };

  const onPressAIPractice = async () => {
    if (!exerciseDetail || !tutorial) return;

    setHaveAITracking(true);

    const session = await startWorkoutExerciseAI();

    if (!session) return;

    navigation.navigate('AIPractice', {
      exercise_id: id,
      imgUrl: exerciseDetail.imageUrl,
      videoUrl: tutorial.practiceVideoUrl,
      workoutSessionId: session.workoutSessionId,
    });
  };

  const onPressBack = () => {
    if (isVideoExpand) {
      openConfirmModal('Nếu thoát ra, bạn sẽ phải tập lại từ đầu!');
    } else {
      navigation.goBack();
    }
  };

  const handleVideoEnd = async () => {
    try {
      if (!isPracticeTab) {
        openSuccessModal('Bạn đã xem xong lý thuyết.');

        if (isVideoExpand) {
          setTimeout(() => {
            toggleVideoExpand();
          }, TIMEOUT);
        }
        return;
      }
      // await endWorkout();

      if (!practicePayload) {
        openSuccessModal('Bạn đã hoàn thành bài tập.');
        setTimeout(() => {
          navigatePracticeTab();
        }, TIMEOUT);
      } else {
        const isLast =
          currentExerciseIndex === practicePayload.exerciseIds.length - 1;

        if (!isLast) {
          const nextIndex = currentExerciseIndex + 1;
          const nextExerciseId = practicePayload.exerciseIds[nextIndex];

          setCurrentExerciseIndex(nextIndex);

          // Fetch tutorial mới
          const [nextExercise, nextTutorial] = await Promise.all([
            exerciseService.getById(nextExerciseId),
            tutorialService.getById(nextExerciseId),
          ]);
          setCurrentExercise(nextExercise);
          setCurrentTutorial(nextTutorial);

          // Start workout mới
          const newWorkout = await startWorkoutForLessonExercise();
          setWorkoutSession(newWorkout);
        } else {
          // Hoàn thành lesson
          await endCourseLessonProgress();

          openSuccessModal('Bạn đã hoàn thành buổi tập.');
          setTimeout(() => {
            navigation.navigate('MainTabs', { screen: 'Home' });
          }, TIMEOUT);
        }
      }
    } catch (err) {
      console.error(err);
      setError('Có lỗi khi chuyển bài tập');
    }
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
    navigatePracticeTab();
  };

  // USE EFFECT
  useEffect(() => {
    if (!exercise_id) return;

    const fetchAll = async () => {
      setIsLoading(true);
      try {
        await fetchInformation();
        await fetchById();
      } finally {
        setIsLoading(false);
      }
    };

    fetchAll();
  }, [exercise_id]);

  return {
    activeTab,
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
  };
};
