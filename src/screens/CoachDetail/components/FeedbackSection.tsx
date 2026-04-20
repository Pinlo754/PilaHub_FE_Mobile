import Ionicons from '@react-native-vector-icons/ionicons';
import { Pressable, Text, View } from 'react-native';
import { colors } from '../../../theme/colors';
import CardFeedback from './CardFeedback';
import { CoachFeedbackType } from '../../../utils/CoachFeedbackType';

type Props = {
  feedbackData: CoachFeedbackType[];
};

const FeedbackSection = ({ feedbackData }: Props) => {
  // CONSTANTS
  const PREVIEW_COUNT = 3;

  return (
    <View className="w-full mt-4 pb-6">
      {/* Header */}
      <Pressable className="flex-row items-center gap-2 mb-2">
        <Text className="text-lg font-semibold color-foreground">Đánh giá</Text>

        <Ionicons
          name="chevron-forward-outline"
          size={20}
          color={colors.foreground}
        />
      </Pressable>
      {/* Feedback List */}
      {feedbackData.length > 0 ? (
        feedbackData
          .slice(0, PREVIEW_COUNT)
          .map(item => <CardFeedback item={item} key={item.feedbackId} />)
      ) : (
        <View className="flex-col items-center mt-8">
          <Ionicons
            name="alert-circle-outline"
            size={30}
            color={colors.inactive[50]}
          />
          <Text className="color-inactive-darker/50 font-medium">
            Chưa có đánh giá từ học viên.
          </Text>
        </View>
      )}
    </View>
  );
};

export default FeedbackSection;
