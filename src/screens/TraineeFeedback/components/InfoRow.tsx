import Ionicons from '@react-native-vector-icons/ionicons';
import { Text, View } from 'react-native';
import { colors } from '../../../theme/colors';

type Props = {
  label: string;
  value: string;
  iconName: string;
  iconSize: number;
};

const InfoRow = ({ label, value, iconName, iconSize }: Props) => {
  return (
    <View className="flex-row gap-1 items-center w-40">
      <Ionicons
        name={iconName as any}
        size={iconSize}
        color={colors.foreground}
      />
      <Text className="color-foreground font-medium">
        {label}: <Text className="color-secondaryText font-base">{value}</Text>
      </Text>
    </View>
  );
};

export default InfoRow;
