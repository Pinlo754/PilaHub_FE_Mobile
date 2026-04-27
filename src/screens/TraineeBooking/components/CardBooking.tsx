import Ionicons from '@react-native-vector-icons/ionicons';
import { View, Text, Image, Pressable } from 'react-native';
import { colors } from '../../../theme/colors';
import Button from '../../../components/Button';
import { CoachBookingType } from '../../../utils/CoachBookingType';
import { BOOKING_UI_CONFIG } from '../../../constants/bookingTab';
import { getBookingStatusConfig } from '../../../utils/uiMapper';
import { formatDurationDateTime } from '../../../utils/day';
import { LiveSessionReportType } from '../../../utils/LiveSessionReportType';

type Props = {
  item: CoachBookingType;
  existingReport: LiveSessionReportType | null;
  onPressBtn: () => void;
  onPressCard: () => void;
  onPressRecord: () => void;
  onPressReport: () => void;
  onPressViewReport: () => void;
};

const CardBooking = ({
  item,
  existingReport,
  onPressBtn,
  onPressCard,
  onPressRecord,
  onPressReport,
  onPressViewReport,
}: Props) => {
  // VARIABLE
  const config = BOOKING_UI_CONFIG[item.status];
  const { bgColor, textColor, label } = getBookingStatusConfig(item.status);
  const { date, startTime, endTime } = formatDurationDateTime(
    item.startTime,
    item.endTime,
  );
  const bookingType =
    item.bookingType === 'SINGLE' ? 'Đặt lịch riêng' : 'Lịch trong lộ trình';

  const withinReportWindow = (() => {
    const start = new Date(item.startTime).getTime();
    const now = Date.now();
    const diffDays = (now - start) / (1000 * 60 * 60 * 24);
    return diffDays <= 7;
  })();

  const canReport =
    config.showReportButton && withinReportWindow && !existingReport;
  const showViewReport = !!existingReport && config.showReportButton;
  const showReportBtn = canReport || showViewReport;

  const showFooter = config.showButton || showReportBtn;

  return (
    <Pressable
      onPress={onPressCard}
      className={`mx-4 mb-4 px-4 pt-4 rounded-lg bg-white border border-background-sub1 shadow-lg elevation-lg ${config.showButton ? 'pb-2' : 'pb-4'}`}
      disabled={config.disablePressCard}
    >
      {/* Coach + Status */}
      <View className="flex-row justify-between items-start">
        <View className="flex-row items-center gap-2">
          {/* Image */}
          <View className="w-12 h-12 rounded-full overflow-hidden">
            <Image
              source={{
                uri: item.coach.avatarUrl,
              }}
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
            />
          </View>

          <View>
            {/* Name */}
            <Text className="color-foreground font-bold text-lg">
              {item.coach.fullName}
            </Text>

            {/* Rating */}
            <View className="flex-row items-center gap-1">
              <Ionicons name="star" size={16} color={colors.warning.DEFAULT} />
              <Text className="color-secondaryText font-medium">
                {item.coach.avgRating}
              </Text>
            </View>
          </View>
        </View>

        {/* Status */}
        <Text
          className={`rounded-full px-3 py-1 font-medium`}
          style={{ backgroundColor: bgColor, color: textColor }}
        >
          {label}
        </Text>
      </View>

      {/* Border */}
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

      {/* Button */}
      {showFooter && (
        <>
          <View
            pointerEvents="none"
            className="border-t border-background-sub1 absolute left-0 right-0 top-[155px]"
          />

          <View className="mt-6 -mx-2 gap-3">
            {/* Hàng 1: Video record + Xem đánh giá (chỉ COMPLETED) */}
            {item.status === 'COMPLETED' && (
              <View className="flex-row justify-between">
                <Button
                  text="Video record"
                  onPress={onPressRecord}
                  colorType="sub1"
                  rounded="xl"
                  showArrow={true}
                  width={config.buttonWidth}
                  height={40}
                />
                <Button
                  text={config.buttonText ?? 'Xem'}
                  onPress={onPressBtn}
                  colorType="sub1"
                  rounded="xl"
                  showArrow={true}
                  width={config.buttonWidth}
                  height={40}
                />
              </View>
            )}

            {/* Hàng 2: Báo cáo (căn phải) + button chính nếu không phải COMPLETED */}
            <View className="flex-row justify-between">
              {showViewReport && (
                <Button
                  text="Xem báo cáo"
                  onPress={onPressViewReport}
                  colorType="sub1"
                  rounded="xl"
                  showArrow={true}
                  width={config.buttonWidth}
                  height={40}
                />
              )}
              
              {canReport && (
                <Button
                  text="Báo cáo"
                  onPress={onPressReport}
                  colorType="red"
                  rounded="xl"
                  showArrow={true}
                  width={config.buttonWidth}
                  height={40}
                />
              )}

              {config.showButton && item.status !== 'COMPLETED' && (
                <View className="ml-auto">
                  <Button
                    text={config.buttonText ?? 'Xem'}
                    onPress={onPressBtn}
                    colorType="sub1"
                    rounded="xl"
                    showArrow={true}
                    width={config.buttonWidth}
                    height={40}
                  />
                </View>
              )}
            </View>
          </View>
        </>
      )}
    </Pressable>
  );
};

export default CardBooking;
