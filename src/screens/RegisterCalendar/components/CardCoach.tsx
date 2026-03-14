import { Image, Pressable, Text, View } from 'react-native';
import { CoachType } from '../../../utils/CoachType';
import Ionicons from '@react-native-vector-icons/ionicons';
import { colors } from '../../../theme/colors';

type Props = {
  item: CoachType;
  isLast?: boolean;
  onPressCard: () => void;
  onPressBtn: () => void;
};

const CardCoach = ({ item, isLast, onPressCard, onPressBtn }: Props) => {
  return (
    <Pressable
      className={`border-t border-background-sub2 flex-row gap-4 py-3 px-4 ${isLast ? 'border-b' : ''}`}
      onPress={onPressCard}
    >
      {/* Image */}
      <View className="rounded-full w-16 h-16 overflow-hidden">
        <Image
          source={{
            uri: item.avatarUrl,
          }}
          style={{ width: '100%', height: '100%' }}
          resizeMode="cover"
        />
      </View>

      {/* Info */}
      <View className="flex-grow">
        {/* Name */}
        <Text className="font-bold color-foreground text-lg">
          {item.fullName}
        </Text>
        {/* Rate */}
        <View className="flex-row gap-6">
          <View className="flex-row gap-2 items-center">
            <Ionicons name="star" size={18} color={colors.warning.DEFAULT} />
            <Text className="color-secondaryText font-medium">
              {item.avgRating}
            </Text>
          </View>
          {/* Experience year */}
          <View className="flex-row gap-2 items-center">
            <Ionicons name="ribbon" size={18} color={colors.info.darker} />
            <Text className="color-secondaryText font-medium">
              {item.yearsOfExperience} năm
            </Text>
          </View>
        </View>
      </View>

      {/* Btn */}
      <Pressable
        className="bg-success/20 rounded-lg w-10 h-10 self-center items-center justify-center"
        onPress={onPressBtn}
      >
        <Ionicons name="checkmark" size={24} color={colors.success.DEFAULT} />
      </Pressable>
    </Pressable>
  );
};

export default CardCoach;
