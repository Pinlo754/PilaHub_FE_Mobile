import { useCallback, useEffect, useMemo, useState } from 'react';
import { CoachType } from '../../utils/CoachType';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { RouteProp } from '@react-navigation/native';
import { CoachService } from '../../hooks/coach.service';
import {
  DaySchedule,
  generateCoachScheduleFromBusy,
} from '../../utils/availableSchedule';
import { buildISOTime, getWeekTimeRange } from '../../utils/day';
import { BookingSlot, BusyTimeSlotReq } from '../../utils/CoachBookingType';
import { coachBookingService } from '../../hooks/coachBooking.service';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { calculateBookingSummary } from '../../utils/calculate';
import { WalletType } from '../../utils/WalletType';
import { WalletService } from '../../hooks/wallet.service';

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
  const [initialCoaches, setInitialCoaches] = useState<CoachType[]>([]);
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
  const [selectedSlot, setSelectedSlot] = useState<BookingSlot | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [wallet, setWallet] = useState<WalletType | null>(null);
  const [isInsufficientBalance, setIsInsufficientBalance] =
    useState<boolean>(false);
  const [walletError, setWalletError] = useState<boolean>(false);

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
    if (!pricePerHour || !selectedSlot) return { totalHours: 0, totalPrice: 0 };

    return calculateBookingSummary([selectedSlot], pricePerHour);
  }, [selectedSlot, pricePerHour]);

  // PAYLOAD
  const buildSinglePayload = (coachId: string) => {
    if (!selectedSlot) return null;

    return {
      coachId,
      startTime: buildISOTime(selectedSlot.date, selectedSlot.startTime),
      endTime: buildISOTime(selectedSlot.date, selectedSlot.endTime),
      bookingType: 'SINGLE' as const,
    };
  };

  // API
  const fetchAll = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await CoachService.getAll();

      setCoaches(res);
      setInitialCoaches(res);
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

      const payload: BusyTimeSlotReq = {
        coachId,
        startTime,
        endTime,
      };

      const [resCoach, resBusy] = await Promise.all([
        CoachService.getById(coachId),
        coachBookingService.getBusyTimeSlot(payload),
      ]);

      setCoachDetail(resCoach);

      const schedules = generateCoachScheduleFromBusy(resBusy, start, 7);

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

  const fetchWallet = async () => {
    try {
      const res = await WalletService.getMyWallet();
      setWallet(res);
      setWalletError(false);
      return res;
    } catch (err: any) {
      // console.error('Fetch wallet error:', err);
      setWalletError(true);
      return null;
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

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    const q = query.trim();

    if (!q) {
      setIsLoading(false);
      setCoaches(initialCoaches);
      return;
    }

    setIsLoading(true);
    try {
      const res = await CoachService.getByName(q);

      setCoaches(res);
    } catch (err: any) {
      openErrorModal('Lỗi tìm kiếm HLV!');
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
    setSelectedSlot(null);
    setIsInsufficientBalance(false);
  };

  const onSelectStartTime = (time: string) => {
    setStartTime(time);
    setEndTime(null);
    setSelectedSlot(null);
    setIsInsufficientBalance(false);
  };

  const onSelectEndTime = (time: string) => {
    setEndTime(time);
  };

  const onPressConfirmSlot = async () => {
    if (!selectedDate || !startTime || !endTime) return;

    const slot: BookingSlot = { date: selectedDate, startTime, endTime };
    setSelectedSlot(slot);

    const walletData = await fetchWallet();
    if (!walletData) return;

    const { totalPrice: price } = calculateBookingSummary(
      [slot],
      pricePerHour ?? 0,
    );

    setIsInsufficientBalance(walletData.availableVND < price);
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
    setSelectedSlot(null);
  };

  const clearTime = () => {
    setStartTime(null);
    setEndTime(null);
  };

  // CHECK
  const isValid = !!selectedSlot && !isInsufficientBalance && !walletError;

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
    bookingSlots: selectedSlot ? [selectedSlot] : [],
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
    handleSearch,
    searchQuery,
    setSearchQuery,
    isInsufficientBalance,
    wallet,
    walletError,
  };
};
