import { useEffect, useState } from 'react';
import { ExerciseTab } from '../../constants/exerciseTab';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { RouteProp } from '@react-navigation/native';
import { ExerciseType, TutorialType } from '../../utils/ExerciseType';
import { exerciseService } from '../../hooks/exercise.service';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { tutorialService } from '../../hooks/tutorial.service';

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

  // CHECK
  const isPracticeTab = activeTab === ExerciseTab.Practice;

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

  const onPressAIPractice = () => {
    if (!exerciseDetail || !tutorial) return null;

    navigation.navigate('AIPractice', {
      exercise_id,
      imgUrl: exerciseDetail?.imageUrl,
      videoUrl: tutorial?.practiceVideoUrl,
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
