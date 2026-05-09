import { useEffect, useState } from 'react';
import { BookingStatus, CoachBookingType } from '../../../utils/CoachBookingType';
import { LiveSessionReportType } from '../../../utils/LiveSessionReportType';
import { CoachFeedbackType } from '../../../utils/CoachFeedbackType';
import { coachBookingService } from '../../../hooks/coachBooking.service';
import { liveSessionReportService } from '../../../hooks/liveSessionReport.service';
import { coachFeedbackService } from '../../../hooks/coachFeedback.service';
import { LiveSessionType } from '../../../utils/LiveSessionType';
import LiveSessionService from '../../../hooks/liveSession.service';

const HISTORY_STATUSES: BookingStatus[] = [
  'COMPLETED',
  'CANCELLED_BY_COACH',
  'CANCELLED_BY_TRAINEE',
  'NO_SHOW_BY_COACH',
  'NO_SHOW_BY_TRAINEE',
  'REFUNDED',
];

export const useCoachBooking = () => {
  // STATE
  const [data, setData] = useState<CoachBookingType[]>([]);
  const [reportMap, setReportMap] = useState<Record<string, LiveSessionReportType>>({});
  const [liveSessionDetail, setLiveSessionDetail] = useState<LiveSessionType | null>(null);
 const [coachFeedback, setCoachFeedback] = useState<CoachFeedbackType | null>(null);
  const [recordUrl, setRecordUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [showDetailModal, setShowDetailModal] = useState<boolean>(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState<boolean>(false);
  const [showRecord, setShowRecord] = useState<boolean>(false);
  const [showErrorModal, setShowErrorModal] = useState<boolean>(false);
  const [showReportDetail, setShowReportDetail] = useState<boolean>(false);
  const [selectedReport, setSelectedReport] = useState<LiveSessionReportType | null>(null);

  // API
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [bookings, reports] = await Promise.all([
        coachBookingService.getAllBookingOfCoach(),
        liveSessionReportService.getAllReceived(),
      ]);

      const map: Record<string, LiveSessionReportType> = {};
      reports.forEach(r => {
        map[r.liveSessionId] = r;
      });
      setReportMap(map);

      const filtered = bookings
        .filter(item => HISTORY_STATUSES.includes(item.status))
        .sort(
          (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime(),
        );

      setData(filtered);
    } catch (err: any) {
      openErrorModal(err.message || 'Đã xảy ra lỗi!');
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
      openErrorModal(err.message || 'Không thể tải chi tiết buổi học!');
    } finally {
      setIsLoading(false);
    }
  };

  // CoachBookingId === LiveSessionId
  const fetchCoachFeedback = async (bookingId: string) => {
    if (!bookingId) return;
    setIsLoading(true);
    try {
      const res = await coachFeedbackService.getByLiveSessionId(bookingId);
      setCoachFeedbacks(res);
    } catch (err: any) {
      if (err?.type === 'BUSINESS_ERROR') {
        openErrorModal(err.message);
      } else {
        openErrorModal('Chưa có đánh giá từ học viên!');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getRecordUrl = async (bookingId: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const res = await LiveSessionService.getRecordUrl(bookingId);
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
  const openDetailModal = async (bookingId: string) => {
    await fetchLiveSessionDetail(bookingId);
    setShowDetailModal(true);
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setLiveSessionDetail(null);
  };

  const openFeedbackModal = async (bookingId: string) => {
    setCoachFeedbacks([]);
    await fetchCoachFeedback(bookingId);
    setShowFeedbackModal(true);
  };

  const closeFeedbackModal = () => {
    setShowFeedbackModal(false);
    setCoachFeedbacks([]);
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

  const openReportDetail = (report: LiveSessionReportType) => {
    setSelectedReport(report);
    setShowReportDetail(true);
  };

  const closeReportDetail = () => {
    setSelectedReport(null);
    setShowReportDetail(false);
  };

  const openErrorModal = (msg: string) => {
    setErrorMsg(msg);
    setShowErrorModal(true);
  };

  const closeErrorModal = () => {
    setErrorMsg('');
    setShowErrorModal(false);
  };

  const handleRefresh = async () => {
    await fetchData();
  };

  // EFFECT
  useEffect(() => {
    fetchData();
  }, []);

  return {
    data,
    reportMap,
    isLoading,
    errorMsg,
    liveSessionDetail,
    coachFeedbacks,
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
  };
};