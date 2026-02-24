import { useEffect, useState } from 'react';
import { ExerciseTab } from '../../constants/exerciseTab';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { RouteProp } from '@react-navigation/native';
import { ExerciseType } from '../../utils/ExerciseType';
import { exerciseMock } from '../../mocks/searchData';

type Props = {
  route: RouteProp<RootStackParamList, 'ExerciseDetail'>;
};

export const useExerciseDetail = ({ route }: Props) => {
  // PARAM
  const { exercise_id } = route.params;

  // STATE
  const [activeTab, setActiveTab] = useState<ExerciseTab>(ExerciseTab.Theory);
  const [exerciseDetail, setExerciseDetail] = useState<ExerciseType>();
  const [isShowFlag, setIsShowFlag] = useState<boolean>(false);
  const [isVideoVisible, setIsVideoVisible] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isVideoExpand, setIsVideoExpand] = useState<boolean>(false);

  // CHECK
  const isPracticeTab = activeTab === ExerciseTab.Practice;

  // FETCH
  const fetchById = () => {
    setExerciseDetail(exerciseMock[0]);
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

  // USE EFFECT
  useEffect(() => {
    if (!exercise_id) return;

    fetchById();
  }, [exercise_id]);

  return {
    activeTab,
    exerciseDetail,
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
  };
};
