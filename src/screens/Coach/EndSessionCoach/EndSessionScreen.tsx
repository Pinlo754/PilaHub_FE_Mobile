import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, } from 'react-native';
import Header from '../components/Header';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../../../navigation/AppNavigator';


const EndSessionScreen = () => {
    const navigation = useNavigation<NavigationProp<RootStackParamList>>();
    
    const endSession = (id: string) => {
        console.log(`Kết thúc lớp học với ID: ${id}`);
        navigation.navigate('CoachScreen');
    }
  return (
    <View className="flex-1 bg-background p-4">
        <Header />
      {/* Header text ngoài card */}
      <Text className="text-orange-800 font-semibold mb-2 self-start ml-4">
        Kết thúc buổi học
      </Text>

      {/* Main Card */}
      <View className="w-full bg-[#f5e1bc] rounded-[30px] p-6 shadow-md">
        <Text className="text-orange-800 text-lg font-bold text-center mb-6">
          Thông tin học viên:
        </Text>

        {/* Thông tin chi tiết */}
        <View className="space-y-2 mb-6">
          <View className="flex-row">
            <Text className="text-orange-900 font-bold">Tên: </Text>
            <Text className="text-orange-800">Nguyễn Thanh Phong</Text>
          </View>
          
          <View className="flex-row">
            <Text className="text-orange-900 font-bold">Buổi: </Text>
            <Text className="text-orange-800">9</Text>
          </View>

          <View className="flex-row flex-wrap">
            <Text className="text-orange-900 font-bold">Nội dung: </Text>
            <Text className="text-orange-800">Duỗi chân đơn, duỗi chân đôi</Text>
          </View>

          <View className="flex-row">
            <Text className="text-orange-900 font-bold">Thời lượng buổi học: </Text>
            <Text className="text-orange-800">1h30p</Text>
          </View>
        </View>

        {/* Phần bình luận */}
        <Text className="text-orange-900 font-bold mb-2">Bình luận:</Text>
        <View className="bg-[#fffdf5] rounded-[25px] h-48 p-4 shadow-inner">
          <TextInput
            multiline
            placeholder="Nhập nhận xét tại đây..."
            textAlignVertical="top"
            className="flex-1 text-orange-900"
          />
        </View>

        {/* Lưu ý */}
        <Text className="text-orange-800 text-center text-xs italic mt-8 leading-5">
          Lưu ý: Hãy giữ thái độ lịch sự, chuẩn mực khi bình luận với học viên.
        </Text>
      </View>

      {/* Nút Kết thúc */}
      <TouchableOpacity 
        activeOpacity={0.8}
        className="mt-6 self-end mr-4 bg-[#cc8a4b] px-6 py-3 rounded-full flex-row items-center shadow-lg"
        onPress={() => endSession('')}
      >
        <Text className="text-white font-bold text-lg">Kết thúc </Text>
        <Text className="text-white font-bold text-lg">→</Text>
      </TouchableOpacity>
    </View>
  );
};

export default EndSessionScreen;