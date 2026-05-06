import React from 'react';
import { Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import ImageProgram from './components/ImageProgram';
import { useProgramDetail } from './useProgramDetail';
import ProgressConsume from './components/ProgressConsume';
import ProgramInformation from './components/ProgramInformation';
import ProgrameContent from './components/ProgrameContent';
import Header from './components/Header';
import LoadingOverlay from '../../components/LoadingOverlay';
import Button from '../../components/Button';
import ModalPopup from '../../components/ModalPopup';
import ScheduleModal from './components/ScheduleModal';
import ResetScheduleModal from './components/ResetScheduleModal';
import StatsSection from './components/StatsSection';
import CountdownModal from './components/CountdownModal';
import VideoPlayer from './components/VideoPlayer/VideoPlayer';

type Props = NativeStackScreenProps<RootStackParamList, 'ProgramDetail'>;

const ProgramDetail: React.FC<Props> = ({ route, navigation }) => {
  const {
    // Program
    programDetail,
    lessons,
    isLoading,
    isEnrolled,
    progressOfCourse,
    completedLessonIds,
    activePackage,
    source,
    isFromList,
    isFromSearch,
    isValid,
    isInsufficientBalance,
    walletError,
    traineeCourseId,
    getProgressOfCourseLessonRaw,
    onPress,
    onPressBack,
    // Schedule
    showSchedule,
    closeSchedule,
    handleSelectDay,
    selectedDays,
    onPressRegister,
    showResetSchedule,
    closeResetSchedule,
    openResetSchedule,
    handleSelectResetDay,
    resetSelectedDays,
    onPressConfirmReset,
    // Modals: Program
    errorMsg,
    showErrorModal,
    closeErrorModal,
    successMsg,
    showSuccessModal,
    closeSuccessModal,
    confirmMsg,
    showConfirmModal,
    closeConfirmModal,
    onConfirmModal,
    recommendMsg,
    showRecommendModal,
    closeRecommendModal,
    onConfirmRecommendModal,
    // Practice
    isPracticing,
    isPlaying,
    currentExercise,
    currentTutorial,
    onStartLesson,
    togglePlayButton,
    aiAllowed,
    onStartAILesson,
    // Countdown
    showStartCountdown,
    onStartCountdownFinished,
    showRestCountdown,
    restCountdownDuration,
    onRestCountdownFinished,
    COUNTDOWN_START,
    // Timer
    exerciseTimeLeft,
    isExerciseRunning,
    // Modals: Practice
    practiceSuccessMsg,
    showPracticeSuccessModal,
    closePracticeSuccessModal,
    practiceConfirmMsg,
    showPracticeConfirmModal,
    closePracticeConfirmModal,
    onPracticeConfirmModal,
  } = useProgramDetail({
    route,
    navigation,
  });

  if (isLoading || !programDetail) {
    return (
      <View className="flex-1 bg-background">
        <LoadingOverlay />
      </View>
    );
  }

  return (
    <View className="w-full flex-1 bg-background">
      {/* Header */}
      <Header
        navigation={navigation}
        onPressBack={onPressBack}
        showResetButton={!!isFromList && !isPracticing}
        onPressReset={openResetSchedule}
      />

      {/* ── PRACTICE MODE ── */}
      {isPracticing && currentExercise && currentTutorial ? (
        <>
          {/* Video luôn expand */}
          <VideoPlayer
            source={currentTutorial.practiceVideoUrl}
            isVideoPlay={isPlaying}
            isVideoExpand={true}
            toggleVideoExpand={() => {}}
            isPracticeTab={true}
            setIsShowFlag={() => {}}
            onVideoEnd={() => {}}
          />

          {/* Stats */}
          <StatsSection
            isPracticeTab={true}
            exerciseName={currentExercise.name}
            isVideoPlay={isPlaying}
            togglePlayButton={togglePlayButton}
            exerciseDuration={currentExercise.duration}
            exerciseTimeLeft={exerciseTimeLeft}
            isExerciseRunning={isExerciseRunning}
          />
        </>
      ) : (
        /* ── NORMAL MODE ── */
        <>
          <ImageProgram
            imgUrl={programDetail.imageUrl}
            programName={programDetail.name}
          />
          <ProgressConsume
            traineeCourseId={traineeCourseId}
            progress={progressOfCourse}
            number_of_programs={programDetail.totalLesson}
            price={programDetail.price}
          />
          <ProgramInformation
            goal={programDetail.description}
            level={programDetail.level}
          />
          <ProgrameContent
            data={lessons}
            navigation={navigation}
            isEnrolled={isEnrolled}
            getProgressOfCourseLesson={getProgressOfCourseLessonRaw}
            traineeCourseId={traineeCourseId}
            completedLessonIds={completedLessonIds}
            activePackage={activePackage}
            source={source}
            programId={programDetail.courseId}
            onStartLesson={onStartLesson}
            aiAllowed={aiAllowed}
            onStartAILesson={onStartAILesson}
            isFromList={isFromList}
            isFromSearch={isFromSearch}
          />

          {!isEnrolled ? (
            <View className="pt-2 mx-4 pb-6">
              {isInsufficientBalance && !walletError && (
                <Text className="text-danger-darker text-center mb-2">
                  Số dư ví không đủ để đăng ký khóa học. Vui lòng nạp thêm.
                </Text>
              )}

              {walletError && (
                <Text className="text-danger-darker font-medium text-center mb-2">
                  Bạn chưa mở ví để thanh toán!
                </Text>
              )}
              <Button
                text="Đăng ký khóa học"
                onPress={onPress}
                colorType={!isValid ? 'grey' : 'sub1'}
                rounded="full"
                iconName="log-in-outline"
                iconSize={26}
                disabled={!isValid}
              />
            </View>
          ) : (
            !traineeCourseId && (
              <View className="pt-2 mx-4 pb-6">
                <Button
                  text="Khóa học đã được đăng ký"
                  onPress={() => {}}
                  colorType="green"
                  rounded="full"
                />
              </View>
            )
          )}

          {/* Schedule Modal */}
          <ScheduleModal
            visible={showSchedule}
            onClose={closeSchedule}
            handleSelectDay={handleSelectDay}
            selectedDays={selectedDays}
            onPressRegister={onPressRegister}
          />

          {/* Reset Schedule Modal */}
          <ResetScheduleModal
            visible={showResetSchedule}
            onClose={closeResetSchedule}
            handleSelectDay={handleSelectResetDay}
            selectedDays={resetSelectedDays}
            onPressReset={onPressConfirmReset}
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

          {/* Error Modal */}
          <ModalPopup
            visible={showErrorModal}
            mode="noti"
            contentText={errorMsg || ''}
            iconName="alert"
            iconSize={35}
            iconBgColor="red"
            confirmBtnText="Đóng"
            confirmBtnColor="grey"
            onClose={closeErrorModal}
            modalWidth={355}
          />
        </>
      )}

      {/* ── COUNTDOWN: luôn render ở tầng ngoài, hiển thị overlay cả 2 mode ── */}
      <CountdownModal
        visible={showStartCountdown}
        duration={COUNTDOWN_START}
        onFinish={onStartCountdownFinished}
      />

      <CountdownModal
        visible={showRestCountdown}
        duration={restCountdownDuration}
        onFinish={onRestCountdownFinished}
      />

      {/* ── MODALS PRACTICE ── */}
      <ModalPopup
        visible={showPracticeSuccessModal}
        mode="toast"
        contentText={practiceSuccessMsg}
        iconName="checkmark"
        iconSize={35}
        iconBgColor="green"
        onClose={closePracticeSuccessModal}
        modalWidth={355}
      />

      <ModalPopup
        visible={showPracticeConfirmModal}
        mode="confirm"
        contentText={practiceConfirmMsg}
        iconName="alert"
        iconSize={35}
        iconBgColor="yellow"
        confirmBtnText="Thoát"
        confirmBtnColor="green"
        cancelBtnText="Tiếp tục tập"
        cancelBtnColor="grey"
        onConfirm={onPracticeConfirmModal}
        onClose={closePracticeConfirmModal}
        modalWidth={355}
        btnWidth={100}
      />
    </View>
  );
};

export default ProgramDetail;
