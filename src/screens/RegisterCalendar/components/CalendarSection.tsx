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
import ScheduleAvailable from './ScheduleAvailable';
import CalendarHeader from './CalendarHeader';

type Props = {};

const CalendarSection = ({}: Props) => {
  // STATE
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(today);
  const [days, setDays] = useState<DayItem[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // USE REF
  const scrollRef = useRef<ScrollView>(null);
  const dayLayouts = useRef<Record<string, number>>({});

  // HANDLERS
  const changeWeek = (step: number) => {
    setCurrentDate(prev => getNextWeekDate(prev, step));
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  };

  const getKey = (date: Date) =>
    `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

  const handlePressDate = (date: Date) => {
    setSelectedDate(date);
    const key = getKey(date);
    const y = dayLayouts.current[key];

    if (y !== undefined) {
      scrollRef.current?.scrollTo({ y: y - 10, animated: true });
    }
  };

  const getSelectedIndex = () => {
    if (!selectedDate) return -1;

    return days.findIndex(d => checkIsToday(d.fullDate, selectedDate));
  };

  // CALC
  const selectedIndex = getSelectedIndex();
  const dynamicPaddingBottom = selectedIndex >= days.length - 2 ? 225 : 0;

  // USE EFFECTS
  useEffect(() => {
    setDays(getWeekDays(currentDate));
  }, [currentDate]);

  // USE FOCUS EFFECT
  useFocusEffect(
    useCallback(() => {
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    }, []),
  );

  return (
    <View className="mt-4">
      {/* Week */}
      <CalendarHeader days={days} changeWeek={changeWeek} />

      {/* Days */}
      <View className="w-full p-3 mb-3 rounded-2xl bg-background-sub2 flex-row justify-between  items-center">
        {days.map((item, index) => {
          const isToday = checkIsToday(item.fullDate, today);
          const isSelected = selectedDate
            ? checkIsToday(item.fullDate, selectedDate)
            : false;
          const is2Digit = item.month.length >= 10;

          return (
            <CardDay
              key={index}
              item={item}
              isToday={isToday}
              isSelected={isSelected}
              is2Digit={is2Digit}
              onPressDate={handlePressDate}
            />
          );
        })}
      </View>

      {/* Schedule Available  */}
      <ScheduleAvailable
        days={days}
        selectedDate={selectedDate}
        scrollRef={scrollRef}
        dayLayouts={dayLayouts}
        getKey={getKey}
        dynamicPaddingBottom={dynamicPaddingBottom}
      />
    </View>
  );
};

export default CalendarSection;
