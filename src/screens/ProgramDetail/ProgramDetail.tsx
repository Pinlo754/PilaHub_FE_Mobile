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

type Props = NativeStackScreenProps<RootStackParamList, 'ProgramDetail'>;

const ProgramDetail: React.FC<Props> = ({ route, navigation }) => {
  const {
    programDetail,
    lessons,
    isLoading,
    isEnrolled,
    closeConfirmModal,
    closeErrorModal,
    closeSuccessModal,
    confirmMsg,
    errorMsg,
    successMsg,
    onConfirmModal,
    showConfirmModal,
    showErrorModal,
    showSuccessModal,
    onPress,
    showSchedule,
    closeSchedule,
    handleSelectDay,
    selectedDays,
    onPressRegister,
    getProgressOfCourseLesson,
    traineeCourseId,
    progressOfCourse,
    completedLessonIds,
    activePackage,
    source,
    onPressBack,
    showResetSchedule,
    closeResetSchedule,
    openResetSchedule,
    handleSelectResetDay,
    resetSelectedDays,
    onPressConfirmReset,
    isFromList,
    isInsufficientBalance,
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
        showResetButton={!!isFromList}
        onPressReset={openResetSchedule}
      />
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
        getProgressOfCourseLesson={getProgressOfCourseLesson}
        traineeCourseId={traineeCourseId}
        completedLessonIds={completedLessonIds}
        activePackage={activePackage}
        source={source}
        programId={programDetail.courseId}
      />

      {!isEnrolled ? (
        <View className="pt-2 mx-4 pb-6">
          {isInsufficientBalance && (
            <Text className="text-danger-darker text-center mb-2">
              Số dư ví không đủ để đăng ký khóa học. Vui lòng nạp thêm.
            </Text>
          )}
          <Button
            text="Đăng ký khóa học"
            onPress={onPress}
            colorType={isInsufficientBalance ? 'grey' : 'sub1'}
            rounded="full"
            iconName="log-in-outline"
            iconSize={26}
            disabled={isInsufficientBalance}
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
    </View>
  );
};

export default ProgramDetail;
