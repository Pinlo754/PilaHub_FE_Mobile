import { View, Text } from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { colors } from '../../../theme/colors';

type Props = {
  title: string;
  subtitle?: string;
  icon?: string;
};

const EmptyState = ({ title, subtitle, icon = 'file-tray-outline' }: Props) => {
  return (
    <View className="flex-1 items-center justify-center mb-20 px-6">
      <Ionicons name={icon as any} size={60} color={colors.inactive.darker} />

      <Text className="text-xl font-semibold color-foreground mt-4 text-center">
        {title}
      </Text>

      {subtitle && (
        <Text className="color-secondaryText text-center mt-2">{subtitle}</Text>
      )}
    </View>
  );
};

export default EmptyState;
