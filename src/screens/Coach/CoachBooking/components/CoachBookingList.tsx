import { FlatList, View } from 'react-native';
import { useCallback, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { CoachBookingType } from '../../../../utils/CoachBookingType';
import { LiveSessionReportType } from '../../../../utils/LiveSessionReportType';
import CoachBookingCard from './CoachBookingCard';
import EmptyData from './EmptyData';

type Props = {
  isLoading: boolean;
  data: CoachBookingType[];
  reportMap: Record<string, LiveSessionReportType>;
  openDetailModal: (bookingId: string) => void;
  openFeedbackModal: (bookingId: string) => void;
  openVideoRecord: (bookingId: string) => void;
  onPressViewReport: (report: LiveSessionReportType) => void;
};

const CoachBookingList = ({
  isLoading,
  data,
  reportMap,
  openDetailModal,
  openFeedbackModal,
  openVideoRecord,
  onPressViewReport,
}: Props) => {
  const listRef = useRef<FlatList>(null);

  useFocusEffect(
    useCallback(() => {
      listRef.current?.scrollToOffset({ offset: 0, animated: false });
    }, []),
  );

  const renderItem = ({ item }: { item: CoachBookingType }) => {
    // liveSessionId === coachBookingId theo yêu cầu
    const existingReport = reportMap[item.id] ?? null;

    return (
      <CoachBookingCard
        item={item}
        existingReport={existingReport}
        onPressCard={() => openDetailModal(item.id)}
        onPressRecord={() => openVideoRecord(item.id)}
        onPressFeedback={() => openFeedbackModal(item.id)}
        onPressViewReport={() => existingReport && onPressViewReport(existingReport)}
      />
    );
  };

  return (
    <View className="w-full flex-1 gap-2">
      <FlatList
        ref={listRef}
        data={data}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 8, paddingBottom: 20 }}
        ListEmptyComponent={isLoading ? null : <EmptyData />}
      />
    </View>
  );
};

export default CoachBookingList;