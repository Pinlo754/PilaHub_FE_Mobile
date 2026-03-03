import React from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import Trainee from '../TraineeList/components/Trainee';

const TraineeProfileCoachScreen = () => {
  return (
    <View className="flex-1 bg-[#FFFBF0]">

      {/* Header */}
      <View className="flex-row justify-center items-center px-4 py-3 relative">
        <Text className="text-[#A0522D] text-2xl font-bold">PilaHub</Text>
        <TouchableOpacity className="absolute right-4">
          <Ionicons name="notifications-outline" size={24} color="#A0522D" />
        </TouchableOpacity>
      </View>

      <ScrollView
        className="px-4"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >

        <Trainee 
        name="Nguyễn Thanh Phong"
        birthday="07-05-2004"
        gender="Nam"
        progress={65}
        imageUri="https://randomuser.me/api/portraits/men/32.jpg"
      />

        {/* Stats Row */}
        <View className="flex-row justify-between mb-4">

          {/* Average Training Time */}
          <View className="bg-[#FDF2D9] w-[48%] p-3 rounded-[25px] border border-[#EEDCBA]">
            <View className="items-center">
              <Text className="text-[10px] text-[#A0522D] font-bold">
                2h 20m <Text className="text-orange-400">▲</Text>
              </Text>
              <Text className="text-[8px] text-[#8D6E63] mb-2">
                Thời gian luyện tập trung bình
              </Text>

              <View className="flex-row items-end space-x-1 h-12">
                {[20, 50, 20, 60, 55, 30, 25].map((h, i) => (
                  <View
                    key={i}
                    style={{ height: h }}
                    className={`w-3 rounded-full ${
                      i >= 1 && i <= 4 ? 'bg-[#A0522D]' : 'bg-[#E5E7EB]'
                    }`}
                  />
                ))}
              </View>

              <View className="flex-row justify-between w-full mt-1 px-1">
                {['2','3','4','5','6','7','CN'].map((d, i) => (
                  <Text key={i} className="text-[8px] text-gray-400">{d}</Text>
                ))}
              </View>
            </View>
          </View>

          {/* Accuracy Gauge */}
          <View className="bg-[#FDF2D9] w-[48%] p-3 rounded-[25px] items-center border border-[#EEDCBA]">
            <View className="h-16 w-24 items-center justify-end relative">
              <View className="w-20 h-10 border-t-8 border-l-8 border-r-8 border-[#CD853F] rounded-t-full" />
              <Text className="absolute bottom-0 text-[#A0522D] font-bold">94</Text>
            </View>

            <Text className="text-[#A0522D] text-xs font-bold mt-2">
              Tỉ lệ chính xác
            </Text>

            <TouchableOpacity className="bg-[#D28C4F] px-6 py-1 rounded-xl mt-2">
              <Text className="text-white text-xs font-bold">Chi tiết</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Heart Rate Card */}
        <View className="bg-[#FDF2D9] p-4 rounded-[30px] border border-[#EEDCBA] mb-4">
          <Text className="text-[#A0522D] text-xs font-bold mb-2">
            Heart Rate Measurement
          </Text>

          <View className="h-20 w-full bg-white/50 rounded-lg justify-center items-center">
            <Text className="text-gray-300">~~ Line Chart Here ~~</Text>
          </View>

          <View className="flex-row justify-around mt-2">
            <Text className="text-[10px] text-green-600">● Good 83bpm</Text>
            <Text className="text-[10px] text-orange-600">● AVG 75bpm</Text>
          </View>

          <View className="flex-row items-center mt-2 bg-blue-50 self-start px-2 py-1 rounded-lg">
            <Ionicons name="checkmark-circle" size={14} color="#4F46E5" />
            <Text className="text-[10px] text-blue-600 ml-1">
              Bạn đang ở trạng thái tốt
            </Text>
          </View>
        </View>

        {/* Roadmap */}
        <View className="bg-[#FDF2D9] p-4 rounded-[30px] border border-[#EEDCBA]">
          <Text className="text-[#A0522D] text-center text-lg font-bold mb-4">
            Lộ trình hiện tại
          </Text>

          <View className="relative">

            <View className="absolute left-[14px] top-4 bottom-4 w-[2px] border-l border-dashed border-gray-300" />

            {/* Stage 1 */}
            <View className="flex-row items-start mb-4">
              <Ionicons
                name="checkmark-circle"
                size={30}
                color="#66BB6A"
                style={{ zIndex: 10 }}
              />
              <View className="flex-1 ml-3 bg-white rounded-xl flex-row justify-between items-center p-3 shadow-sm">
                <Text className="font-bold text-[#333]">
                  Giai đoạn 1: Làm quen với Pilates
                </Text>
                <Ionicons name="chevron-up" size={20} color="#A0522D" />
              </View>
            </View>

            {/* Lessons */}
            <View className="ml-12 space-y-2 mb-4">
              <View className="bg-[#E5E7EB] p-2 rounded-lg flex-row items-center">
                <Ionicons name="checkmark-circle" size={16} color="#66BB6A" />
                <Text className="text-sm font-semibold ml-2">
                  Bài 1: Tập thở căn bản
                </Text>
              </View>

              <View className="bg-[#E5E7EB] p-2 rounded-lg flex-row items-center">
                <Ionicons name="checkmark-circle" size={16} color="#66BB6A" />
                <Text className="text-sm font-semibold ml-2">
                  Bài 2: Form
                </Text>
              </View>
            </View>

            {/* Stage 2 */}
            <View className="flex-row items-start">
              <Ionicons
                name="close-circle"
                size={30}
                color="#EF9A9A"
              />
              <View className="flex-1 ml-3 bg-white rounded-xl flex-row justify-between items-center p-3 shadow-sm opacity-80">
                <Text className="font-bold text-[#333]">
                  Giai đoạn 2: Làm quen với Pilates
                </Text>
                <Ionicons name="chevron-down" size={20} color="#A0522D" />
              </View>
            </View>
          </View>

          {/* <TouchableOpacity className="absolute right-4 bottom-8">
            <Ionicons name="chevron-forward" size={28} color="#D28C4F" />
          </TouchableOpacity> */}
        </View>

      </ScrollView>

      {/* Bottom Navigation */}
      <View className="absolute bottom-0 left-0 right-0 bg-[#F5E1B9] flex-row justify-around py-4 rounded-t-[20px]">

        <TouchableOpacity className="items-center">
          <View className="bg-[#A0522D] p-2 rounded-full">
            <Ionicons name="home" size={20} color="white" />
          </View>
          <Text className="text-[10px] text-[#A0522D] font-bold mt-1">
            Trang chủ
          </Text>
        </TouchableOpacity>

        <TouchableOpacity className="items-center opacity-50">
          <Ionicons name="book-outline" size={22} color="gray" />
          <Text className="text-[10px] text-gray-600 mt-1">
            Khóa học
          </Text>
        </TouchableOpacity>

      </View>

    </View>
  );
};

export default TraineeProfileCoachScreen;