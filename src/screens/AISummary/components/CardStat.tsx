import Ionicons from '@react-native-vector-icons/ionicons';
import { View, Text } from 'react-native';

type Props = {
  title: string;
  iconName: string;
  iconSize: number;
  value: string;
  colorIcon: string;
  colorBg: string;
};

const CardStat = ({
  title,
  iconName,
  iconSize,
  value,
  colorIcon,
  colorBg,
}: Props) => {
  return (
    <View className="w-[98%] bg-white border border-background-sub1/30 rounded-xl px-4 pb-3 pt-1 shadow-md elevation-md flex-row gap-4 items-center">
      {/* Left Section */}

      <View
        className="w-12 h-12 rounded-lg items-center justify-center mt-2"
        style={{ backgroundColor: colorBg }}
      >
        <Ionicons name={iconName as any} size={iconSize} color={colorIcon} />
      </View>

      {/* Right Section */}
      <View className='flex-row justify-center items-center w-full gap-36'>
        <Text className="text-secondaryText text-xl font-bold text-center">{title}</Text>
        <Text className="text-xl font-bold text-foreground">{value}</Text>
      </View>
    </View>
  );
};

export default CardStat;
