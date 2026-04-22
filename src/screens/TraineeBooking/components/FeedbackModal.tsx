import Ionicons from '@react-native-vector-icons/ionicons';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { colors } from '../../../theme/colors';
import { SessionAssessmentType } from '../../../utils/SessionAssessmentType';
import { getAverageAssessmentScore } from '../../../utils/calculate';

type Props = {
  visible: boolean;
  onClose: () => void;
  assessment: SessionAssessmentType | null;
};

const FeedbackModal = ({ visible, onClose, assessment }: Props) => {
  const avgScore = getAverageAssessmentScore(assessment);

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      statusBarTranslucent
    >
      <View className="flex-1 justify-center items-center">
        {/* Overlay */}
        <Pressable className="absolute inset-0 bg-black/40" onPress={onClose} />

        {/* Modal */}
        <View
          className="rounded-3xl overflow-hidden bg-white pb-6"
          style={{ width: 350 }}
        >
          {/* Header */}
          <View className="bg-background-sub1 py-5">
            <Text className="font-semibold color-foreground text-2xl text-center">
              Đánh giá từ HLV
            </Text>

            <Pressable onPress={onClose} className="absolute right-3 top-3">
              <Ionicons
                name="close-outline"
                size={26}
                color={colors.inactive[80]}
              />
            </Pressable>
          </View>

          {/* Content */}
          <View style={{ maxHeight: 300 }}>
            {assessment ? (
              <>
                {/* Average Score */}
                <View className="flex-row justify-center items-baseline gap-1 pt-4 pb-2">
                  <Text className="color-foreground font-bold text-4xl">
                    {avgScore}
                  </Text>
                  <Text className="color-secondaryText font-medium text-base">
                    / 10
                  </Text>
                </View>
                <Text className="color-secondaryText text-sm text-center mb-2">
                  Điểm trung bình
                </Text>

                {/* Divider */}
                <View className="mt-2 mx-4 border-b border-background-sub1" />

                <ScrollView
                  className="px-4 pb-4"
                  contentContainerStyle={{ paddingBottom: 10 }}
                  showsVerticalScrollIndicator={false}
                >
                  {assessment.results.map(result => (
                    <View
                      key={result.criterionId}
                      className="flex-row justify-between items-center py-3 border-b border-background-sub1"
                    >
                      <Text
                        className="color-foreground font-medium flex-1 mr-3"
                        numberOfLines={2}
                      >
                        {result.criterionName}
                      </Text>
                      <View className="bg-background-sub2 rounded-lg px-3 py-1 min-w-12 items-center">
                        <Text className="color-foreground font-bold text-base">
                          {result.score}
                          <Text className="text-xs font-normal color-secondaryText">
                            /10
                          </Text>
                        </Text>
                      </View>
                    </View>
                  ))}
                </ScrollView>
              </>
            ) : (
              <View className="p-6 items-center">
                <Text className="color-secondaryText font-medium text-center">
                  Chưa có đánh giá từ HLV!
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default FeedbackModal;
