import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';

interface RoadmapConfirmModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
  totalAmount: number;
  totalSessions: number;
  firstDate: string | null;
  lastDate: string | null;
  daysOfWeek: string;
}

const RoadmapConfirmModal: React.FC<RoadmapConfirmModalProps> = ({
  visible,
  onClose,
  onConfirm,
  loading,
  totalAmount,
  totalSessions,
  firstDate,
  lastDate,
  daysOfWeek,
}) => {
  if (!visible) return null;

  return (
    <View className="absolute top-0 left-0 right-0 bottom-0 bg-black/50 justify-center items-center px-5 z-[999]">
      <View className="bg-white rounded-2xl p-5 w-full max-w-[400px]">
        <Text className="text-xl font-extrabold text-center mb-4 text-[#3A2A1A]">
          Xác nhận lộ trình
        </Text>
        
        <Text className="text-base mb-2.5 text-[#3A2A1A]">
          💰 Giá: <Text className="font-bold text-[#8B4513]">{totalAmount.toLocaleString()} VNĐ</Text>
        </Text>
        
        <Text className="text-base mb-2.5 text-[#3A2A1A]">
          📊 Tổng số buổi: <Text className="font-bold text-[#8B4513]">{totalSessions} buổi</Text>
        </Text>

        {firstDate && lastDate && (
          <Text className="text-base mb-2.5 text-[#3A2A1A]">
            📅 Thời gian: {firstDate} - {lastDate}
          </Text>
        )}

        {daysOfWeek ? (
          <Text className="text-base mb-2.5 text-[#3A2A1A]">
            📆 Lịch học: {daysOfWeek}
          </Text>
        ) : null}

        <View className="flex-row justify-between mt-5 gap-3">
          <TouchableOpacity
            onPress={onClose}
            className="flex-1 py-3 bg-[#f3f4f6] rounded-lg items-center"
            disabled={loading}
            activeOpacity={0.85}
          >
            <Text className="text-[#6B6B6B] font-bold">Huỷ</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onConfirm}
            className="flex-1 py-3 bg-[#8B4513] rounded-lg items-center justify-center"
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Text className="text-base text-white font-bold">Xác nhận thanh toán</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default RoadmapConfirmModal;