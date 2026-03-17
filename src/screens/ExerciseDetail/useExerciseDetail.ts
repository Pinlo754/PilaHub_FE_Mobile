import { useEffect, useState } from 'react';
import { ExerciseTab } from '../../constants/exerciseTab';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { RouteProp } from '@react-navigation/native';
import { ExerciseType, TutorialType } from '../../utils/ExerciseType';
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

type Props = {
  route: RouteProp<RootStackParamList, 'ExerciseDetail'>;
  navigation: NativeStackNavigationProp<RootStackParamList, 'ExerciseDetail'>;
};

export const useExerciseDetail = ({ route, navigation }: Props) => {
  // PARAM
  const { exercise_id, allowedPractice, practicePayload } = route.params;

  // CONSTANT
  const TIMEOUT = 3010;

  // STATE
  const [activeTab, setActiveTab] = useState<ExerciseTab>(ExerciseTab.Theory);
  const [exerciseDetail, setExerciseDetail] = useState<ExerciseType>();
  const [tutorial, setTutorial] = useState<TutorialType>();
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
  const currentExerciseId = practicePayload?.exerciseIds[currentExerciseIndex];
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);

  // CHECK
  const isPracticeTab = activeTab === ExerciseTab.Practice;
  const id = route.params.exercise_id;
  const canPractice = allowedPractice ?? true;

  // FETCH
  const fetchById = async () => {
    if (!exercise_id) return;

    setIsLoading(true);
    setError(null);
    try {
      const resExercise = await exerciseService.getById(exercise_id);
      const resTutorial = await tutorialService.getById(exercise_id);

      setExerciseDetail(resExercise);
      setTutorial(resTutorial);
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

  const handleVideoEnd = async () => {
    try {
      // await endWorkout();

      if (!practicePayload) return;

      const isLast =
        currentExerciseIndex === practicePayload.exerciseIds.length - 1;

      if (!isLast) {
        const nextIndex = currentExerciseIndex + 1;
        const nextExerciseId = practicePayload.exerciseIds[nextIndex];

        setCurrentExerciseIndex(nextIndex);

        // Fetch tutorial mới
        const nextTutorial = await tutorialService.getById(nextExerciseId);
        setTutorial(nextTutorial);

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

  // USE EFFECT
  useEffect(() => {
    if (!exercise_id) return;

    fetchById();
  }, [exercise_id]);

  return {
    activeTab,
    exerciseDetail,
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
  };
};
