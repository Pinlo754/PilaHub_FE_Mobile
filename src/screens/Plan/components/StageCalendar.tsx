import React, { useMemo, useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Calendar, LocaleConfig } from "react-native-calendars";

LocaleConfig.locales.vi = {
  monthNames: [
    "Tháng 1",
    "Tháng 2",
    "Tháng 3",
    "Tháng 4",
    "Tháng 5",
    "Tháng 6",
    "Tháng 7",
    "Tháng 8",
    "Tháng 9",
    "Tháng 10",
    "Tháng 11",
    "Tháng 12",
  ],
  monthNamesShort: [
    "T1",
    "T2",
    "T3",
    "T4",
    "T5",
    "T6",
    "T7",
    "T8",
    "T9",
    "T10",
    "T11",
    "T12",
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
  dayNamesShort: ["CN", "T2", "T3", "T4", "T5", "T6", "T7"],
  today: "Hôm nay",
};

LocaleConfig.defaultLocale = "vi";

function isScheduleCompleted(scheduleWrapper: any) {
  const schedule = scheduleWrapper?.schedule ?? scheduleWrapper;

  return (
    scheduleWrapper?.completed === true ||
    schedule?.completed === true ||
    scheduleWrapper?.status === "COMPLETED" ||
    schedule?.status === "COMPLETED"
  );
}

function toLocalDateString(dateInput: any) {
  if (!dateInput) return null;

  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return null;
  d.setTime(d.getTime() + 7 * 60 * 60 * 1000);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export default function StageCalendar({
  stage,
  onSelectDate,
  completedDateMap = {},
}: any) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const markedDates = useMemo(() => {
    const marks: Record<string, any> = {};

    const schedules = Array.isArray(stage?.schedules) ? stage.schedules : [];

    schedules.forEach((sch: any) => {
      const dateStr = toLocalDateString(sch?.scheduledDate);
      if (!dateStr) return;

      const completed =
        completedDateMap?.[dateStr] === true || isScheduleCompleted(sch);

      marks[dateStr] = {
        selected: true,
        selectedColor: completed ? "#10B981" : "#C98A5E",
        selectedTextColor: "#FFFFFF",
        completed,
      };
    });

    return marks;
  }, [stage, completedDateMap]);

  const handleDateSelect = (day: any) => {
    const dateString = day?.dateString;
    if (!dateString) return;

    setSelectedDate(dateString);
    onSelectDate?.(dateString);
  };

  return (
    <View className="bg-[#E8DCCB] mx-4 rounded-2xl p-3">
      <Calendar
        markedDates={markedDates}
        onDayPress={handleDateSelect}
        theme={{
          selectedDayBackgroundColor: "#A0522D",
          todayTextColor: "#A0522D",
          arrowColor: "#A0522D",
          calendarBackground: "transparent",
        }}
        dayComponent={({ date, state }: any) => {
          const dateString = date?.dateString;
          const mark = markedDates?.[dateString];

          const hasSchedule = Boolean(mark);
          const isCompleted = mark?.completed === true;
          const isSelected = selectedDate === dateString;

          const bgColor = hasSchedule
? mark?.selectedColor ?? "#C98A5E"
            : "transparent";

          const textColor = hasSchedule
            ? "#FFFFFF"
            : state === "disabled"
              ? "#C7C7C7"
              : "#3A2A1A";

          return (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => handleDateSelect(date)}
              style={{
                width: 38,
                height: 38,
                borderRadius: 19,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: bgColor,
                position: "relative",

                // Ngày đang chọn: chỉ thêm viền, không đổi màu cũ
                borderWidth: isSelected ? 2 : 0,
                borderColor: isSelected ? "#A0522D" : "transparent",
              }}
            >
              <Text
                style={{
                  color: textColor,
                  fontWeight: "400",
                }}
              >
                {date?.day}
              </Text>

              {isCompleted && (
                <View
                  style={{
                    position: "absolute",
                    right: -2,
                    top: -2,
                    width: 16,
                    height: 16,
                    borderRadius: 8,
                    backgroundColor: "#059669",
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: 1,
                    borderColor: "#FFFFFF",
                  }}
                >
                  <Text
                    style={{
                      color: "#FFFFFF",
                      fontSize: 10,
                      fontWeight: "900",
                      lineHeight: 12,
                    }}
                  >
                    ✓
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}