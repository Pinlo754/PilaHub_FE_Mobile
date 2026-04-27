import Ionicons from '@react-native-vector-icons/ionicons';
import { View, Text, Image } from 'react-native';
import { colors } from '../../../theme/colors';
import { CoachType } from '../../../utils/CoachType';
import { formatShortVND } from '../../../utils/number';

type Props = {
  coach: CoachType;
};

const CoachDetail = ({ coach }: Props) => {
  return (
    <View className="m-4">
      {/* Title */}
      <View className="w-full rounded-full px-3 py-2 bg-background-sub1 flex-row gap-1 items-center">
        <Ionicons
          name="information-circle-outline"
          size={22}
          color={colors.foreground}
        />
        <Text className="color-foreground font-medium">Thông tin HLV</Text>
      </View>

      {/* Coach Detail */}
      <View
        className={`border-t border-background-sub2 flex-row gap-4 py-3 px-4`}
      >
        {/* Image */}
        <View className="rounded-full w-16 h-16 overflow-hidden">
          <Image
            source={{
              uri: coach.avatarUrl,
            }}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
          />
        </View>

        {/* Info */}
        <View className="flex-grow">
          {/* Name */}
          <Text className="font-bold color-foreground text-lg">
            {coach.fullName}
          </Text>
          {/* Rate */}
          <View className="flex-row gap-6">
            <View className="flex-row gap-2 coachs-center">
              <Ionicons name="star" size={18} color={colors.warning.DEFAULT} />
              <Text className="color-secondaryText font-medium">
                {coach.avgRating}
              </Text>
            </View>
            {/* Experience year */}
            <View className="flex-row gap-2 coachs-center">
              <Ionicons name="ribbon" size={18} color={colors.info.darker} />
              <Text className="color-secondaryText font-medium">
                {coach.yearsOfExperience} năm
              </Text>
            </View>
            {/* Price */}
            <View className="flex-row gap-2 items-center">
              <Ionicons name="card" size={18} color={colors.success.DEFAULT} />
              <Text className="color-secondaryText font-medium">
                {formatShortVND(coach.pricePerHour)}/1h
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

export default CoachDetail;
