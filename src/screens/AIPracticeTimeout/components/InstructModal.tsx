import Ionicons from '@react-native-vector-icons/ionicons';
import { Modal, Pressable, Text, View, Image } from 'react-native';
import { colors } from '../../../theme/colors';

type Props = {
  visible: boolean;
  onClose: () => void;
};

const InstructModal = ({ visible, onClose }: Props) => {
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
                Hướng dẫn
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
            <View className="p-4 min-h-[140px]">
              <Text className="color-inactive-darker/80 font-medium">
                Vui lòng đặt Camera ở khoảng cách 2M và quay được toàn bộ cơ thể.
              </Text>
            </View>

            <Image
              source={require('../../../assets/huong_dan_camera.png')}
              style={{ width: '100%', height: '40%' }}
              resizeMode="contain"
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default InstructModal;
