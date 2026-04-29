import React, { useMemo } from "react";
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

function toVietnamDateKey(dateInput: string | Date | null | undefined) {
  if (!dateInput) return null;

  const date = new Date(dateInput);

  if (isNaN(date.getTime())) return null;

  /**
   * Supabase thường lưu UTC.
   * Việt Nam UTC+7.
   *
   * Ví dụ:
   * 2026-04-27T17:00:00Z + 7h = 2026-04-28 00:00 Việt Nam
   */
  const vietnamDate = new Date(date.getTime() + 7 * 60 * 60 * 1000);

  const year = vietnamDate.getUTCFullYear();
  const month = String(vietnamDate.getUTCMonth() + 1).padStart(2, "0");
  const day = String(vietnamDate.getUTCDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getScheduleDateKey(scheduleWrapper: any) {
  const rawDate =
    scheduleWrapper?.scheduledDate ??
    scheduleWrapper?.schedule?.scheduledDate ??
    null;

  return toVietnamDateKey(rawDate);
}

function isScheduleCompleted(scheduleWrapper: any) {
  const schedule = scheduleWrapper?.schedule ?? scheduleWrapper;

  return (
    scheduleWrapper?.completed === true ||
    schedule?.completed === true ||
    scheduleWrapper?.status === "COMPLETED" ||
    schedule?.status === "COMPLETED"
  );
}

export default function StageCalendar({
  stage,
  selectedDate,
  onSelectDate,
  completedDateMap = {},
}: any) {
  const { markedDates, scheduleMap } = useMemo(() => {
    const marks: Record<string, any> = {};
    const map: Record<string, any> = {};

    const schedules = Array.isArray(stage?.schedules) ? stage.schedules : [];

    schedules.forEach((sch: any) => {
      const dateStr = getScheduleDateKey(sch);

      if (!dateStr) return;

      const completed =
        completedDateMap?.[dateStr] === true ||
        isScheduleCompleted(sch);

      /**
       * Lưu riêng map:
       * dateKey Việt Nam -> scheduleWrapper thật
       */
      map[dateStr] = sch;

      marks[dateStr] = {
        selected: true,
        selectedColor: completed ? "#10B981" : "#C98A5E",
        selectedTextColor: "#FFFFFF",
        marked: completed,
        dotColor: completed ? "#10B981" : "#C98A5E",
        completed,
      };
    });

    if (selectedDate) {
      const oldMark = marks[selectedDate] ?? {};

      const completed =
        completedDateMap?.[selectedDate] === true ||
        oldMark?.completed === true ||
        oldMark?.selectedColor === "#10B981";

      marks[selectedDate] = {
        ...oldMark,
        selected: true,
        selectedColor: completed ? "#10B981" : "#8B4513",
        selectedTextColor: "#FFFFFF",
        completed,
      };
    }

    return {
      markedDates: marks,
      scheduleMap: map,
    };
  }, [stage, selectedDate, completedDateMap]);

  const handlePressDate = (dateString?: string) => {
    if (!dateString) return;

    const scheduleWrapper = scheduleMap?.[dateString] ?? null;

    console.log("[StageCalendar] pressed date:", dateString);
    console.log("[StageCalendar] scheduleWrapper:", scheduleWrapper);

    /**
     * Truyền luôn scheduleWrapper lên RoadMap.
     * RoadMap không cần tự find lại nữa.
     */
    onSelectDate(dateString, scheduleWrapper);
  };

  return (
    <View className="bg-[#E8DCCB] mx-4 rounded-2xl p-3">
      <Calendar
        markedDates={markedDates}
        markingType="dot"
        onDayPress={(day) => {
          handlePressDate(day?.dateString);
        }}
        theme={{
          selectedDayBackgroundColor: "#A0522D",
          todayTextColor: "#A0522D",
          arrowColor: "#A0522D",
        }}
        dayComponent={({ date, state }: any) => {
          const dateString = date?.dateString;
          const mark = markedDates?.[dateString];

          const isSelected = selectedDate === dateString;

          const isCompleted =
            completedDateMap?.[dateString] === true ||
            mark?.completed === true ||
            mark?.selectedColor === "#10B981";

          const hasSchedule = Boolean(mark);

          const bgColor = isSelected
            ? "#8B4513"
            : isCompleted
              ? "#10B981"
              : hasSchedule
                ? "#C98A5E"
                : "transparent";

          const textColor =
            isSelected || isCompleted || hasSchedule
              ? "#FFFFFF"
              : state === "disabled"
                ? "#C7C7C7"
                : "#3A2A1A";

          return (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => handlePressDate(dateString)}
              style={{
                width: 38,
                height: 38,
                borderRadius: 19,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: bgColor,
                position: "relative",
              }}
            >
              <Text
                style={{
                  color: textColor,
                  fontWeight: isSelected || hasSchedule ? "700" : "400",
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