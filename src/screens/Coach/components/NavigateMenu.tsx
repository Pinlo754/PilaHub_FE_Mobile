import { NavigationProp, useNavigation } from '@react-navigation/native';
import React from 'react';
import { View, Text, TouchableOpacity, FlatList } from 'react-native';
// 1. Đổi import sang Ionicons
import Ionicons from '@react-native-vector-icons/ionicons'; 
import { RootStackParamList } from '../../../navigation/AppNavigator';

type FeatureItem = {
  id: string;
  title: string;
  icon: string;
  screen: string;
};

// 2. Cập nhật bảng icon tương ứng của Ionicons
const features: FeatureItem[] = [
  { id: '1', title: 'Danh sách học viên', icon: "people-outline", screen: 'TraineeListScreen' },
  { id: '2', title: 'Đăng ký lịch dạy', icon: "calendar-outline", screen: 'CoachRegisterSchedule' },
  { id: '3', title: 'Danh sách yêu cầu', icon: "list-circle-outline", screen: 'RequestList' },
  { id: '4', title: 'Tin nhắn', icon: "chatbubbles-outline", screen: 'Messages' },
  { id: '5', title: 'Khóa học', icon: "book-outline", screen: 'Courses' },
  { id: '6', title: 'Cài đặt', icon: "settings-outline", screen: 'FeedbackScreen' },
];

const FeatureGrid = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const renderItem = ({ item }: { item: FeatureItem }) => (
    <TouchableOpacity
      className="flex-1 items-center justify-center bg-white m-2 py-6 rounded-3xl shadow-lg elevation-5"
      onPress={() => navigation.navigate(item.screen as any)}
      activeOpacity={0.7}
    >
      {/* 3. Thay đổi Component Icon */}
      <Ionicons name={item.icon as any} size={35} color="#8B5E3C" />
      
      <Text className="text-[#8B5E3C] text-center font-semibold text-[13px] px-2 mt-2">
        {item.title}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View className="bg-[#FFF5E6] px-3 pt-4">
      <Text className="text-2xl font-bold text-[#8B5E3C] ml-2 mb-4">
        Chức năng
      </Text>

      <FlatList
        data={features}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={3}
        scrollEnabled={false}
        columnWrapperStyle={{ justifyContent: 'space-between' }}
      />
    </View>
  );
};

export default FeatureGrid;