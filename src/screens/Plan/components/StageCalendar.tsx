import React, { useMemo } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Calendar, LocaleConfig } from "react-native-calendars";

LocaleConfig.locales.vi = {
  monthNames: [
    "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
    "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12",
  ],
  monthNamesShort: [
    "T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12"
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

export default function StageCalendar({
  stage,
  onSelectDate,
  completedDateMap = {},
}: any) {
  const markedDates = useMemo(() => {
    const marks: any = {};
    const SEVEN_HOURS_IN_MS = 7 * 60 * 60 * 1000;

    // Hàm hỗ trợ để chuyển đổi và cộng thêm 7 tiếng
    const getAdjustedDateStr = (dateInput: any) => {
      const d = new Date(dateInput);
      if (isNaN(d.getTime())) return null;

      // Cộng thêm 7 tiếng
      d.setTime(d.getTime() + SEVEN_HOURS_IN_MS);

      // Trả về YYYY-MM-DD
      return d.toISOString().split('T')[0];
    };

    // Xử lý schedules
    const schedules = Array.isArray(stage?.schedules) ? stage!.schedules : [];
    schedules.forEach((sch: any) => {
      const dateStr = getAdjustedDateStr(sch?.scheduledDate);
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

    // Xử lý selectedDate (cần cộng thêm 7 tiếng nếu selectedDate cũng là UTC)
    // if (selectedDate) {
    //   const adjustedSelected = getAdjustedDateStr(selectedDate);
    //   if (adjustedSelected) {
    //     marks[adjustedSelected] = {
    //       ...marks[adjustedSelected], // Giữ lại thuộc tính nếu trùng ngày với schedule
    //       selected: true,
    //       selectedColor: "#8B4513",
    //     };
    //   }
    // }

    return marks;
  }, [stage, completedDateMap]);

  // const handleDateSelect = (day: any) => {
  //   const date = new Date(day.dateString);

  //   date.setTime(date.getTime() - 7 * 60 * 60 * 1000);

  //   const adjustedDateString = date.toISOString().split("T")[0];

  //   onSelectDate(adjustedDateString);
  // };

  const handleDateSelect = (day: any) => {
    // 1. Tạo đối tượng Date từ chuỗi
    // Lưu ý: new Date("YYYY-MM-DD") sẽ được hiểu là 00:00:00 UTC
    const date = new Date(day.dateString);

    // 2. Tính toán 7 tiếng bằng millisecond (7 * 60 * 60 * 1000 = 25,200,000ms)
    // Trừ đi 7 tiếng
    date.setTime(date.getTime() - (7 * 60 * 60 * 1000));

    // 3. Chuyển ngược lại định dạng chuỗi YYYY-MM-DD
    const adjustedDateString = date.toISOString().split('T')[0];

    // 4. Gọi hàm onSelectDate với giá trị đã trừ 7 tiếng
    onSelectDate(adjustedDateString);
};


  return (
    <View className="bg-[#E8DCCB] mx-4 rounded-2xl p-3">
      <Calendar
        markedDates={markedDates}
        onDayPress={(day) => handleDateSelect(day)}
        theme={{
          selectedDayBackgroundColor: "#A0522D",
          todayTextColor: "#A0522D",
          arrowColor: "#A0522D",
        }}
        dayComponent={({ date, state }: any) => {
          const dateString = date?.dateString;
          const mark = markedDates?.[dateString];

          const hasSchedule = Boolean(mark);
          const isCompleted = mark?.completed === true;

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