import React from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { colors } from '../../../theme/colors';
import dayjs from 'dayjs';
import {
  LIVESESSION_OPTIONS,
  ReportReason,
} from '../../../constants/reportOption';
import { ReportWithSession } from './useReportList';

type Props = {
  visible: boolean;
  onClose: () => void;
  item: ReportWithSession;
};

type RowProps = {
  label: string;
  value: string;
};

const Row = ({ label, value }: RowProps) => (
  <View className="py-3 border-b border-gray-200">
    <Text className="text-xs text-gray-500 mb-1">{label}</Text>
    <Text className="text-base font-semibold">{value}</Text>
  </View>
);

const DetailModal = ({ visible, onClose, item }: Props) => {
  const { report, liveSession } = item;

  const isResolved =
    report.resolvedAt !== null ||
    report.resolvedBy !== null ||
    report.internalNote !== null;

  const getReasonLabel = (reason: ReportReason) =>
    LIVESESSION_OPTIONS.find(o => o.value === reason)?.label ?? reason;

  const booking = liveSession?.coachBooking;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View className="flex-1">
        <Pressable className="absolute inset-0" onPress={onClose} />

        <View className="flex-1 justify-end">
          <View className="rounded-t-3xl overflow-hidden bg-white pb-6 max-h-[80%]">
            {/* Header */}
            <View className="bg-background-sub1 py-5">
              <Text className="font-semibold text-foreground text-2xl text-center">
                Chi tiết báo cáo
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

            <ScrollView className="p-4" showsVerticalScrollIndicator={false}>
              {/* Status badge */}
              <View className="items-start mb-4">
                <View
                  className={`px-3 py-1 rounded-full ${isResolved ? 'bg-success-20' : 'bg-warning-20'}`}
                >
                  <Text
                    numberOfLines={1}
                    className={`text-sm font-semibold ${isResolved ? 'text-success' : 'text-warning'}`}
                  >
                    {isResolved ? 'Đã xử lý' : 'Đang xử lý'}
                  </Text>
                </View>
              </View>

              {/* Live Session info */}
              {liveSession && booking && (
                <View className="mb-5">
                  <Text className="text-sm font-bold mb-3 pb-2 border-b border-foreground">
                    Thông tin buổi tập
                  </Text>

                  {booking.coach?.fullName && (
                    <Row
                      label="Huấn luyện viên"
                      value={booking.coach.fullName}
                    />
                  )}

                  {booking.startTime && (
                    <Row
                      label="Thời gian bắt đầu"
                      value={dayjs(booking.startTime).format(
                        'HH:mm DD/MM/YYYY',
                      )}
                    />
                  )}

                  {booking.endTime && (
                    <Row
                      label="Thời gian kết thúc"
                      value={dayjs(booking.endTime).format('HH:mm DD/MM/YYYY')}
                    />
                  )}

                  {liveSession.ratingByTrainee !== null && (
                    <Row
                      label="Đánh giá của học viên"
                      value={`${liveSession.ratingByTrainee} / 5`}
                    />
                  )}

                  {liveSession.commentByCoach && (
                    <Row
                      label="Nhận xét của HLV"
                      value={liveSession.commentByCoach}
                    />
                  )}
                </View>
              )}

              {/* Report info */}
              <View className="mb-5">
                <Text className="text-sm font-bold mb-3 pb-2 border-b border-foreground">
                  Thông tin báo cáo
                </Text>

                <Row label="Lý do" value={getReasonLabel(report.reason)} />
                <Row
                  label="Mô tả"
                  value={report.description || 'Không có mô tả'}
                />
                <Row
                  label="Ngày tạo"
                  value={dayjs(report.createdAt).format('HH:mm DD/MM/YYYY')}
                />
              </View>

              {/* Resolve info */}
              {isResolved && (
                <View>
                  <Text className="text-sm font-bold mb-3 pb-2 border-b border-foreground">
                    Thông tin xử lý
                  </Text>

                  {report.resolvedAt && (
                    <Row
                      label="Ngày xử lý"
                      value={dayjs(report.resolvedAt).format(
                        'HH:mm DD/MM/YYYY',
                      )}
                    />
                  )}

                  {report.internalNote && (
                    <Row label="Ghi chú" value={report.internalNote} />
                  )}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default DetailModal;
