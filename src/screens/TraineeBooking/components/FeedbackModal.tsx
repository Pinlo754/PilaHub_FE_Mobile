import Ionicons from '@react-native-vector-icons/ionicons';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { colors } from '../../../theme/colors';

type Props = {
  visible: boolean;
  onClose: () => void;
  comment: string;
};

const FeedbackModal = ({ visible, onClose, comment }: Props) => {
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
            <ScrollView
              className="p-4"
              contentContainerStyle={{ paddingBottom: 10 }}
              showsVerticalScrollIndicator={false}
            >
              <Text className="color-foreground font-medium">{comment}</Text>
            </ScrollView>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default FeedbackModal;
