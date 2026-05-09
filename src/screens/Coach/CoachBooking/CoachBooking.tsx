import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { View } from 'react-native';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import { useCoachBooking } from './useCoachBooking';
import LoadingOverlay from '../../../components/LoadingOverlay';
import DetailModal from './components/DetailModal';
import ModalPopup from '../../../components/ModalPopup';
import ReportDetailModal from '../../TraineeBooking/components/ReportDetailModal';
import CoachBookingHeader from './components/CoachBookingHeader';
import CoachBookingList from './components/CoachBookingList';
import CoachFeedbackModal from './components/CoachFeedbackModal';
import VideoPlayer from './components/VideoPlayer/VideoPlayer';

type Props = NativeStackScreenProps<RootStackParamList, 'CoachBooking'>;

const CoachBooking = (props: Props) => {
  const {
    data,
    reportMap,
    isLoading,
    errorMsg,
    liveSessionDetail,
    coachFeedback,
    recordUrl,
    showDetailModal,
    showFeedbackModal,
    showRecord,
    showErrorModal,
    showReportDetail,
    selectedReport,
    openDetailModal,
    closeDetailModal,
    openFeedbackModal,
    closeFeedbackModal,
    openVideoRecord,
    closeVideoRecord,
    openReportDetail,
    closeReportDetail,
    closeErrorModal,
    handleRefresh,
  } = useCoachBooking();

  return (
    <>
      {isLoading && <LoadingOverlay />}

      <View className="flex-1 pt-14 bg-background">
        {/* Header */}
        <CoachBookingHeader
          navigation={props.navigation}
          handleRefresh={handleRefresh}
        />

        {/* List */}
        <CoachBookingList
          isLoading={isLoading}
          data={data}
          reportMap={reportMap}
          openDetailModal={openDetailModal}
          openFeedbackModal={openFeedbackModal}
          openVideoRecord={openVideoRecord}
          onPressViewReport={openReportDetail}
        />

        {/* Detail Modal */}
        {showDetailModal && liveSessionDetail && (
          <View className="absolute inset-0 bg-black/40">
            <DetailModal
              visible={showDetailModal}
              onClose={closeDetailModal}
              liveSessionDetail={liveSessionDetail}
            />
          </View>
        )}

        {/* Video Record */}
        {showRecord && recordUrl && (
          <View className="absolute inset-0 z-50 bg-black">
            <VideoPlayer source={recordUrl} onBack={closeVideoRecord} />
          </View>
        )}

        {/* Feedback Modal */}
        <CoachFeedbackModal
          visible={showFeedbackModal}
          onClose={closeFeedbackModal}
        feedback={coachFeedback}
        />

        {/* Report Detail Modal */}
        {selectedReport && (
          <>
            <View className="absolute inset-0 bg-black/40" />
            <ReportDetailModal
              visible={showReportDetail}
              onClose={closeReportDetail}
              report={selectedReport}
            />
          </>
        )}

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
    </>
  );
};

export default CoachBooking;