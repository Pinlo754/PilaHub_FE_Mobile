import { Image, Text, View } from 'react-native';
import { CoachType } from '../../../utils/CoachType';
import Ionicons from '@react-native-vector-icons/ionicons';

type Props = {
  item: CoachType;
  isLast?: boolean;
};

const CardCoach = ({ item, isLast }: Props) => {
  // COLOR
  const WARNING = '#F2B94C';
  const INFO_DARKER = '#3B82F6';

  return (
    <View
      className={`border-t border-background-sub2 flex-row gap-4 py-3 px-4 ${isLast ? 'border-b' : ''}`}
    >
      {/* Image */}
      <View className="rounded-full w-16 h-16 overflow-hidden">
        <Image
          source={{
            uri: item.avatar,
          }}
          style={{ width: '100%', height: '100%' }}
          resizeMode="cover"
        />
      </View>

      {/* Info */}
      <View className="flex">
        {/* Name */}
        <Text className="font-bold color-foreground text-lg">{item.name}</Text>
        {/* Rate */}
        <View className="flex-row gap-6">
          <View className="flex-row gap-2 items-center">
            <Ionicons name="star" size={18} color={WARNING} />
            <Text className="color-secondaryText font-medium">
              {item.rating}
            </Text>
          </View>
          {/* Certificate */}
          <View className="flex-row gap-2 items-center">
            <Ionicons name="ribbon" size={18} color={INFO_DARKER} />
            <Text className="color-secondaryText font-medium">
              {item.certificate_count}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

export default CardCoach;
