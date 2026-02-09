import Ionicons from '@react-native-vector-icons/ionicons';
import { Pressable, Text, View } from 'react-native';
import { colors } from '../../../theme/colors';
import { useEffect, useState } from 'react';
import {
  checkIsToday,
  DayItem,
  getNextWeekDate,
  getWeekDays,
} from '../../../utils/day';

const Calendar = () => {
  // STATE
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(today);
  const [days, setDays] = useState<DayItem[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(today);

  // HANDLERS
  const changeWeek = (step: number) => {
    setCurrentDate(prev => getNextWeekDate(prev, step));
  };

  // USE EFFECT
  useEffect(() => {
    setDays(getWeekDays(currentDate));
  }, [currentDate]);

  return (
    <View className="mx-4 mt-4 my-2 p-3 border-4 border-background-sub1 rounded-xl">
      <View className="flex-row justify-between items-center mb-2">
        {/* Month & Year */}
        <Text className="color-foreground font-semibold text-xl">
          Tháng {currentDate.getMonth() + 1}, {currentDate.getFullYear()}
        </Text>

        {/* Arrows */}
        <View className="flex-row gap-6">
          <Pressable onPress={() => changeWeek(-1)}>
            <Ionicons
              name="chevron-back-outline"
              size={20}
              color={colors.foreground}
            />
          </Pressable>
          <Pressable onPress={() => changeWeek(1)}>
            <Ionicons
              name="chevron-forward-outline"
              size={20}
              color={colors.foreground}
            />
          </Pressable>
        </View>
      </View>

      {/* Day */}
      <View className="flex-row justify-between mx-4">
        {days.map((item, index) => {
          const isSelected = checkIsToday(item.fullDate, selectedDate);
          const isToday = checkIsToday(item.fullDate, today);

          return (
            <Pressable
              key={index}
              className={`flex-col items-center w-12 pt-1 pb-4 ${
                isSelected && 'bg-background-sub1 rounded-lg'
              }`}
              onPress={() => setSelectedDate(item.fullDate)}
            >
              <Text className="color-secondaryText font-medium text-lg">
                {item.dayLabel}
              </Text>
              <Text className="color-foreground font-bold text-2xl">
                {item.date}
              </Text>

              {isToday && (
                <View className="w-2 h-2 bg-info-darker rounded-full absolute bottom-2" />
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

export default Calendar;
