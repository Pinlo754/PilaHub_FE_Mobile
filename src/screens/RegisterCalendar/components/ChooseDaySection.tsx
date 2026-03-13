import Ionicons from '@react-native-vector-icons/ionicons';
import { Text, View } from 'react-native';
import { colors } from '../../../theme/colors';
import CalendarSection from './CalendarSection';
import { DaySchedule } from '../../../utils/availableSchedule';
import { BookingSlot } from '../../../utils/CoachBookingType';

type Props = {
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
  weekStart: Date;
};

const ChooseDaySection = ({
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
  weekStart,
}: Props) => {
  return (
    <View className="mt-6">
      {/* Header */}
      <View className="mx-4 rounded-full px-3 py-2 bg-background-sub1 flex-row gap-1 items-center">
        {/* Title */}
        <Ionicons
          name="information-circle-outline"
          size={22}
          color={colors.foreground}
        />
        <Text className="color-foreground font-medium flex-grow">
          Hãy chọn ngày <Text className="color-danger-darker">*</Text>
        </Text>

        {/* Number of selected day  */}
        <View className="px-3 py-1 rounded-lg bg-background-sub2 shadow-md elevation-md">
          <Text className="color-secondaryText">
            {bookingSlots.length} buổi
          </Text>
        </View>
      </View>

      {/* Calendar Section */}
      <CalendarSection
        weekStart={weekStart}
        schedule={schedule}
        selectedDate={selectedDate}
        onChangeWeek={onChangeWeek}
        startTime={startTime}
        endTime={endTime}
        onSelectDate={onSelectDate}
        onSelectStart={onSelectStart}
        onSelectEnd={onSelectEnd}
        onPressConfirmSlot={onPressConfirmSlot}
        bookingSlots={bookingSlots}
      />
    </View>
  );
};

export default ChooseDaySection;
