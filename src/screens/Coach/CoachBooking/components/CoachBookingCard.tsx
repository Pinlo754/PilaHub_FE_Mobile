import Ionicons from '@react-native-vector-icons/ionicons';
import { View, Text, Image, Pressable } from 'react-native';
import { colors } from '../../../../theme/colors';
import Button from '../../../../components/Button';
import { CoachBookingType } from '../../../../utils/CoachBookingType';
import { getBookingStatusConfig } from '../../../../utils/uiMapper';
import { formatDurationDateTime } from '../../../../utils/day';
import { LiveSessionReportType } from '../../../../utils/LiveSessionReportType';

type Props = {
  item: CoachBookingType;
  existingReport: LiveSessionReportType | null;
  onPressCard: () => void;
  onPressRecord: () => void;
  onPressFeedback: () => void;
  onPressViewReport: () => void;
};

const BUTTON_WIDTH = 160;

const CoachBookingCard = ({
  item,
  existingReport,
  onPressCard,
  onPressRecord,
  onPressFeedback,
  onPressViewReport,
}: Props) => {
  const { bgColor, textColor, label } = getBookingStatusConfig(item.status);
  const { date, startTime, endTime } = formatDurationDateTime(
    item.startTime,
    item.endTime,
  );
  const bookingType =
    item.bookingType === 'SINGLE' ? 'Đặt lịch riêng' : 'Lịch trong lộ trình';

  const isCompleted = item.status === 'COMPLETED';

  return (
    <Pressable
      onPress={onPressCard}
      className="mx-4 mb-4 px-4 pt-4 pb-2 rounded-lg bg-white border border-background-sub1 shadow-lg elevation-lg"
    >
      {/* Trainee + Status */}
      <View className="flex-row justify-between items-start">
        <View className="flex-row items-center gap-2">
          {/* Avatar */}
          <View className="w-12 h-12 rounded-full overflow-hidden">
            <Image
              source={{ uri: item.trainee.avatarUrl ?? undefined }}
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
            />
          </View>

          <View>
            {/* Name */}
            <Text className="color-foreground font-bold text-lg">
              {item.trainee.fullName}
            </Text>

            {/* Age + Gender */}
            <Text className="color-secondaryText font-medium text-sm">
              {item.trainee.age} tuổi ·{' '}
              {item.trainee.gender === 'FEMALE' ? 'Nữ' : 'Nam'}
            </Text>
          </View>
        </View>

        {/* Status badge */}
        <Text
          className="rounded-full px-3 py-1 font-medium"
          style={{ backgroundColor: bgColor, color: textColor }}
        >
          {label}
        </Text>
      </View>

      {/* Divider */}
      <View className="border-t border-background-sub1 absolute left-0 right-0 top-[70px]" />

      {/* Detail */}
      <View className="mt-8">
        {/* Date + Time */}
        <View className="flex-row gap-20 items-center">
          <View className="flex-row items-center gap-1">
            <Ionicons
              name="calendar-outline"
              size={22}
              color={colors.foreground}
            />
            <Text className="color-foreground font-semibold">{date}</Text>
          </View>

          <View className="flex-row items-center gap-1">
            <Ionicons name="time-outline" size={22} color={colors.foreground} />
            <Text className="color-foreground font-semibold">
              {startTime} - {endTime}
            </Text>
          </View>
        </View>

        {/* Booking Type */}
        <View className="flex-row items-center gap-1 mt-2">
          <Ionicons
            name="information-circle-outline"
            size={24}
            color={colors.foreground}
          />
          <Text className="color-secondaryText">
            Loại:{' '}
            <Text className="color-foreground font-semibold">
              {bookingType}
            </Text>
          </Text>
        </View>
      </View>

      {/* Footer Buttons */}
      <>
        <View
          pointerEvents="none"
          className="border-t border-background-sub1 absolute left-0 right-0 top-[155px]"
        />

        <View className="mt-6 -mx-2 gap-3">
          {/* Hàng 1: Video record + Xem đánh giá (chỉ COMPLETED) */}
          {isCompleted && (
            <View className="flex-row justify-between">
              <Button
                text="Video record"
                onPress={onPressRecord}
                colorType="sub1"
                rounded="xl"
                showArrow={true}
                width={BUTTON_WIDTH}
                height={40}
              />
              <Button
                text="Xem đánh giá"
                onPress={onPressFeedback}
                colorType="sub1"
                rounded="xl"
                showArrow={true}
                width={BUTTON_WIDTH}
                height={40}
              />
            </View>
          )}

          {/* Hàng 2: Xem báo cáo (nếu có) */}
          {existingReport && (
            <View className="flex-row justify-start">
              <Button
                text="Xem báo cáo"
                onPress={onPressViewReport}
                colorType="sub1"
                rounded="xl"
                showArrow={true}
                width={BUTTON_WIDTH}
                height={40}
              />
            </View>
          )}
        </View>
      </>
    </Pressable>
  );
};

export default CoachBookingCard;