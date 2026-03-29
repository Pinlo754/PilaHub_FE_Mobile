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
  WorkoutSessionType,
} from '../../utils/WorkoutSessionType';
import { useBle } from '../../services/BleProvider';

type Props = {
  route: RouteProp<RootStackParamList, 'ExerciseDetail'>;
  navigation: NativeStackNavigationProp<RootStackParamList, 'ExerciseDetail'>;
};

export const useExerciseDetail = ({ route, navigation }: Props) => {
  // PARAM
  const { exercise_id } = route.params;

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

  // read BLE connection state to decide whether IoT device tracking is available
  const { connectedDevice } = useBle();

  useEffect(() => {
    setHaveIOTDeviceTracking(Boolean(connectedDevice));
  }, [connectedDevice]);

  // CHECK
  const isPracticeTab = activeTab === ExerciseTab.Practice;
  const id = route.params.exercise_id;
  // API
  const fetchById = async () => {

    if (!exercise_id) return;

    setIsLoading(true);
    setError(null);
    try {
      const resExercise = await exerciseService.getById(id);
      const resTutorial = await tutorialService.getById('188aaa74-19f3-4475-8fdc-fb626d760126');

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

  const startWorkoutExerciseFree = async () => {
    if (!id) return;

    setIsLoading(true);
    setError(null);
    try {
      const payload: WorkoutExerciseReq = {
        exerciseId: id,
        haveAITracking: false,
        haveIOTDeviceTracking: false,
      };

      const res = await workoutSessionService.startFreeWorkout(payload);

      setWorkoutSession(res);
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
        haveIOTDeviceTracking: Boolean(connectedDevice) || haveIOTDeviceTracking,
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
    startWorkoutExerciseFree();
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
    onPressAIPractice,
  };
};
