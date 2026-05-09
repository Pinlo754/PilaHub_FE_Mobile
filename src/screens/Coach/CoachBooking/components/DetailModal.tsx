import Ionicons from '@react-native-vector-icons/ionicons';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { colors } from '../../../../theme/colors';
import { LiveSessionType } from '../../../../utils/LiveSessionType';
import dayjs from 'dayjs';

type Props = {
  visible: boolean;
  onClose: () => void;
  liveSessionDetail: LiveSessionType;
};

const DetailModal = ({ visible, onClose, liveSessionDetail }: Props) => {
  const booking = liveSessionDetail.coachBooking;

  const start = dayjs(booking.startTime).format('HH:mm DD/MM/YYYY');
  const end = dayjs(booking.endTime).format('HH:mm DD/MM/YYYY');

  const duration = dayjs(booking.endTime).diff(
    dayjs(booking.startTime),
    'hour',
    true,
  );

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
          <View className="rounded-t-3xl overflow-hidden bg-white pb-6 max-h-[80%]">
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
              className="p-4"
              showsVerticalScrollIndicator={false}
            >
               {/* Session Info */}
              <View className="mb-5">
                <Text className="text-sm font-bold mb-3 pb-2 border-b border-foreground">
                  Thông tin buổi học
                </Text>

                <View className="py-3 border-b border-gray-200">
                  <Text className="text-xs text-gray-500 mb-1">HLV</Text>
                  <Text className="text-base font-semibold">
                    {booking.coach.fullName}
                  </Text>
                </View>

                <View className="py-3 border-b border-gray-200">
                  <Text className="text-xs text-gray-500 mb-1">Bắt đầu</Text>
                  <Text className="text-base font-semibold">{start}</Text>
                </View>

                <View className="py-3 border-b border-gray-200">
                  <Text className="text-xs text-gray-500 mb-1">Kết thúc</Text>
                  <Text className="text-base font-semibold">{end}</Text>
                </View>

                <View className="py-3">
                  <Text className="text-xs text-gray-500 mb-1">Thời lượng</Text>
                  <Text className="text-base font-semibold">
                    {duration} giờ
                  </Text>
                </View>
              </View>

              {/* Booking Info */}
              <View className="">
                <Text className="text-sm font-bold mb-3 pb-2 border-b border-foreground">
                  Thông tin thanh toán
                </Text>

                <View className="py-3 border-b border-gray-200">
                  <Text className="text-xs text-gray-500 mb-1">
                    Giá mỗi giờ
                  </Text>
                  <Text className="text-base font-semibold">
                    {booking.pricePerHour.toLocaleString()} đ
                  </Text>
                </View>

                <View className="py-3">
                  <Text className="text-xs text-gray-500 mb-1">
                    Tổng tiền
                  </Text>
                  <Text className="text-base font-semibold">
                    {booking.totalAmount.toLocaleString()} đ
                  </Text>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default DetailModal;
