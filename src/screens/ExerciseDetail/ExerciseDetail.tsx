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
    onChangeTab,
    isVideoVisible,
    isPlaying,
    togglePlayButton,
    isPracticeTab,
    isShowFlag,
    toggleVideoExpand,
    isVideoExpand,
    setIsShowFlag,
    onPressAIPractice,
    canPractice,
    isLoading,
    onPressPractice,
    handleVideoEnd,
    closeSuccessModal,
    showSuccessModal,
    successMsg,
    activePackage,
    currentTutorial,
    closeConfirmModal,
    confirmMsg,
    onConfirmModal,
    showConfirmModal,
    onPressBack,
    currentExercise,
    workoutHistory,
    canPlayTheory,
    exerciseEquipments,
  } = useExerciseDetail({
    route,
    navigation,
  });

  return (
    <View className="w-full flex-1 relative bg-background">
      {isLoading && <LoadingOverlay />}

      {!exerciseDetail || !currentTutorial || !currentExercise ? (
        <></>
      ) : (
        <>
          {/* Header */}
          <Header
            activeTab={activeTab}
            isVideoExpand={isVideoExpand}
            isVideoPlay={isPlaying}
            isShowFlag={isShowFlag}
            navigation={navigation}
            exerciseId={currentExercise.exerciseId}
            onPressBack={onPressBack}
            exerciseEquipments={exerciseEquipments}
          />

          {/* Image / Video */}
          {isVideoVisible ? (
            <VideoPlayer
              source={
                isPracticeTab
                  ? currentTutorial?.practiceVideoUrl
                  : currentTutorial?.theoryVideoUrl
              }
              isVideoPlay={isPlaying}
              isVideoExpand={isVideoExpand}
              toggleVideoExpand={toggleVideoExpand}
              isPracticeTab={isPracticeTab}
              setIsShowFlag={setIsShowFlag}
              onVideoEnd={handleVideoEnd}
            />
          ) : (
            <ImageExercise imgUrl={currentExercise?.imageUrl} />
          )}

          {/* Overview / Stats */}
          {isVideoExpand ? (
            <StatsSection
              isPracticeTab={isPracticeTab}
              exerciseName={currentExercise.name}
              isVideoPlay={isPlaying}
              togglePlayButton={togglePlayButton}
              exerciseDuration={currentExercise.duration}
            />
          ) : (
            <OverviewSection
              activeTab={activeTab}
              exerciseDetail={currentExercise}
              onChangeTab={onChangeTab}
              isVideoPlay={isPlaying}
              togglePlayButton={togglePlayButton}
              isPracticeTab={isPracticeTab}
              onPressAIPractice={onPressAIPractice}
              canPractice={canPractice}
              onPressPractice={onPressPractice}
              activePackage={activePackage}
              workoutHistory={workoutHistory}
              canPlayTheory={canPlayTheory}
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

          {/* Confirm Modal */}
          <ModalPopup
            visible={showConfirmModal}
            mode="confirm"
            contentText={confirmMsg}
            iconName="alert"
            iconSize={35}
            iconBgColor="yellow"
            confirmBtnText="Xác nhận"
            confirmBtnColor="green"
            cancelBtnText="Đóng"
            cancelBtnColor="grey"
            onConfirm={onConfirmModal}
            onClose={closeConfirmModal}
            modalWidth={355}
          />
        </>
      )}
    </View>
  );
};

export default ExerciseDetail;
