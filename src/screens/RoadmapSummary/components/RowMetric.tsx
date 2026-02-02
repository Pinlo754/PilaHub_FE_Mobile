import Ionicons from '@react-native-vector-icons/ionicons';
import { View, Text } from 'react-native';
import { colors } from '../../../theme/colors';

type Props = {
  label: string;
  value_1: number;
  value_2: number;
};

const RowMetric = ({ label, value_1, value_2 }: Props) => {
  return (
    <View className="flex-row justify-between py-2">
      <Text className="text-secondaryText">{label}</Text>
      <View className="flex-row gap-1 items-center">
        <Text className="text-foreground font-medium">{value_1}cm</Text>
        {value_2 > 0 && (
          <>
            <Ionicons
              name="arrow-forward-outline"
              size={14}
              color={colors.foreground}
            />
            <Text className="text-foreground font-medium">{value_2}cm</Text>
          </>
        )}
      </View>
    </View>
  );
};

export default RowMetric;
