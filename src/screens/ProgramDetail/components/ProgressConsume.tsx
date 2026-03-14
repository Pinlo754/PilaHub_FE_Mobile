import { View, Text } from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';

type ProgressConsumeProps = {
  number_of_programs: number;
  progress: number;
};

const ProgressConsume = ({
  number_of_programs,
  progress,
}: ProgressConsumeProps) => {
  return (
    <View className="w-full mb-4 bg-background flex-row justify-between px-12">
      {/* PROGRESS */}
      <View className="w-36 py-1.5 bg-white rounded-xl shadow-sm elevation-6 border border-background-sub2 flex-row justify-between px-4">
        <View className="my-auto">
          <Ionicons name="timer" size={36} color="#3B82F6" />
        </View>
        <View className="my-auto">
          <Text className="text-2xl font-semibold text-foreground">
            {progress}%
          </Text>
          <Text className="text-fs14 text-secondaryText">Tiến độ</Text>
        </View>
      </View>

      {/* PROGRAM COUNT */}
      <View className="w-36 py-1.5 bg-white rounded-xl shadow-sm elevation-6 border border-background-sub2 flex-row justify-between px-4">
        <View className="my-auto">
          <Ionicons name="list-circle" size={36} color="#F2C94C" />
        </View>
        <View className="my-auto">
          <Text className="text-2xl font-semibold text-foreground">
            {number_of_programs}
          </Text>
          <Text className="text-fs14 text-secondaryText">Bài tập</Text>
        </View>
      </View>
    </View>
  );
};

export default ProgressConsume;
