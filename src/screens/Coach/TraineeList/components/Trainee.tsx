import React, { useEffect } from 'react';
import { View, Text, Image } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  Easing 
} from 'react-native-reanimated';

interface TraineeProps {
  name: string;
  birthday: string;
  gender: string;
  progress: number; // Giá trị từ 0 đến 100
  imageUri?: string;
}

const Trainee = ({ name, birthday, gender, progress, imageUri }: TraineeProps) => {
  // 1. Khởi tạo giá trị shared value bắt đầu từ 0
  const animatedProgress = useSharedValue(0);

  // 2. Chạy animation khi component mount
  useEffect(() => {
    animatedProgress.value = withTiming(progress, {
      duration: 1500, // Thời gian chạy (1.5 giây)
      easing: Easing.out(Easing.exp), // Hiệu ứng mượt ở đoạn cuối
    });
  }, [progress]);

  // 3. Tạo style động cho thanh progress
  const animatedStyle = useAnimatedStyle(() => {
    return {
      width: `${animatedProgress.value}%`,
    };
  });

  return (
    <View className="bg-[#fdf2d9] rounded-[30px] p-5 mb-4 shadow-sm mx-4 relative">
      
      {/* Icon Dấu chấm than */}
      <View className="absolute top-4 right-4 bg-[#7a5c41] rounded-full w-6 h-6 items-center justify-center">
        <Ionicons name="alert" size={14} color="#fdf2d9" />
      </View>

      {/* Header */}
      <View className="flex-row items-center mb-4">
        <Image 
          source={{ uri: imageUri || 'https://via.placeholder.com/150' }} 
          className="w-16 h-16 rounded-full"
        />
        <Text className="ml-4 text-[#a65d37] text-xl font-bold flex-1 pr-6">
          {name}
        </Text>
      </View>

      {/* Chi tiết */}
      <View className="space-y-1 mb-4">
        <View className="flex-row">
          <Text className="text-[#333] text-base font-medium">Ngày sinh: </Text>
          <Text className="text-[#333] text-base">{birthday}</Text>
        </View>
        
        <View className="flex-row">
          <Text className="text-[#333] text-base font-medium">Giới tính: </Text>
          <Text className="text-[#333] text-base">{gender}</Text>
        </View>
        <Text className="text-[#333] text-base font-medium">Tiến độ học tập:</Text>
      </View>

      {/* Thanh Progress Bar với Animation */}
      <View className="w-full h-3 bg-[#e0d7f7] rounded-full overflow-hidden">
        <Animated.View 
          className="h-full bg-[#8b4513]" 
          style={animatedStyle} 
        />
      </View>
    </View>
  );
};

export default Trainee;