import React, { RefObject } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { DayItem, formatSelectedLabel } from '../../../utils/day';
import { getSessionByHour, getSessionColor } from '../../../utils/time';

type Props = {
  days: DayItem[];
  selectedDate: Date | null;
  scrollRef: RefObject<ScrollView | null>;
  dayLayouts: React.MutableRefObject<Record<string, number>>;
  getKey: (date: Date) => string;
  dynamicPaddingBottom: number;
};

const mockSchedule = [
  { start: '08:00', end: '09:00' },
  { start: '10:00', end: '11:00' },
  { start: '14:00', end: '15:00' },
  { start: '19:00', end: '20:00' },
];

const ScheduleAvailable = ({
  days,
  scrollRef,
  dayLayouts,
  getKey,
  dynamicPaddingBottom,
}: Props) => {

  return (
    <ScrollView
      ref={scrollRef}
      className="max-h-[373px]"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: dynamicPaddingBottom }}
    >
      {days.map(day => {
        const key = getKey(day.fullDate);

        return (
          <View
            key={key}
            onLayout={e => {
              dayLayouts.current[key] = e.nativeEvent.layout.y;
            }}
            className="mb-3"
          >
            {/* Label */}
            <View className="mt-2 mb-3 flex-row items-center">
              <View className="w-4 h-[5px] bg-foreground" />
              <View className="px-3 py-2 bg-foreground rounded-lg">
                <Text className="color-background font-semibold text-sm">
                  {formatSelectedLabel(day.fullDate)}
                </Text>
              </View>
            </View>

            {/* Time */}
            <View className="mx-4 gap-3 flex-row flex-wrap">
              {mockSchedule.map((slot, index) => {
                const hour = Number(slot.start.split(':')[0]);
                const session = getSessionByHour(hour);
                const colorBg = getSessionColor(session);

                return (
                  <Pressable
                    key={index}
                    className="h-10 border border-foreground rounded-lg relative"
                  >
                    <Text className="color-foreground font-semibold pl-3 pr-2 my-auto">
                      {slot.start} - {slot.end}
                    </Text>

                    <View
                      className={`absolute w-2 h-full -left-0.5 ${colorBg} rounded-l-lg`}
                    />
                  </Pressable>
                );
              })}
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
};

export default ScheduleAvailable;
