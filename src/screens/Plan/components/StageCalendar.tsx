import React, { useMemo } from "react";
import { View } from "react-native";
import { Calendar, LocaleConfig } from "react-native-calendars";

LocaleConfig.locales.vi = {
  monthNames: [
    "Tháng 1","Tháng 2","Tháng 3","Tháng 4","Tháng 5","Tháng 6",
    "Tháng 7","Tháng 8","Tháng 9","Tháng 10","Tháng 11","Tháng 12",
  ],
  monthNamesShort: [
    "T1","T2","T3","T4","T5","T6","T7","T8","T9","T10","T11","T12"
  ],
  dayNames: [
    "Chủ nhật",
    "Thứ hai",
    "Thứ ba",
    "Thứ tư",
    "Thứ năm",
    "Thứ sáu",
    "Thứ bảy",
  ],
  dayNamesShort: ["CN","T2","T3","T4","T5","T6","T7"],
  today: "Hôm nay",
};

LocaleConfig.defaultLocale = "vi";

export default function StageCalendar({
  stage,
  selectedDate,
  onSelectDate,
}: any) {
  const markedDates = useMemo(() => {
    const marks: any = {};

    // tolerate missing schedules or malformed scheduledDate values
    const schedules = Array.isArray(stage?.schedules) ? stage!.schedules : [];
    schedules.forEach((sch: any) => {
      const sd = sch?.scheduledDate;
      if (!sd) return; // skip if missing

      let dateStr: string | null = null;
      if (typeof sd === 'string') {
        // common formats: 'YYYY-MM-DDTHH:mm:...Z' or 'YYYY-MM-DD'
        dateStr = sd.includes('T') ? sd.split('T')[0] : sd.split(' ')[0];
      } else {
        try {
          const d = new Date(sd);
          if (!isNaN(d.getTime())) dateStr = d.toISOString().split('T')[0];
        } catch {
          // ignore invalid date
        }
      }
      if (!dateStr) return;

      marks[dateStr] = {
        selected: true,
        selectedColor: "#C98A5E",
      };
    });

    if (selectedDate) {
      marks[selectedDate] = {
        selected: true,
        selectedColor: "#8B4513",
      };
    }

    return marks;
  }, [stage, selectedDate]);

  return (
    <View className="bg-[#E8DCCB] mx-4 rounded-2xl p-3">
      <Calendar
        markedDates={markedDates}
        onDayPress={(day) => onSelectDate(day.dateString)}
        theme={{
          selectedDayBackgroundColor: "#A0522D",
          todayTextColor: "#A0522D",
          arrowColor: "#A0522D",
        }}
      />
    </View>
  );
}