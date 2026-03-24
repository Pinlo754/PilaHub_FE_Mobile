import Ionicons from '@react-native-vector-icons/ionicons';
import { Text, View } from 'react-native';
import { colors } from '../../../theme/colors';

type InfoSectionProps = {
  icon: string;
  title: string;
  data: string | string[];
};

const InfoSection = ({ icon, title, data }: InfoSectionProps) => {
  if (!data?.length) return null;

  const list = Array.isArray(data) ? data : [data];

  return (
    <View className="mt-2">
      <View className="flex-row items-center gap-2">
        <Ionicons name={icon as any} size={20} color={colors.foreground} />
        <Text className="color-foreground font-semibold">{title}</Text>
      </View>

      <View className="mt-2">
        {data.map((item, index) => (
          <View key={index} className="flex-row items-start gap-1 pl-3 mb-2">
            <View className="pt-[3px]">
              <Ionicons
                name="checkmark-outline"
                size={12}
                color={colors.foreground}
              />
            </View>
            <Text className="color-secondaryText text-sm font-medium">
              {item}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};
export default InfoSection;
