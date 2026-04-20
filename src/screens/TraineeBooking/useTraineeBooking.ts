import { useEffect, useState } from 'react';
import { BookingTab } from '../../constants/bookingTab';
import { BookingStatus, CoachBookingType } from '../../utils/CoachBookingType';
import { coachBookingService } from '../../hooks/coachBooking.service';
import { LiveSessionType } from '../../utils/LiveSessionType';
import LiveSessionService from '../../hooks/liveSession.service';

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
  const [showErrorModal, setShowErrorModal] = useState<boolean>(false);
  const [showDetailModal, setShowDetailModal] = useState<boolean>(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState<boolean>(false);
  const [showRecord, setShowRecord] = useState<boolean>(false);
  const [recordUrl, setRecordUrl] = useState<string | null>(null);
  const [showReportList, setShowReportList] = useState<boolean>(false);

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

      if (filterData[BookingTab.Ready].length > 0) {
        setActiveTab(BookingTab.Ready);
      } else {
        setActiveTab(BookingTab.Scheduled);
      }
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

  const getRecordUrl = async (bookingId: string) => {
    setIsLoading(true);
    try {
      const res = await LiveSessionService.getRecordUrl(bookingId);
      console.log('video url', res);
      setRecordUrl(res);
      return true;
    } catch (err: any) {
      if (err?.type === 'BUSINESS_ERROR') {
        openErrorModal(err.message);
      } else {
        openErrorModal('Hiện chưa có video record!');
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // HANDLERS
  const filterBookings = (
    data: CoachBookingType[],
    tab: BookingTab,
  ): CoachBookingType[] => {
    return data
      .filter(item => statusMap[tab].includes(item.status))
      .sort(
        (a, b) =>
          new Date(b.startTime).getTime() - new Date(a.startTime).getTime(),
      );
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

  const openVideoRecord = async (bookingId: string) => {
    const success = await getRecordUrl(bookingId);

    if (!success) return;

    setShowRecord(true);
  };

  const closeVideoRecord = () => {
    setShowRecord(false);
    setRecordUrl(null);
  };

  const openReportList = () => {
    setShowReportList(true);
  };

  const closeReportList = () => {
    setShowReportList(false);
  };

  const openErrorModal = (msg: string) => {
    setErrorMsg(msg);
    setShowErrorModal(true);
  };

  const closeErrorModal = () => {
    setErrorMsg('');
    setShowErrorModal(false);
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
    showRecord,
    openVideoRecord,
    closeVideoRecord,
    showErrorModal,
    closeErrorModal,
    recordUrl,
    showReportList,
    openReportList,
    closeReportList,
  };
};
