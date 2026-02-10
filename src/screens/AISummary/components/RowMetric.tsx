import { Text, View } from 'react-native';
import { getProgressColor } from '../../../utils/uiMapper';

type Props = {
  label: string;
  progress: number;
};

const RowMetric = ({ label, progress }: Props) => {
  // GET
  const color = getProgressColor(progress);

  return (
    <View className="mt-4">
      <View className="flex-row justify-between">
        <Text className="color-foreground font-medium">{label}</Text>
        <Text className="color-foreground font-bold">{progress}%</Text>
      </View>

      {/* Progress */}
      <View className="mt-3 h-2 w-full bg-inactive-lighter rounded-full overflow-hidden">
        <View
          className="h-full rounded-full"
          style={{
            backgroundColor: color,
            width: `${Math.min(100, Math.max(progress, 0))}%`,
          }}
        />
      </View>
    </View>
  );
};

export default RowMetric;
