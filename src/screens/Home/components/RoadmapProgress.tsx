import Ionicons from '@react-native-vector-icons/ionicons';
import { Pressable, Text, View } from 'react-native';
import { colors } from '../../../theme/colors';
import ProgressCircle from '../../../components/ProgressCircle';

const RoadmapProgress = () => {
  return (
    <Pressable className="m-4 p-2 rounded-xl bg-white border border-background-sub1_30 elevation-6 shadow-lg flex-row justify-between items-center gap-6">
      {/* Left section */}
      <View className="flex-grow">
        <View className="flex-row gap-2 items-center">
          <Ionicons
            name="barbell-outline"
            size={24}
            color={colors.foreground}
          />
          <Text className="color-secondaryText font-medium">
            Lộ trình của tôi
          </Text>
        </View>

        <Text className="color-foreground font-semibold text-lg mt-1">
          Tăng cơ & Giảm mỡ
        </Text>
      </View>

      {/* Progress */}
      <View className="">
        <ProgressCircle
          size={50}
          strokeWidth={5}
          bgColor={colors.inactive.lighter}
          progressColor={colors.foreground}
          percent={60}
        />

        <View className="absolute inset-0 items-center justify-center">
          <Text className="color-foreground font-semibold">60%</Text>
        </View>
      </View>
    </Pressable>
  );
};

export default RoadmapProgress;
