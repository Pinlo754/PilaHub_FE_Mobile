import Ionicons from '@react-native-vector-icons/ionicons';
import { View, Text } from 'react-native';
import { colors } from '../../../theme/colors';

type Props = {
  title: string;
  value: number;
  diff: number;
};

const CardMetric = ({ title, value, diff }: Props) => {
  const isUp = diff > 0;

  return (
    <View className="w-[49%] bg-white border border-background-sub1_30 rounded-2xl p-4 shadow-sm elevation-6">
      <View className="flex-row justify-between items-center">
        <Text className="text-secondaryText font-medium">{title}</Text>

        <View className="flex-row items-center gap-1">
          <Ionicons
            name={isUp ? 'arrow-up-outline' : 'arrow-down-outline'}
            size={14}
            color={colors.inactive.darker}
          />
          <Text className="text-inactive-darker">{Math.abs(diff)}cm</Text>
        </View>
      </View>

      <Text className="mt-2 text-xl font-bold text-foreground">{value}cm</Text>
    </View>
  );
};

export default CardMetric;
