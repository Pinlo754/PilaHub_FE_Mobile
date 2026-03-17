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
import LoadingOverlay from '../../components/LoadingOverlay';
import ModalPopup from '../../components/ModalPopup';

type Props = NativeStackScreenProps<RootStackParamList, 'ExerciseDetail'>;

const ExerciseDetail: React.FC<Props> = ({ route, navigation }) => {
  // HOOK
  const {
    activeTab,
    exerciseDetail,
    tutorial,
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
    onPressAIPractice,
    canPractice,
    isLoading,
    onPressPractice,
    currentExerciseIndex,
    handleVideoEnd,
    closeSuccessModal,
    showSuccessModal,
    successMsg,
  } = useExerciseDetail({
    route,
    navigation,
  });

  // LOADING
  if (!exerciseDetail || !tutorial) return null;

  return (
    <View className="w-full flex-1 relative">
      {isLoading && <LoadingOverlay />}

      {/* Header */}
      <Header
        activeTab={activeTab}
        isVideoExpand={isVideoExpand}
        isVideoPlay={isPlaying}
        isShowFlag={isShowFlag}
        navigation={navigation}
        navigatePracticeTab={navigatePracticeTab}
        exerciseId={exerciseDetail.exerciseId}
      />

      {/* Image / Video */}
      {isVideoVisible ? (
        <VideoPlayer
          source={
            isPracticeTab
              ? tutorial?.practiceVideoUrl
              : tutorial?.theoryVideoUrl
          }
          isVideoPlay={isPlaying}
          isVideoExpand={isVideoExpand}
          toggleVideoExpand={toggleVideoExpand}
          isPracticeTab={isPracticeTab}
          setIsShowFlag={setIsShowFlag}
          currentExerciseIndex={currentExerciseIndex}
          onVideoEnd={handleVideoEnd}
        />
      ) : (
        <ImageExercise imgUrl={exerciseDetail?.imageUrl} />
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
          isPracticeTab={isPracticeTab}
          onPressAIPractice={onPressAIPractice}
          canPractice={canPractice}
          onPressPractice={onPressPractice}
        />
      )}

      {/* Success Modal */}
      <ModalPopup
        visible={showSuccessModal}
        mode="toast"
        contentText={successMsg}
        iconName="checkmark"
        iconSize={35}
        iconBgColor="green"
        onClose={closeSuccessModal}
        modalWidth={355}
      />
    </View>
  );
};

export default ExerciseDetail;
