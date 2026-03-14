import { useEffect, useState } from 'react';
import { BookingTab } from '../../constants/bookingTab';
import { BookingStatus, CoachBookingType } from '../../utils/CoachBookingType';
import { coachBookingService } from '../../hooks/coachBooking.service';
import { LiveSessionType } from '../../utils/LiveSessionType';
import { LiveSessionService } from '../../hooks/liveSession.service';

type DataByTab = {
  [K in BookingTab]: CoachBookingType[];
};

const statusMap: Record<BookingTab, BookingStatus[]> = {
  [BookingTab.Scheduled]: ['SCHEDULED'],
  [BookingTab.Ready]: ['READY', 'IN_PROGRESS'],
  [BookingTab.History]: [
    'COMPLETED',
    'CANCELLED_BY_COACH',
    'CANCELLED_BY_TRAINEE',
    'NO_SHOW_BY_COACH',
    'NO_SHOW_BY_TRAINEE',
    'REFUNDED',
  ],
};

export const useTraineeBooking = () => {
  // STATE
  const [activeTab, setActiveTab] = useState<BookingTab>(BookingTab.Scheduled);
  const [dataByTab, setDataByTab] = useState<DataByTab>({
    [BookingTab.Scheduled]: [],
    [BookingTab.Ready]: [],
    [BookingTab.History]: [],
  });
  const [liveSessionDetail, setLiveSessionDetail] =
    useState<LiveSessionType | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showDetailModal, setShowDetailModal] = useState<boolean>(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState<boolean>(false);

  // API
  const fetchData = async () => {
    setIsLoading(true);

    try {
      const res = await coachBookingService.getAllBookingOfTrainee();

      const filterData: DataByTab = {
        [BookingTab.Scheduled]: filterBookings(res, BookingTab.Scheduled),
        [BookingTab.Ready]: filterBookings(res, BookingTab.Ready),
        [BookingTab.History]: filterBookings(res, BookingTab.History),
      };

      setDataByTab(filterData);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLiveSessionDetail = async (bookingId: string) => {
    setIsLoading(true);
    try {
      const res = await LiveSessionService.getByBookingId(bookingId);

      setLiveSessionDetail(res);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // HANDLERS
  const filterBookings = (
    data: CoachBookingType[],
    tab: BookingTab,
  ): CoachBookingType[] => {
    return data.filter(item => statusMap[tab].includes(item.status));
  };

  const openDetailModal = async (bookingId: string) => {
    await fetchLiveSessionDetail(bookingId);
    setShowDetailModal(true);
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setLiveSessionDetail(null);
  };

  const openFeedbackModal = async (bookingId: string) => {
    await fetchLiveSessionDetail(bookingId);
    setShowFeedbackModal(true);
  };

  const closeFeedbackModal = () => {
    setShowFeedbackModal(false);
    setLiveSessionDetail(null);
  };

  // EFFECT
  useEffect(() => {
    fetchData();
  }, []);

  // RETURN
  return {
    activeTab,
    onChangeTab: setActiveTab,
    isLoading,
    errorMsg,
    dataByTab,
    openDetailModal,
    openFeedbackModal,
    closeDetailModal,
    closeFeedbackModal,
    showDetailModal,
    showFeedbackModal,
    liveSessionDetail,
  };
};
