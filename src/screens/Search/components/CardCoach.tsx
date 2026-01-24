import { Image, Pressable, Text, View } from 'react-native';
import { CoachType } from '../../../utils/CoachType';
import Ionicons from '@react-native-vector-icons/ionicons';

type Props = {
  item: CoachType;
  isLast?: boolean;
  onPress?: () => void;
};

const CardCoach = ({ item, isLast, onPress }: Props) => {
  // COLOR
  const WARNING = '#F2B94C';
  const INFO_DARKER = '#3B82F6';

  return (
    <Pressable
      className={`border-t border-background-sub2 flex-row gap-4 py-3 px-4 ${isLast ? 'border-b' : ''}`}
      onPress={onPress}
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
        <Text className="font-bold color-foreground text-lg">
          {item.full_name}
        </Text>
        {/* Rate */}
        <View className="flex-row gap-6">
          <View className="flex-row gap-2 items-center">
            <Ionicons name="star" size={18} color={WARNING} />
            <Text className="color-secondaryText font-medium">
              {item.rating_avg}
            </Text>
          </View>
          {/* Experience year */}
          <View className="flex-row gap-2 items-center">
            <Ionicons name="ribbon" size={18} color={INFO_DARKER} />
            <Text className="color-secondaryText font-medium">
              {item.experience_years} năm
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
};

export default CardCoach;
