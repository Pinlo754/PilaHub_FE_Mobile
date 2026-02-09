import { Pressable, Text, View } from 'react-native';
import { getSessionByHour, getSessionColor } from '../../../utils/time';

type Props = {
  slot: { start: string; end: string };
};

const CardTime = ({ slot }: Props) => {
  const hour = Number(slot.start.split(':')[0]);
  const session = getSessionByHour(hour);
  const colorBg = getSessionColor(session);

  return (
    <Pressable className="h-10 border border-foreground rounded-lg relative">
      <Text className="color-foreground font-semibold pl-3 pr-2 my-auto">
        {slot.start} - {slot.end}
      </Text>

      <View
        className={`absolute w-2 h-full -left-0.5 ${colorBg} rounded-l-lg`}
      />
    </Pressable>
  );
};

export default CardTime;
