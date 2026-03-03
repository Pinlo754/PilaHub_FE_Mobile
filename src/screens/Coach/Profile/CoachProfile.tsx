import React from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';

/* ============================
   Certificate Item Component
============================ */
const CertificateItem = ({ title, status, isExpired = false }: any) => (
  <View className="bg-[#F5E1B9] p-4 rounded-2xl mb-3 flex-row justify-between items-center">
    <View className="flex-1">
      <Text className="text-[#5D4037] font-bold text-base">
        {title}:{' '}
        <Text className={isExpired ? 'text-red-400' : 'text-green-500'}>
          {status}
        </Text>
      </Text>

      <TouchableOpacity>
        <Text className="text-[#8D6E63] text-xs underline mt-1">
          Xem chi tiết
        </Text>
      </TouchableOpacity>
    </View>

    <TouchableOpacity>
      <Ionicons
        name="cloud-upload-outline"
        size={20}
        color="#8D6E63"
      />
    </TouchableOpacity>
  </View>
);

/* ============================
   Bottom Tab Item
============================ */
const TabItem = ({ icon, label, active = false }: any) => (
  <TouchableOpacity className="items-center">
    <View className={active ? 'bg-[#A0522D] p-2 rounded-full' : 'p-2'}>
      <Ionicons
        name={icon}
        size={22}
        color={active ? 'white' : 'gray'}
      />
    </View>

    <Text
      className={`text-[10px] mt-1 ${
        active ? 'text-[#A0522D] font-bold' : 'text-gray-500'
      }`}>
      {label}
    </Text>
  </TouchableOpacity>
);

/* ============================
   Profile Screen
============================ */
const CoachProfileScreen = () => {
  return (
    <View className="flex-1 bg-[#FFF8E1]">
      
      {/* HEADER */}
      <View className="flex-row justify-between items-center px-4 py-2">
        <View className="w-10" />

        <Text className="text-[#A0522D] text-xl font-bold">
          Hồ sơ Huấn luyện viên
        </Text>

        <View className="flex-row space-x-3">
          <Ionicons
            name="notifications-outline"
            size={24}
            color="#A0522D"
          />
          <Ionicons
            name="bookmark-outline"
            size={24}
            color="#A0522D"
          />
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>

        {/* AVATAR SECTION */}
        <View className="items-center my-6">
          <View className="relative">
            <Image
              source={{ uri: 'https://via.placeholder.com/150' }}
              className="w-24 h-24 rounded-full border-2 border-[#D7CCC8]"
            />

            <TouchableOpacity className="absolute bottom-0 right-0 bg-gray-500 p-1 rounded-full border-2 border-white">
              <Ionicons name="pencil" size={14} color="white" />
            </TouchableOpacity>
          </View>

          <Text className="text-[#A0522D] text-lg font-bold mt-2">
            Nguyen Van A
          </Text>
        </View>

        {/* TỔNG QUAN */}
        <View className="px-4 mb-6">
          <Text className="text-[#A0522D] font-bold text-lg mb-2">
            Tổng quan:
          </Text>

          <View className="bg-[#F5E1B9] p-4 rounded-2xl">
            <Text className="text-[#5D4037] text-base mb-1">
              Họ tên: <Text className="font-semibold">Nguyễn Văn A</Text>
            </Text>

            <Text className="text-[#5D4037] text-base mb-1">
              Giới tính: <Text className="font-semibold">Nam</Text>
            </Text>

            <Text className="text-[#5D4037] text-base">
              Ngày sinh: <Text className="font-semibold">12/03/1992</Text>
            </Text>
          </View>
        </View>

        {/* CHỨNG CHỈ */}
        <View className="px-4">
          <Text className="text-[#A0522D] font-bold text-lg mb-2">
            Chứng chỉ / Chứng nhận:
          </Text>

          <CertificateItem
            title="Giấy phép huấn luyện"
            status="Đang hoạt động"
          />

          <CertificateItem
            title="Chứng chỉ Pilates"
            status="Đang hoạt động"
          />

          <CertificateItem
            title="Chứng nhận tốt nghiệp"
            status="Hết hạn"
            isExpired
          />
        </View>
      </ScrollView>

      {/* BOTTOM TAB */}
      <View className="absolute bottom-0 left-0 right-0 bg-[#F5E1B9] flex-row justify-around py-3 border-t border-[#D7CCC8]">
        <TabItem icon="home-outline" label="Trang chủ" />
        <TabItem icon="calendar-outline" label="Thử thách" />
        <TabItem icon="book-outline" label="Khóa học" active />
        <TabItem icon="cart-outline" label="Cửa hàng" />
        <TabItem icon="person-outline" label="Tài khoản" />
      </View>

    </View>
  );
};

export default CoachProfileScreen;