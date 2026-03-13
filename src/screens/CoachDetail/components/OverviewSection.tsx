import { Text, View } from 'react-native';
import { CoachType } from '../../../utils/CoachType';
import InfoSection from './InfoSection';
import FeedbackSection from './FeedbackSection';

type Props = {
  coachDetail: CoachType;
};

const OverviewSection = ({ coachDetail }: Props) => {
  return (
    <View className="mt-24 px-4 w-full">
      {/* Desctiption */}
      <Text className="color-foreground font-medium">
        {coachDetail.bio}
      </Text>

      {/* Border */}
      <View className="h-px bg-background-sub1 mt-4 mb-2" />

      {/* Specialties */}
      <InfoSection
        icon="golf-outline"
        title="Lĩnh vực"
        data={coachDetail.specialization}
      />

      {/* Certifications */}
      <InfoSection
        icon="receipt-outline"
        title="Chứng chỉ"
        data={coachDetail.certificationsUrl}
      />

      {/* Border */}
      <View className="h-px bg-background-sub1 mt-2 mb-4" />

      {/* Feedback Section */}
      <FeedbackSection />
    </View>
  );
};

export default OverviewSection;
