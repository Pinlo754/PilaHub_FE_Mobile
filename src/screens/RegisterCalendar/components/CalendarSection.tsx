import { ScrollView, View } from 'react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  checkIsToday,
  DayItem,
  getNextWeekDate,
  getWeekDays,
} from '../../../utils/day';
import CardDay from './CardDay';
import { useFocusEffect } from '@react-navigation/native';
import CalendarHeader from './CalendarHeader';
import ChooseTime from './ChooseTime';
import { DaySchedule } from '../../../utils/availableSchedule';
import dayjs from 'dayjs';
import { BookingSlot } from '../../../utils/CoachBookingType';
import BookingTable from './BookingTable';

type Props = {
  weekStart: Date;
  schedule: DaySchedule[];
  selectedDate: Date | null;
  onChangeWeek: (date: Date) => void;
  startTime: string | null;
  endTime: string | null;
  onSelectDate: (date: Date) => void;
  onSelectStart: (time: string) => void;
  onSelectEnd: (time: string) => void;
  onPressConfirmSlot: () => void;
  bookingSlots: BookingSlot[];
};

const CalendarSection = ({
  weekStart,
  schedule,
  selectedDate,
  onChangeWeek,
  endTime,
  onSelectDate,
  onSelectEnd,
  onSelectStart,
  startTime,
  onPressConfirmSlot,
  bookingSlots,
}: Props) => {
  // STATE
  const today = new Date();
  const [days, setDays] = useState<DayItem[]>([]);

  // USE REF
  const scrollRef = useRef<ScrollView>(null);

  // HANDLERS
  const changeWeek = (step: number) => {
    const newDate = getNextWeekDate(weekStart, step);
    onChangeWeek(newDate);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  };

  const handlePressDate = (date: Date) => {
    const isPast = dayjs(date).isBefore(dayjs(), 'day');

    if (isPast) return;

    onSelectDate(date);
  };

  // CALC
  const selectedSlots = selectedDate
    ? (schedule.find(d => d.date === dayjs(selectedDate).format('YYYY-MM-DD'))
        ?.slots ?? [])
    : [];

  // CHECK
  const isPrevDisabled = dayjs(getNextWeekDate(weekStart, -1)).isBefore(
    dayjs(),
    'week',
  );

  // USE EFFECTS
  useEffect(() => {
    setDays(getWeekDays(weekStart));
  }, [weekStart]);

  // USE FOCUS EFFECT
  useFocusEffect(
    useCallback(() => {
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    }, []),
  );

  return (
    <View className="mt-4">
      {/* Week */}
      <CalendarHeader
        days={days}
        changeWeek={changeWeek}
        disablePrev={isPrevDisabled}
      />

      {/* Days */}
      <View className="w-full p-3 mb-3 rounded-2xl bg-background-sub2 flex-row justify-between  items-center">
        {days.map((item, _index) => {
          const isToday = checkIsToday(item.fullDate, today);
          const isSelected = selectedDate
            ? checkIsToday(item.fullDate, selectedDate)
            : false;
          const is2Digit = Number(item.month) >= 10;
          const isPast = dayjs(item.fullDate).isBefore(dayjs(), 'day');

          return (
            <CardDay
              key={`${item.fullDate.getTime()}`}
              item={item}
              isToday={isToday}
              isSelected={isSelected}
              is2Digit={is2Digit}
              onPressDate={handlePressDate}
              isDisabled={isPast}
            />
          );
        })}
      </View>

      {/* Choose Time */}
      <ChooseTime
        slots={selectedSlots}
        startTime={startTime}
        endTime={endTime}
        onSelectStart={onSelectStart}
        onSelectEnd={onSelectEnd}
        onPressConfirmSlot={onPressConfirmSlot}
        bookingSlots={bookingSlots}
      />

      {/* Booking Slot */}
      {bookingSlots.length > 0 && <BookingTable bookingSlots={bookingSlots} />}

      {/* Schedule Available  */}
      {/* <ScheduleAvailable
        days={days}
        selectedDate={selectedDate}
        scrollRef={scrollRef}
        dayLayouts={dayLayouts}
        getKey={getKey}
        dynamicPaddingBottom={dynamicPaddingBottom}
      /> */}
    </View>
  );
};

export default CalendarSection;
