import Ionicons from '@react-native-vector-icons/ionicons';
import { Pressable, Text, View } from 'react-native';

const RoadmapProgress = () => {
  // COLOR
  const FOREGROUND = '#A0522D';
  return (
    <Pressable className="mx-4 p-2 rounded-xl bg-white border border-background-sub1_30 elevation-6 shadow-lg flex-row justify-between items-center">
      {/* Left section */}
      <View>
        <View className="flex-row gap-1 items-center">
          <Ionicons name="barbell-outline" size={24} color={FOREGROUND} />
          <Text className="color-secondaryText font-medium">
            Lộ trình của tôi
          </Text>
        </View>
          </View>
          
          {/* Progress */}
    </Pressable>
  );
};

export default RoadmapProgress;
