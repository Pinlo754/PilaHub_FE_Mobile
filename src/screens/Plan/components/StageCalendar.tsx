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

const COLORS = {
  cardBg: "#FFF8EF",
  border: "#E7D5BF",
  title: "#3A2A1A",
  muted: "#9A7A5A",
  primary: "#A0522D",
  schedule: "#C98A5E",
  scheduleSoft: "#F3D7BE",
  completed: "#10B981",
  completedDark: "#059669",
  disabled: "#C7C7C7",
  white: "#FFFFFF",
};

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
    const marks: Record<string, any> = {};
    const SEVEN_HOURS_IN_MS = 7 * 60 * 60 * 1000;

    const getAdjustedDateStr = (dateInput: any) => {
      const d = new Date(dateInput);

      if (isNaN(d.getTime())) return null;

      d.setTime(d.getTime() + SEVEN_HOURS_IN_MS);

      return d.toISOString().split("T")[0];
    };

    const schedules = Array.isArray(stage?.schedules) ? stage.schedules : [];

    schedules.forEach((sch: any) => {
      const dateStr = getAdjustedDateStr(sch?.scheduledDate);
      if (!dateStr) return;

      const completed =
        completedDateMap?.[dateStr] === true || isScheduleCompleted(sch);

      marks[dateStr] = {
        selected: true,
        selectedColor: completed ? COLORS.completed : COLORS.schedule,
        selectedTextColor: COLORS.white,
        completed,
      };
    });

    return marks;
  }, [stage, completedDateMap]);

  const handleDateSelect = (day: any) => {
    const date = new Date(day.dateString);

    date.setTime(date.getTime() - 7 * 60 * 60 * 1000);

    const adjustedDateString = date.toISOString().split("T")[0];

    onSelectDate(adjustedDateString);
  };

  return (
    <View
      style={{
        marginHorizontal: 16,
        marginTop: 8,
        borderRadius: 28,
        backgroundColor: COLORS.cardBg,
        padding: 14,
        borderWidth: 1,
        borderColor: COLORS.border,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
        elevation: 5,
      }}
    >
      <View style={{ marginBottom: 8 }}>
        <Text
          style={{
            fontSize: 18,
            fontWeight: "800",
            color: COLORS.title,
          }}
        >
          Lịch tập của bạn
        </Text>

        <Text
          style={{
            marginTop: 4,
            fontSize: 13,
            color: COLORS.muted,
          }}
        >
          Chọn ngày để xem bài tập trong lộ trình
        </Text>
      </View>

      <Calendar
        markedDates={markedDates}
        onDayPress={(day) => handleDateSelect(day)}
        firstDay={1}
        hideExtraDays={false}
        enableSwipeMonths
        renderArrow={(direction) => (
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: COLORS.scheduleSoft,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text
              style={{
                color: COLORS.primary,
                fontSize: 21,
                fontWeight: "900",
                marginTop: -2,
              }}
            >
              {direction === "left" ? "‹" : "›"}
            </Text>
          </View>
        )}
        theme={
          {
            calendarBackground: "transparent",

            textMonthFontSize: 18,
            textMonthFontWeight: "800",
            monthTextColor: COLORS.title,

            textDayHeaderFontSize: 12,
            textDayHeaderFontWeight: "700",
            textSectionTitleColor: COLORS.muted,

            selectedDayBackgroundColor: COLORS.primary,
            todayTextColor: COLORS.primary,
            arrowColor: COLORS.primary,

            "stylesheet.calendar.header": {
              header: {
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                paddingLeft: 4,
                paddingRight: 4,
                marginTop: 8,
                marginBottom: 10,
              },
              dayHeader: {
                marginTop: 2,
                marginBottom: 8,
                width: 34,
                textAlign: "center",
                fontSize: 12,
                color: COLORS.muted,
                fontWeight: "700",
              },
            },
          } as any
        }
        dayComponent={({ date, state }: any) => {
          const dateString = date?.dateString;
          const mark = markedDates?.[dateString];

          const hasSchedule = Boolean(mark);
          const isCompleted = mark?.completed === true;
          const isDisabled = state === "disabled";

          const bgColor = hasSchedule
            ? mark?.selectedColor ?? COLORS.schedule
            : "transparent";

          const textColor = hasSchedule
            ? COLORS.white
            : isDisabled
              ? COLORS.disabled
              : COLORS.title;

          return (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => handleDateSelect(date)}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: bgColor,
                position: "relative",
                borderWidth: 0,
                borderColor: "transparent",
                opacity: isDisabled ? 0.55 : 1,
              }}
            >
              <Text
                style={{
                  color: textColor,
                  fontSize: 15,
                  fontWeight: hasSchedule ? "800" : "500",
                }}
              >
                {date?.day}
              </Text>

              {isCompleted && (
                <View
                  style={{
                    position: "absolute",
                    right: -3,
                    top: -3,
                    width: 17,
                    height: 17,
                    borderRadius: 9,
                    backgroundColor: COLORS.completedDark,
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: 1.5,
                    borderColor: COLORS.white,
                  }}
                >
                  <Text
                    style={{
                      color: COLORS.white,
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

      <View
        style={{
          marginTop: 8,
          paddingTop: 12,
          borderTopWidth: 1,
          borderTopColor: COLORS.border,
          flexDirection: "row",
          justifyContent: "space-around",
        }}
      >
        <LegendDot color={COLORS.schedule} label="Có lịch" />
        <LegendDot color={COLORS.completed} label="Hoàn thành" />
        <LegendDot color={COLORS.scheduleSoft} label="Đang chọn" />
      </View>
    </View>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
      }}
    >
      <View
        style={{
          width: 10,
          height: 10,
          borderRadius: 5,
          backgroundColor: color,
          borderWidth: color === COLORS.scheduleSoft ? 1 : 0,
          borderColor: COLORS.primary,
        }}
      />

      <Text
        style={{
          fontSize: 12,
          color: COLORS.muted,
          fontWeight: "600",
        }}
      >
        {label}
      </Text>
    </View>
  );
}