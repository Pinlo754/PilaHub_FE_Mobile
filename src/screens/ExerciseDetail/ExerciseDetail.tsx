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
import CountdownModal from './components/CountdownModal';

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
    fetchAISummary,
    closeRecommendModal,
    onConfirmRecommendModal,
    recommendMsg,
    showRecommendModal,
    hasAccess,
    isFromList,
    isFromSearch,
    showStartCountdown,
    onStartCountdownFinished,
    showRestCountdown,
    restCountdownDuration,
    onRestCountdownFinished,
    exerciseTimeLeft,
    isExerciseRunning,
    COUNTDOWN_START,
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
              exerciseTimeLeft={exerciseTimeLeft}
              isExerciseRunning={isExerciseRunning}
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
              fetchAISummary={fetchAISummary}
              hasAccess={hasAccess}
              isFromList={isFromList}
              isFromSearch={isFromSearch}
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

          {/* Recommend Modal */}
          <ModalPopup
            visible={showRecommendModal}
            mode="confirm"
            contentText={recommendMsg}
            iconName="alert"
            iconSize={35}
            iconBgColor="yellow"
            confirmBtnText="Chuyển trang"
            confirmBtnColor="green"
            cancelBtnText="Đóng"
            cancelBtnColor="grey"
            onConfirm={onConfirmRecommendModal}
            onClose={closeRecommendModal}
            modalWidth={355}
            btnWidth={110}
          />

          {/* Countdown bắt đầu bài tập (5s, chỉ xuất hiện 1 lần đầu) */}
          <CountdownModal
            visible={showStartCountdown}
            duration={COUNTDOWN_START}
            onFinish={onStartCountdownFinished}
          />

          {/* Countdown nghỉ giữa các bài (chỉ trong course flow) */}
          <CountdownModal
            visible={showRestCountdown}
            duration={restCountdownDuration}
            onFinish={onRestCountdownFinished}
          />
        </>
      )}
    </View>
  );
};

export default ExerciseDetail;
