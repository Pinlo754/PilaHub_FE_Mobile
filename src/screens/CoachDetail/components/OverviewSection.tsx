import { Text, View } from 'react-native';
import { CoachType } from '../../../utils/CoachType';
import InfoSection from './InfoSection';
import FeedbackSection from './FeedbackSection';
import { CoachFeedbackType } from '../../../utils/CoachFeedbackType';

type Props = {
  coachDetail: CoachType;
  coachFeedbacks: CoachFeedbackType[];
};

const OverviewSection = ({ coachDetail, coachFeedbacks }: Props) => {
  return (
    <View className="mt-24 px-4 w-full">
      {/* Desctiption */}
      <Text className="color-foreground font-medium">{coachDetail.bio}</Text>

      {/* Border */}
      <View className="h-px bg-background-sub1 mt-4 mb-2" />

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
