import { useCallback, useEffect, useMemo, useState } from 'react';
import { CoachType } from '../../utils/CoachType';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { RouteProp } from '@react-navigation/native';
import { CoachService } from '../../hooks/coach.service';
import { coachTimeOffService } from '../../hooks/coachTimeOff.service';
import {
  DaySchedule,
  generateCoachSchedule,
} from '../../utils/availableSchedule';
import { buildISOTime, getWeekTimeRange } from '../../utils/day';
import { BookingSlot } from '../../utils/CoachBookingType';
import { coachBookingService } from '../../hooks/coachBooking.service';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { calculateBookingSummary } from '../../utils/calculate';

type Props = {
  route: RouteProp<RootStackParamList, 'RegisterCalendar'>;
  navigation: NativeStackNavigationProp<RootStackParamList, 'RegisterCalendar'>;
};

export const useRegisterCalendar = ({ route, navigation }: Props) => {
  // PARAM
  const paramCoachId = route.params?.coach_id ?? null;
  const paramPricePerHour = route.params?.pricePerHour ?? null;

  // CONSTANT
  const TIMEOUT = 3010;

  // STATE
  const today = new Date();
  const [coaches, setCoaches] = useState<CoachType[]>([]);
  const [selectedCoachId, setSelectedCoachId] = useState<string | null>(
    paramCoachId,
  );
  const [coachDetail, setCoachDetail] = useState<CoachType>();
  const [selectedPurpose, setSelectedPurpose] = useState<string | null>(null);
  const [schedule, setSchedule] = useState<DaySchedule[]>([]);
  const [weekStart, setWeekStart] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(today);
  const [startTime, setStartTime] = useState<string | null>(null);
  const [endTime, setEndTime] = useState<string | null>(null);
  const [bookingSlots, setBookingSlots] = useState<BookingSlot[]>([]);

  // MODAL + LOADING
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showNotiModal, setShowNotiModal] = useState<boolean>(false);
  const [notiMsg, setNotiMsg] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showErrorModal, setShowErrorModal] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
  const [confirmMsg, setConfirmMsg] = useState<string>('');
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);

  // VARIABLE
  const selectedCoachDetail = coaches.find(c => c.coachId === selectedCoachId);
  const pricePerHour =
    paramPricePerHour ?? selectedCoachDetail?.pricePerHour ?? null;

  // CALC
  const { totalHours, totalPrice } = useMemo(() => {
    if (!pricePerHour) return { totalHours: 0, totalPrice: 0 };

    return calculateBookingSummary(bookingSlots, pricePerHour);
  }, [bookingSlots, pricePerHour]);

  // PAYLOAD
  const buildSinglePayload = (coachId: string) => {
    if (bookingSlots.length === 0) return null;

    const slot = bookingSlots[0];

    return {
      coachId,
      startTime: buildISOTime(slot.date, slot.startTime),
      endTime: buildISOTime(slot.date, slot.endTime),
      bookingType: 'SINGLE' as const,
    };
  };

  const buildPackagePayload = (coachId: string) => {
    return {
      coachId,
      bookingSlots: bookingSlots.map(slot => ({
        startTime: buildISOTime(slot.date, slot.startTime),
        endTime: buildISOTime(slot.date, slot.endTime),
      })),
      bookingType: 'PERSONAL_TRAINING_PACKAGE' as const,
    };
  };

  // API
  const fetchAll = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await CoachService.getAll();

      setCoaches(res);
    } catch (err: any) {
      if (err?.type === 'BUSINESS_ERROR') {
        setErrorMsg(err.message);
      } else {
        setErrorMsg('Có lỗi xảy ra. Vui lòng thử lại.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCoachById = async (coachId: string, start: Date) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const { startTime, endTime } = getWeekTimeRange(start);

      const [resCoach, resSchedule] = await Promise.all([
        CoachService.getById(coachId),
        coachTimeOffService.getByTimeRange(coachId, startTime, endTime),
      ]);

      setCoachDetail(resCoach);

      const schedules = generateCoachSchedule(resSchedule, start, 7);

      setSchedule(schedules);
    } catch (err: any) {
      if (err?.type === 'BUSINESS_ERROR') {
        setErrorMsg(err.message);
      } else {
        setErrorMsg('Có lỗi xảy ra. Vui lòng thử lại.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const createSingleBooking = async () => {
    if (!selectedCoachId) {
      openErrorModal('Vui lòng chọn huấn luyện viên');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    try {
      const payload = buildSinglePayload(selectedCoachId);

      if (!payload) {
        openErrorModal('Vui lòng chọn thời gian');
        return;
      }

      const res = await coachBookingService.createSingleBooking(payload);

      if (res) {
        openSuccessModal('Đã đăng ký lịch thành công!');

        setTimeout(() => {
          navigation.navigate('MainTabs', { screen: 'Home' });
        }, TIMEOUT);
      }
    } catch (err: any) {
      if (err?.type === 'BUSINESS_ERROR') {
        openErrorModal(err.message);
      } else {
        openErrorModal('Có lỗi xảy ra. Vui lòng thử lại.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // HANDLERS
  const onPressCoach = useCallback((id: string) => {
    setSelectedCoachId(id);
  }, []);

  const changeWeek = (date: Date) => {
    setWeekStart(date);
  };

  const onSelectDate = (date: Date) => {
    setSelectedDate(date);
    setStartTime(null);
    setEndTime(null);
  };

  const onSelectStartTime = (time: string) => {
    setStartTime(time);
    setEndTime(null);
  };

  const onSelectEndTime = (time: string) => {
    setEndTime(time);
  };

  const onPressConfirmSlot = () => {
    if (!selectedDate || !startTime || !endTime) return;

    // setBookingSlots(prev => {
    //   const exists = prev.some(
    //     s =>
    //       s.date.getTime() === selectedDate.getTime() &&
    //       s.startTime === startTime &&
    //       s.endTime === endTime,
    //   );

    //   if (exists) return prev;

    //   return [...prev, { date: selectedDate, startTime, endTime }];
    // });
    // clearTime();

    setBookingSlots([{ date: selectedDate, startTime, endTime }]);
  };

  const onPressRegister = () => {
    openConfirmModal('Bạn có muốn xác nhận đặt lịch không?');
  };

  // HANDLERS MODAL
  const openNotiModal = (msg: string) => {
    setNotiMsg(msg);
    setShowNotiModal(true);
  };

  const closeNotiModal = () => {
    setNotiMsg('');
    setShowNotiModal(false);
  };

  const openSuccessModal = (msg: string) => {
    setSuccessMsg(msg);
    setShowSuccessModal(true);
  };

  const closeSuccessModal = () => {
    setSuccessMsg('');
    setShowSuccessModal(false);
  };

  const openErrorModal = (msg: string) => {
    setErrorMsg(msg);
    setShowErrorModal(true);
  };

  const closeErrorModal = () => {
    setErrorMsg('');
    setShowErrorModal(false);
  };

  const openConfirmModal = (msg: string) => {
    setConfirmMsg(msg);
    setShowConfirmModal(true);
  };

  const closeConfirmModal = () => {
    setConfirmMsg('');
    setShowConfirmModal(false);
  };

  const onConfirmModal = () => {
    closeConfirmModal();
    createSingleBooking();
  };

  // CLEAR
  const clearCoachId = () => {
    setSelectedCoachId(null);
  };

  const clearBooking = () => {
    setSelectedPurpose(null);
    setSelectedDate(today);
    setWeekStart(today);
    setStartTime(null);
    setEndTime(null);
    setBookingSlots([]);
  };

  const clearTime = () => {
    setStartTime(null);
    setEndTime(null);
  };

  // CHECK
  const isValid = bookingSlots.length > 0;

  // USE EFFECT
  useEffect(() => {
    fetchAll();
  }, []);

  useEffect(() => {
    if (paramCoachId) {
      setSelectedCoachId(paramCoachId);
    }
  }, [paramCoachId]);

  useEffect(() => {
    if (!selectedCoachId) return;

    fetchCoachById(selectedCoachId, weekStart);
  }, [selectedCoachId, weekStart]);

  // RETURN
  return {
    coaches,
    selectedCoachId,
    selectedPurpose,
    onPressPurpose: setSelectedPurpose,
    onPressCoach,
    clearCoachId,
    showNotiModal,
    notiMsg,
    onPressRegister,
    closeNotiModal,
    isValid,
    isLoading,
    errorMsg,
    schedule,
    changeWeek,
    startTime,
    endTime,
    onSelectDate,
    onSelectStartTime,
    onSelectEndTime,
    selectedDate,
    setSelectedDate,
    clearBooking,
    onPressConfirmSlot,
    bookingSlots,
    showErrorModal,
    closeErrorModal,
    showSuccessModal,
    successMsg,
    closeSuccessModal,
    totalPrice,
    totalHours,
    pricePerHour,
    confirmMsg,
    showConfirmModal,
    closeConfirmModal,
    onConfirmModal,
    weekStart,
    openNotiModal,
    coachDetail,
  };
};
