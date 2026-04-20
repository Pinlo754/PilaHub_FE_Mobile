import Ionicons from '@react-native-vector-icons/ionicons';
import { View, Text, Modal, Pressable } from 'react-native';
import { colors } from '../../../theme/colors';
import { TRAINING_DAY_OPTIONS } from '../../../constants/trainingDayOption';
import Button from '../../../components/Button';
import { TrainingDay } from '../../../utils/CourseLessonProgressType';
import { useState } from 'react';
import { Calendar, LocaleConfig } from 'react-native-calendars';

type Props = {
  visible: boolean;
  onClose: () => void;
  handleSelectDay: (day: TrainingDay) => void;
  selectedDays: TrainingDay[];
  onPressRegister: (startDate: string) => void;
};

LocaleConfig.locales['vi'] = {
  monthNames: [
    'Tháng 1',
    'Tháng 2',
    'Tháng 3',
    'Tháng 4',
    'Tháng 5',
    'Tháng 6',
    'Tháng 7',
    'Tháng 8',
    'Tháng 9',
    'Tháng 10',
    'Tháng 11',
    'Tháng 12',
  ],
  monthNamesShort: [
    'T1',
    'T2',
    'T3',
    'T4',
    'T5',
    'T6',
    'T7',
    'T8',
    'T9',
    'T10',
    'T11',
    'T12',
  ],
  dayNames: ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'],
  dayNamesShort: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'],
  today: 'Hôm nay',
};
LocaleConfig.defaultLocale = 'vi';

const getLocalToday = () => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const ScheduleModal = ({
  visible,
  onClose,
  handleSelectDay,
  selectedDays,
  onPressRegister,
}: Props) => {
  // STATE
  const today = getLocalToday();
  const [startDate, setStartDate] = useState<string>(today);
  const [showCalendar, setShowCalendar] = useState<boolean>(false);

  // VARIABLE
  const isValid = selectedDays.length > 0 && !!startDate;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      statusBarTranslucent
    >
      <View className="flex-1 justify-center items-center">
        {/* Overlay */}
        <View className="absolute inset-0 bg-black/40" />

        {/* Modal */}
        <View className="rounded-3xl bg-white pb-4" style={{ width: 350 }}>
          {/* Header */}
          <View
            className="bg-background-sub1 py-5"
            style={{ borderTopLeftRadius: 24, borderTopRightRadius: 24 }}
          >
            <Text className="font-semibold color-foreground text-2xl text-center">
              Tạo lịch tập
            </Text>

            <Pressable onPress={onClose} className="absolute right-3 top-3">
              <Ionicons
                name="close-outline"
                size={26}
                color={colors.inactive[80]}
              />
            </Pressable>
          </View>

          {/* Số buổi */}
          {/* <View className=" mx-4 mt-4 flex-row items-center gap-3 w-[160px] relative">
            <Text className="color-foreground font-semibold text-lg">
              Số buổi tập
            </Text>

            <Pressable
              onPress={() => {
                setOpenSelect(!openSelect);
              }}
              className="rounded-lg bg-background-sub1 py-2 px-2 flex-row gap-3 items-center justify-between my-1"
            >
              <Text className="color-foreground">
                {sessionPerWeek ? `${sessionPerWeek} buổi` : 'Chọn số buổi tập'}
              </Text>

              <Ionicons
                name="chevron-down-outline"
                size={16}
                color={colors.foreground}
              />
            </Pressable>

            {openSelect && (
              <ScrollView
                className="absolute w-[142px] max-h-[200px] rounded-md bg-background border border-foreground left-[94px] top-12 z-10"
                showsVerticalScrollIndicator={false}
              >
                {SESSION_OPTIONS.map((num, index) => (
                  <Pressable
                    key={num}
                    onPress={() => handleSelectPress(num)}
                    className={`p-2 ${
                      index !== 0 ? 'border-t border-background-sub1' : ''
                    }`}
                  >
                    <Text className="color-foreground font-medium">
                      {num} buổi
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            )}
          </View> */}

          {/* Ngày bắt đầu */}
          <View className="mx-4 mt-5">
            <Text className="color-foreground font-semibold text-base mb-2">
              Ngày bắt đầu
            </Text>
            <Pressable
              onPress={() => setShowCalendar(!showCalendar)}
              className="flex-row items-center justify-between bg-background-sub2 px-4 py-3 rounded-xl"
            >
              <Text className="color-foreground font-medium">
                {startDate
                  ? new Date(startDate).toLocaleDateString('vi-VN')
                  : 'Chọn ngày bắt đầu'}
              </Text>
              <Ionicons
                name="calendar-outline"
                size={20}
                color={colors.foreground}
              />
            </Pressable>

            {showCalendar && (
              <Calendar
                current={startDate}
                minDate={today}
                onDayPress={day => {
                  setStartDate(day.dateString);
                  setShowCalendar(false);
                }}
                markedDates={{
                  [startDate]: {
                    selected: true,
                    selectedColor: colors.foreground, // 👈 màu cam rõ, đổi theo brand color
                  },
                  [today]: {
                    marked: true,
                    dotColor: colors.foreground,
                  },
                }}
                theme={{
                  backgroundColor: '#ffffff',
                  calendarBackground: '#ffffff',
                  textSectionTitleColor: colors.secondaryText,
                  selectedDayBackgroundColor: colors.foreground,
                  selectedDayTextColor: '#ffffff',
                  todayTextColor: colors.foreground,
                  dayTextColor: '#222222',
                  textDisabledColor: '#cccccc',
                  arrowColor: colors.foreground,
                  monthTextColor: colors.foreground,
                  textMonthFontWeight: 'bold',
                  textDayFontSize: 14,
                  textMonthFontSize: 15,
                  textDayHeaderFontSize: 13,
                }}
                renderArrow={direction => (
                  <Ionicons
                    name={
                      direction === 'left' ? 'chevron-back' : 'chevron-forward'
                    }
                    size={20}
                    color={colors.foreground}
                  />
                )}
              />
            )}
          </View>

          {/* Chọn ngày */}
          <View className="mx-4 mt-5">
            <Text className="color-foreground font-semibold text-base mb-2">
              Ngày tập trong tuần
            </Text>

            <View className="flex-row justify-between">
              {TRAINING_DAY_OPTIONS.map(day => {
                return (
                  <Pressable
                    key={day.value}
                    onPress={() => handleSelectDay(day.value)}
                    className={`p-2 flex-col items-center rounded-lg relative border border-foreground  ${
                      selectedDays.includes(day.value)
                        ? 'bg-background-sub1'
                        : ''
                    }`}
                  >
                    <Text className="color-foreground font-bold text-2xl">
                      {day.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Button */}
          <View className="flex self-center mt-8">
            <Button
              text="Xác nhận"
              onPress={() => onPressRegister(startDate)}
              colorType={!isValid ? 'grey' : 'sub1'}
              rounded="lg"
              width={100}
              disabled={!isValid}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default ScheduleModal;
