import Ionicons from '@react-native-vector-icons/ionicons';
import { View, Text } from 'react-native';
import { colors } from '../../../theme/colors';

type Props = {
  title: string;
  iconName: string;
  iconSize: number;
  value: string;
  progress: number;
  change: number;
  trend: 'up' | 'down';
  colorIcon: string;
  colorBg: string;
  isPercent: boolean;
};

const CardStat = ({
  title,
  iconName,
  iconSize,
  value,
  progress,
  change,
  trend,
  colorIcon,
  colorBg,
  isPercent,
}: Props) => {
  // CHECK
  const isUp = trend === 'up';

  return (
    <View className="w-[49%] bg-white border border-background-sub1_30 rounded-2xl p-4 shadow-sm elevation-6">
      {/* Header */}
      <View className="flex-row justify-between items-center">
        <View
          className="w-10 h-10 rounded-lg items-center justify-center"
          style={{ backgroundColor: colorBg }}
        >
          <Ionicons name={iconName as any} size={iconSize} color={colorIcon} />
        </View>

        <View className="flex-row items-center gap-1">
          <Ionicons
            name={isUp ? 'arrow-up-outline' : 'arrow-down-outline'}
            size={14}
            color={isUp ? colors.success.DEFAULT : colors.danger.darker}
          />
          <Text
            className={`text-sm font-medium ${
              isUp ? 'text-success' : 'text-danger-darker'
            }`}
          >
            {change}%
          </Text>
        </View>
      </View>

      {/* Content */}
      <Text className="mt-3 text-secondaryText">{title}</Text>
      <View className="flex-row items-end">
        <Text className="text-xl font-bold text-foreground">{value}</Text>
        <Text className="text-secondaryText text-sm">
          {isPercent ? '%' : ' bpm'}
        </Text>
      </View>

      {/* Progress */}
      <View className="mt-3 h-2 w-full bg-inactive-lighter rounded-full overflow-hidden">
        <View
          className="h-full rounded-full"
          style={{
            backgroundColor: colorIcon,
            width: `${Math.min(100, Math.max(progress, 0))}%`,
          }}
        />
      </View>
    </View>
  );
};

export default CardStat;
