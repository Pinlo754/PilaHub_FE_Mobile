import { View, TouchableOpacity, Text } from "react-native";

export default function BottomActionBar() {
  return (
    <View className="absolute bottom-5 left-5 right-5 flex-row">
      <TouchableOpacity className="flex-1 bg-[#8B4513] p-4 rounded-2xl mr-3 items-center">
        <Text className="text-white font-bold">Lưu</Text>
      </TouchableOpacity>

      <TouchableOpacity className="flex-1 bg-[#E5D5C3] p-4 rounded-2xl items-center">
        <Text className="font-bold">Tạo lại</Text>
      </TouchableOpacity>
    </View>
  );
}