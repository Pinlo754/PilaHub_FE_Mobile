import { Text, View } from 'react-native';
import { CoachType } from '../../../utils/CoachType';
import InfoSection from './InfoSection';
import FeedbackSection from './FeedbackSection';
import { CoachFeedbackType } from '../../../utils/CoachFeedbackType';
import { formatShortVND } from '../../../utils/number';
import Ionicons from '@react-native-vector-icons/ionicons';
import { colors } from '../../../theme/colors';

type Props = {
  coachDetail: CoachType;
  coachFeedbacks: CoachFeedbackType[];
};

const OverviewSection = ({ coachDetail, coachFeedbacks }: Props) => {
  return (
    <View className="mt-10 px-4 w-full">
      {/* Desctiption */}
      <Text className="color-foreground font-medium">{coachDetail.bio}</Text>

      {/* Border */}
      <View className="h-px bg-background-sub1 mt-4 mb-2" />

      {/* Price */}
      <View className=" mt-2 ">
        <View className="flex-row items-center gap-2">
          <Ionicons name="card-outline" size={20} color={colors.foreground} />
          <Text className="color-foreground font-semibold">Giá</Text>
        </View>

        <View className="flex-row items-start gap-1 pl-3 mb-2">
          <View className="pt-[3px]">
            <Ionicons
              name="checkmark-outline"
              size={12}
              color={colors.foreground}
            />
          </View>
          <Text className="color-secondaryText text-sm font-medium">
            {formatShortVND(coachDetail.pricePerHour)}/1h
          </Text>
        </View>
      </View>

      {/* Specialties */}
      <InfoSection
        icon="golf-outline"
        title="Lĩnh vực"
        data={coachDetail.specialization?.split(',').map(i => i.trim()) || []}
      />

      {/* Certifications */}
      <InfoSection
        icon="receipt-outline"
        title="Chứng chỉ"
        data={
          coachDetail.certificationsUrl ? [coachDetail.certificationsUrl] : []
        }
      />

      {/* Border */}
      <View className="h-px bg-background-sub1 mt-2 mb-4" />

      {/* Feedback Section */}
      <FeedbackSection feedbackData={coachFeedbacks} />
    </View>
  );
};

export default OverviewSection;
