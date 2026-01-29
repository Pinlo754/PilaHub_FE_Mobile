import React from 'react';
import { View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import ImageExercise from './components/ImageExercise';
import { useExerciseDetail } from './useExerciseDetail';
import Header from './components/Header';
import VideoExpand from './components/VideoExpand';
import OverviewSection from './components/OverviewSection';
import StatsSection from './components/StatsSection';
import VideoShrink from './components/VideoShrink';

type Props = NativeStackScreenProps<RootStackParamList, 'ExerciseDetail'>;

const ExerciseDetail: React.FC<Props> = ({ route, navigation }) => {
  // HOOK
  const {
    activeTab,
    exerciseDetail,
    onChangeTab,
    isVideoPlay,
    togglePlayButton,
    isPracticeTab,
    isShowFlag,
    toggleVideoExpand,
    isVideoExpand,
    navigatePracticeTab,
  } = useExerciseDetail({
    route,
  });

  // LOADING
  if (!exerciseDetail) return null;

  return (
    <View className="w-full flex-1 relative">
      {/* Header */}
      <Header
        isVideoExpand={isVideoExpand}
        isVideoPlay={isVideoPlay}
        isShowFlag={isShowFlag}
        navigation={navigation}
        navigatePracticeTab={navigatePracticeTab}
      />

      {/* Image / Video */}
      {isVideoExpand ? (
        <VideoExpand />
      ) : isVideoPlay ? (
        <VideoShrink />
      ) : (
        <ImageExercise imgUrl={exerciseDetail?.image_url} />
      )}

      {/* Overview / Stats */}
      {isVideoExpand ? (
        <StatsSection
          isPracticeTab={isPracticeTab}
          exerciseName={exerciseDetail.name}
          isVideoPlay={isVideoPlay}
          togglePlayButton={togglePlayButton}
        />
      ) : (
        <OverviewSection
          activeTab={activeTab}
          exerciseDetail={exerciseDetail}
          onChangeTab={onChangeTab}
          isVideoPlay={isVideoPlay}
          togglePlayButton={togglePlayButton}
          toggleVideoExpand={toggleVideoExpand}
          isPracticeTab={isPracticeTab}
        />
      )}
    </View>
  );
};

export default ExerciseDetail;
