import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';

export default function ScheduleDetail({ schedule }: any) {
  if (!schedule) return null;

  const exercises = Array.isArray(schedule.exercises) ? schedule.exercises : [];

  return (
    <View className="mx-4 mt-3">
      {/* Card (no banner) */}
      <View className="bg-white rounded-2xl border border-gray-100 shadow-lg">
        <View className="p-4">
          <Text className="text-2xl font-extrabold text-[#3A2A1A]">{schedule.scheduleName}</Text>
          <Text className="text-gray-500 mt-1">{schedule.dayOfWeek} • {schedule.durationMinutes} phút</Text>

          {/* Pills */}
          <View className="flex-row flex-wrap mt-3">
            <View className="flex-row items-start bg-[#F3EDE3] px-3 py-3 rounded-xl w-full">
              <Ionicons name="information-circle-outline" size={18} color="#3A2A1A" />
              <Text className="text-[#8B4513] font-semibold ml-3 flex-1" numberOfLines={3} ellipsizeMode="tail">
                {schedule.description ?? 'Không có mô tả'}
              </Text>
            </View>
          </View>

          {/* Exercises list */}
          <View className="mt-4">
            {exercises.map((ex: any, idx: number) => (
              <View key={ex.id ?? idx} className="flex-row items-center py-3 border-b border-[#F3EDE3]">
                <Image
                  source={{ uri: ex.thumbnailUrl ?? ex.imageUrl ?? ex.image ?? 'https://via.placeholder.com/72' }}
                  className="w-16 h-16 rounded-lg bg-gray-100"
                  resizeMode="cover"
                />

                <View className="flex-1 ml-3">
                  <Text className="text-base font-semibold text-[#3A2A1A]">{idx + 1}. {ex.exerciseName}</Text>
                  <Text className="text-sm text-gray-400 mt-1">{ex.points ? `${ex.points}p` : ex.durationSeconds ? `${Math.ceil((ex.durationSeconds ?? 0) / 60)}p` : ''}</Text>
                </View>

                <View className="w-12 items-center justify-center">
                  {ex.locked ? (
                    <Ionicons name="lock-closed" size={20} color="#9CA3AF" />
                  ) : (
                    <TouchableOpacity className="w-9 h-9 rounded-full bg-[#8B4513] items-center justify-center" activeOpacity={0.8}>
                      <Ionicons name="play" size={16} color="#fff" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}