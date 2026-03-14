import Ionicons from '@react-native-vector-icons/ionicons';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { colors } from '../../../theme/colors';

type Props = {
  visible: boolean;
  onClose: () => void;
};

const DetailModal = ({ visible, onClose }: Props) => {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="slide"
      statusBarTranslucent
    >
      <View className="flex-1">
        {/* Overlay */}
        <Pressable className="absolute inset-0" onPress={onClose} />

        {/* Sheet */}
        <View className="flex-1 justify-end">
          <View className="rounded-t-3xl overflow-hidden bg-white pb-6">
            {/* Header */}
            <View className="bg-background-sub1 py-5">
              <Text className="font-semibold color-foreground text-2xl text-center">
                Chi tiết
              </Text>

              <Pressable
                onPress={onClose}
                className="absolute right-3 top-3 z-10"
              >
                <Ionicons
                  name="close-outline"
                  size={26}
                  color={colors.inactive[80]}
                />
              </Pressable>
            </View>

            {/* Content */}
            <ScrollView
              className="p-4 min-h-[140px] max-h-[300px]"
              showsVerticalScrollIndicator={false}
            >
              <Text className="color-inactive-darker/80 font-medium">
                Hướng dẫn đặt camera...
              </Text>
            </ScrollView>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default DetailModal;
