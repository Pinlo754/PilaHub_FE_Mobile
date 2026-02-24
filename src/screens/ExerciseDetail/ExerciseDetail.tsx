import React from 'react';
import { View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import ImageExercise from './components/ImageExercise';
import { useExerciseDetail } from './useExerciseDetail';
import Header from './components/Header';
import OverviewSection from './components/OverviewSection';
import StatsSection from './components/StatsSection';
import VideoPlayer from './components/VideoPlayer/VideoPlayer';

type Props = NativeStackScreenProps<RootStackParamList, 'ExerciseDetail'>;

const ExerciseDetail: React.FC<Props> = ({ route, navigation }) => {
  // HOOK
  const {
    activeTab,
    exerciseDetail,
    onChangeTab,
    isVideoVisible,
    isPlaying,
    togglePlayButton,
    isPracticeTab,
    isShowFlag,
    toggleVideoExpand,
    isVideoExpand,
    navigatePracticeTab,
    setIsShowFlag,
  } = useExerciseDetail({
    route,
  });

  // LOADING
  if (!exerciseDetail) return null;

  return (
    <View className="w-full flex-1 relative">
      {/* Header */}
      <Header
        activeTab={activeTab}
        isVideoExpand={isVideoExpand}
        isVideoPlay={isPlaying}
        isShowFlag={isShowFlag}
        navigation={navigation}
        navigatePracticeTab={navigatePracticeTab}
        exerciseId={exerciseDetail.exercise_id}
      />

      {/* Image / Video */}
      {isVideoVisible ? (
        <VideoPlayer
          source="https://www.w3schools.com/html/mov_bbb.mp4"
          isVideoPlay={isPlaying}
          isVideoExpand={isVideoExpand}
          toggleVideoExpand={toggleVideoExpand}
          isPracticeTab={isPracticeTab}
          setIsShowFlag={setIsShowFlag}
        />
      ) : (
        <ImageExercise imgUrl={exerciseDetail?.image_url} />
      )}

      {/* Overview / Stats */}
      {isVideoExpand ? (
        <StatsSection
          isPracticeTab={isPracticeTab}
          exerciseName={exerciseDetail.name}
          isVideoPlay={isPlaying}
          togglePlayButton={togglePlayButton}
        />
      ) : (
        <OverviewSection
          activeTab={activeTab}
          exerciseDetail={exerciseDetail}
          onChangeTab={onChangeTab}
          isVideoPlay={isPlaying}
          togglePlayButton={togglePlayButton}
          toggleVideoExpand={toggleVideoExpand}
          isPracticeTab={isPracticeTab}
        />
      )}
    </View>
  );
};

export default ExerciseDetail;
