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
  const [isVideoPlay, setIsVideoPlay] = useState<boolean>(false);
  const [isShowFlag, setIsShowFlag] = useState<boolean>(false);
  const [isVideoExpand, setIsVideoExpand] = useState<boolean>(false);

  // CHECK
  const isPracticeTab = activeTab === ExerciseTab.Practice;

  // FETCH
  const fetchById = () => {
    setExerciseDetail(exerciseMock[0]);
  };

  // HANDLERS
  const onChangeTab = (tabId: ExerciseTab) => {
    setActiveTab(tabId);
  };

  const togglePlayButton = () => {
    setIsVideoPlay(prev => !prev);
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
    setIsVideoPlay(false);
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
    isVideoPlay,
    togglePlayButton,
    isPracticeTab,
    isShowFlag,
    isVideoExpand,
    toggleVideoExpand,
    navigatePracticeTab,
  };
};
