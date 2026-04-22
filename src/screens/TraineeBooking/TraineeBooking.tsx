import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { View } from 'react-native';
import { RootStackParamList } from '../../navigation/AppNavigator';
import Header from './components/Header';
import Tabs from './components/Tabs';
import { useTraineeBooking } from './useTraineeBooking';
import List from './components/List';
import LoadingOverlay from '../../components/LoadingOverlay';
import DetailModal from './components/DetailModal';
import FeedbackModal from './components/FeedbackModal';
import VideoPlayer from './components/VideoPlayer/VideoPlayer';
import ModalPopup from '../../components/ModalPopup';
import ReportList from './ReportList/ReportList';

type Props = NativeStackScreenProps<RootStackParamList, 'TraineeBooking'>;

const TraineeBooking = (props: Props) => {
  // HOOK
  const {
    activeTab,
    onChangeTab,
    dataByTab,
    isLoading,
    closeDetailModal,
    closeFeedbackModal,
    openDetailModal,
    openFeedbackModal,
    showDetailModal,
    showFeedbackModal,
    liveSessionDetail,
    showRecord,
    openVideoRecord,
    closeVideoRecord,
    errorMsg,
    showErrorModal,
    closeErrorModal,
    recordUrl,
    closeReportList,
    openReportList,
    showReportList,
    assessment,
  } = useTraineeBooking();

  return (
    <>
      {isLoading && <LoadingOverlay />}

      <View className="flex-1 pt-14 bg-background">
        {/* Header */}
        <Header navigation={props.navigation} openReportList={openReportList} />

        {/* Tabs */}
        <Tabs tabId={activeTab} onChange={onChangeTab} />

        {/* List */}
        <List
          isLoading={isLoading}
          data={dataByTab[activeTab]}
          navigation={props.navigation}
          openDetailModal={openDetailModal}
          openFeedbackModal={openFeedbackModal}
          openVideoRecord={openVideoRecord}
          onPressReport={bookingId =>
            props.navigation.navigate('TraineeReport', {
              liveSessionId: bookingId,
            })
          }
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
        <FeedbackModal
          visible={showFeedbackModal}
          onClose={closeFeedbackModal}
          assessment={assessment}
        />

        {/* Report List Modal */}
        <ReportList visible={showReportList} onClose={closeReportList} />

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

export default TraineeBooking;
