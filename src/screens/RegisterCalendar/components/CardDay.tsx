import { Pressable, Text, View } from 'react-native';
import { DayItem } from '../../../utils/day';

type Props = {
  item: DayItem;
  isToday: boolean;
  isSelected: boolean;
  is2Digit: boolean;
  onPressDate: (date: Date) => void;
  isDisabled: boolean;
};

const CardDay = ({
  item,
  isToday,
  isSelected,
  is2Digit,
  onPressDate,
  isDisabled,
}: Props) => {
  return (
    <Pressable
      onPress={() => onPressDate(item.fullDate)}
      disabled={isDisabled}
      style={{ opacity: isDisabled ? 0.6 : 1 }}
      className={`pt-1 pb-5 flex-col items-center rounded-lg relative border border-foreground ${
        isDisabled ? 'bg-inactive-lighter' : isSelected && 'bg-background-sub1'
      } ${is2Digit ? 'px-2' : 'px-3'} `}
    >
      <Text className="color-secondaryText font-medium text-xs">
        Thg {item.month}
      </Text>

      <Text className="color-foreground font-bold text-2xl">{item.date}</Text>

      <Text className="color-secondaryText font-semibold">{item.dayLabel}</Text>

      {isToday && (
        <View className="w-2 h-2 bg-info-darker rounded-full absolute bottom-2" />
      )}
    </Pressable>
  );
};

export default CardDay;
