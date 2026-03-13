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
  } = useTraineeBooking();

  return (
    <>
      {isLoading && <LoadingOverlay />}

      <View className="flex-1 pt-14 bg-background">
        {/* Header */}
        <Header navigation={props.navigation} />

        {/* Tabs */}
        <Tabs tabId={activeTab} onChange={onChangeTab} />

        {/* List */}
        <List
          isLoading={isLoading}
          data={dataByTab[activeTab]}
          navigation={props.navigation}
          openDetailModal={openDetailModal}
          openFeedbackModal={openFeedbackModal}
        />

        {/* Detail Modal */}
        {showDetailModal && (
          <View className="absolute inset-0 bg-black/40">
            <DetailModal visible={showDetailModal} onClose={closeDetailModal} />
          </View>
        )}

        {/* Feedback Modal */}
        <FeedbackModal
          visible={showFeedbackModal}
          onClose={closeFeedbackModal}
          comment={
            liveSessionDetail?.commentByCoach || 'Chưa có đánh giá từ HLV!'
          }
        />
      </View>
    </>
  );
};

export default TraineeBooking;
