import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import RoadmapApi from '../../hooks/roadmap.api';
import ModalPopup from '../../components/ModalPopup';

const SentRequestDetail: React.FC = () => {
  const route: any = useRoute();
  const nav: any = useNavigation();
  const request = route?.params?.request ?? {};
  const [cancelling, setCancelling] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-warning';
      case 'ACCEPTED': return 'bg-success';
      case 'REJECTED': return 'bg-danger';
      case 'CANCELLED': return 'bg-inactive-darker';
      default: return 'bg-inactive-darker';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING': return 'Chờ xử lý';
      case 'ACCEPTED': return 'Chấp nhận';
      case 'REJECTED': return 'Từ chối';
      case 'CANCELLED': return 'Huỷ';
      default: return status;
    }
  };

  const getDayLabel = (day: string) => {
    const dayMap: { [key: string]: string } = {
      'MONDAY': 'Thứ 2',
      'TUESDAY': 'Thứ 3',
      'WEDNESDAY': 'Thứ 4',
      'THURSDAY': 'Thứ 5',
      'FRIDAY': 'Thứ 6',
      'SATURDAY': 'Thứ 7',
      'SUNDAY': 'Chủ nhật',
    };
    return dayMap[day] || day;
  };

  const getWorkoutLevelLabel = (level: string) => {
    const levelMap: { [key: string]: string } = {
      'BEGINNER': 'Người mới bắt đầu',
      'INTERMEDIATE': 'Trung bình',
      'ADVANCED': 'Nâng cao',
    };
    return levelMap[level] || level;
  };

  const handleCancel = () => {
    setShowConfirmModal(true);
  };

  const handleConfirmCancel = async () => {
    setShowConfirmModal(false);
    setCancelling(true);
    try {
      await RoadmapApi.cancelCoachRequest(request.requestId);
      setShowSuccessModal(true);
    } catch (e) {
      console.warn('cancel failed', e);
      setShowErrorModal(true);
    } finally {
      setCancelling(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center px-4 py-3 border-b border-background-sub1 bg-background-sub1">
        <TouchableOpacity onPress={() => nav.goBack()} className="w-10 h-10 items-center justify-center">
          <Ionicons name="arrow-back" size={24} color="#A0522D" />
        </TouchableOpacity>
        <Text className="flex-1 text-center font-bold text-lg text-foreground">Chi tiết yêu cầu</Text>
        <View className="w-10" />
      </View>

      <ScrollView className="flex-1 px-4 py-3">
        {/* Coach Info Card */}
        {request.coachFullName && (
          <View className="bg-white rounded-lg p-4 mb-4 border border-background-sub1 shadow-sm flex-row items-center">
            {request.coachId && (
              <View className="w-12 h-12 rounded-full bg-info-lighter items-center justify-center mr-3">
                <Ionicons name="person-circle-outline" size={24} color="#3B82F6" />
              </View>
            )}
            <View className="flex-1">
              <Text className="text-xs font-semibold text-secondaryText uppercase">Huấn luyện viên</Text>
              <Text className="font-bold text-base text-foreground">{request.coachFullName}</Text>
            </View>
          </View>
        )}
        {/* Status Card */}
        <View className="bg-white rounded-lg p-4 mb-4 border border-background-sub1 shadow-sm">
          <Text className="text-xs font-semibold text-secondaryText uppercase mb-2">Trạng thái</Text>
          <View className={`px-3 py-2 rounded-full w-32 items-center ${getStatusColor(request.status)}`}>
            <Text className="text-sm font-bold text-white">{getStatusLabel(request.status)}</Text>
          </View>
        </View>

        {/* Goal & Duration */}
        <View className="bg-white rounded-lg p-4 mb-4 border border-background-sub1 shadow-sm">
          <View className="flex-row justify-between items-start mb-3">
            <View className="flex-1">
              <Text className="text-xs font-semibold text-secondaryText uppercase mb-1">Mục tiêu chính</Text>
              <Text className="font-bold text-base text-foreground">{request.primaryGoalName || '-'}</Text>
            </View>
          </View>
          <View className="border-t border-background-sub1 pt-3">
            <Text className="text-xs font-semibold text-secondaryText uppercase mb-1">Thời gian</Text>
            <Text className="font-semibold text-base text-foreground">{request.durationWeeks || 0} tuần</Text>
          </View>
          {request.secondaryGoalNames && request.secondaryGoalNames.length > 0 && (
            <View className="border-t border-background-sub1 pt-3 mt-3">
              <Text className="text-xs font-semibold text-secondaryText uppercase mb-1">Mục tiêu phụ</Text>
              <View className="flex-row flex-wrap gap-2 mt-2">
                {request.secondaryGoalNames.map((goal: string, idx: number) => (
                  <View key={idx} className="bg-orange-20 px-2 py-1 rounded-full">
                    <Text className="text-xs font-semibold text-orange">{goal}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
          {request.workoutLevel && (
            <View className="border-t border-background-sub1 pt-3 mt-3">
              <Text className="text-xs font-semibold text-secondaryText uppercase mb-1">Mức độ tập luyện</Text>
              <Text className="font-semibold text-base text-foreground">{getWorkoutLevelLabel(request.workoutLevel)}</Text>
            </View>
          )}
        </View>

        {/* Training Days */}
        {request.trainingDays && request.trainingDays.length > 0 && (
          <View className="bg-white rounded-lg p-4 mb-4 border border-background-sub1 shadow-sm">
            <Text className="text-xs font-semibold text-secondaryText uppercase mb-3">Lịch tập</Text>
            
            {/* Table Header */}
            <View className="flex-row border-b-2 border-background-sub1 pb-2 mb-2">
              <Text className="flex-1 font-bold text-sm text-foreground">Ngày</Text>
              <Text className="flex-1 font-bold text-sm text-foreground text-right">Giờ bắt đầu</Text>
            </View>

            {/* Table Rows */}
            {request.trainingDays.map((day: string, idx: number) => {
              const schedule = request.trainingDaySchedules?.find((s: any) => s.dayOfWeek === day);
              return (
                <View key={idx} className="flex-row py-3 border-b border-background-sub1 items-center">
                  <Text className="flex-1 text-base text-foreground">{getDayLabel(day)}</Text>
                  <Text className="flex-1 text-base text-secondaryText text-right font-semibold">
                    {schedule?.startTime || '-'}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Message */}
        {request.traineeMessage && (
          <View className="bg-white rounded-lg p-4 mb-4 border border-background-sub1 shadow-sm">
            <Text className="text-xs font-semibold text-secondaryText uppercase mb-2">Tin nhắn từ học viên</Text>
            <Text className="text-sm text-foreground leading-6">{request.traineeMessage}</Text>
          </View>
        )}

        {/* Coach Note */}
        {request.coachNote && (
          <View className="bg-background-sub2 rounded-lg p-4 mb-4 border border-background-sub1">
            <Text className="text-xs font-semibold text-secondaryText uppercase mb-2">Ghi chú từ huấn luyện viên</Text>
            <Text className="text-sm text-foreground leading-6">{request.coachNote}</Text>
          </View>
        )}

        {/* Created Date */}
        <View className="bg-white rounded-lg p-4 mb-4 border border-background-sub1 shadow-sm">
          <Text className="text-xs font-semibold text-secondaryText uppercase mb-1">Ngày gửi</Text>
          <Text className="text-sm text-foreground">
            {request.createdAt ? new Date(request.createdAt).toLocaleString('vi-VN') : '-'}
          </Text>
        </View>

        {/* Cancel Button for PENDING */}
        {request.status === 'PENDING' && (
          <TouchableOpacity
            onPress={handleCancel}
            disabled={cancelling}
            className="bg-danger px-4 py-3 rounded-lg items-center mb-6 active:opacity-80"
          >
            {cancelling ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Ionicons name="trash-bin-outline" size={18} color="white" />
                <Text className="text-white font-bold text-base mt-1">Huỷ yêu cầu</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Confirm Cancel Modal */}
      <ModalPopup
        visible={showConfirmModal}
        mode="confirm"
        titleText="Huỷ yêu cầu"
        contentText="Bạn có chắc muốn huỷ yêu cầu này?"
        confirmBtnText="Có, huỷ"
        confirmBtnColor="red"
        cancelBtnText="Không"
        onConfirm={handleConfirmCancel}
        onCancel={() => setShowConfirmModal(false)}
        onClose={() => setShowConfirmModal(false)}
      />

      {/* Success Modal */}
      <ModalPopup
        visible={showSuccessModal}
        mode="noti"
        titleText="Thành công"
        contentText="Yêu cầu đã được huỷ"
        iconName="checkmark-circle-outline"
        iconBgColor="green"
        confirmBtnText="OK"
        onConfirm={() => {
          setShowSuccessModal(false);
          nav.goBack();
        }}
        onClose={() => {
          setShowSuccessModal(false);
          nav.goBack();
        }}
      />

      {/* Error Modal */}
      <ModalPopup
        visible={showErrorModal}
        mode="noti"
        titleText="Lỗi"
        contentText="Không thể huỷ yêu cầu"
        iconName="alert-circle-outline"
        iconBgColor="red"
        confirmBtnText="OK"
        onConfirm={() => setShowErrorModal(false)}
        onClose={() => setShowErrorModal(false)}
      />
    </SafeAreaView>
  );
};

export default SentRequestDetail;
