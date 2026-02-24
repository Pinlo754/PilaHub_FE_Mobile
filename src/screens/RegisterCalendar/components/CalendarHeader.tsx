import Ionicons from '@react-native-vector-icons/ionicons';
import { Pressable, Text, View } from 'react-native';
import { colors } from '../../../theme/colors';
import { DayItem, formatWeekRange } from '../../../utils/day';

type Props = {
  days: DayItem[];
  changeWeek: (step: number) => void;
};

const CalendarHeader = ({ days, changeWeek }: Props) => {
  return (
    <View className="flex-row items-center gap-4 self-center mb-3">
      {/* Arrow */}
      <Pressable onPress={() => changeWeek(-1)}>
        <Ionicons
          name="chevron-back-outline"
          size={22}
          color={colors.foreground}
        />
      </Pressable>

      {/* Week Range */}
      <Text className="color-foreground font-semibold">
        {formatWeekRange(days)}
      </Text>

      {/* Arrow */}
      <Pressable onPress={() => changeWeek(1)}>
        <Ionicons
          name="chevron-forward-outline"
          size={22}
          color={colors.foreground}
        />
      </Pressable>
    </View>
  );
};

export default CalendarHeader;
