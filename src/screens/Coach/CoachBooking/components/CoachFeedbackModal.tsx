import Ionicons from '@react-native-vector-icons/ionicons';
import { Modal, Pressable, Text, View } from 'react-native';
import { colors } from '../../../../theme/colors';
import { CoachFeedbackType } from '../../../../utils/CoachFeedbackType';

type Props = {
  visible: boolean;
  onClose: () => void;
  feedback: CoachFeedbackType | null;
};

const CoachFeedbackModal = ({ visible, onClose, feedback }: Props) => {
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
              Đánh giá từ học viên
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
          {feedback ? (
            <View className="px-4 pt-4">
              {/* Rating */}
              <View className="flex-row justify-center items-baseline gap-1 pb-2">
                <Text className="color-foreground font-bold text-5xl">
                  {feedback.rating}
                </Text>
                <Text className="color-secondaryText font-medium text-base">
                  / 10
                </Text>
              </View>
              <Text className="color-secondaryText text-sm text-center mb-4">
                Điểm đánh giá
              </Text>

              {/* Divider */}
              <View className="border-b border-background-sub1 mb-4" />

              {/* Trainee */}
              <View className="mb-3">
                <Text className="text-xs text-gray-500 mb-1">Học viên</Text>
                <Text className="color-foreground font-semibold text-base">
                  {feedback.traineeFullName}
                </Text>
              </View>

              {/* Comment */}
              {!!feedback.comment && (
                <View>
                  <Text className="text-xs text-gray-500 mb-1">Nhận xét</Text>
                  <Text className="color-foreground text-base">
                    {feedback.comment}
                  </Text>
                </View>
              )}
            </View>
          ) : (
            <View className="p-6 items-center">
              <Text className="color-secondaryText font-medium text-center">
                Chưa có đánh giá từ học viên!
              </Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

export default CoachFeedbackModal;