import { View, Text } from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { formatShortVND } from '../../../utils/number';

type ProgressConsumeProps = {
  number_of_programs: number;
  progress: number;
  price: number;
  traineeCourseId: string | null;
};

const ProgressConsume = ({
  number_of_programs,
  progress,
  price,
  traineeCourseId,
}: ProgressConsumeProps) => {
  return (
    <View
      className={`w-full mb-4 bg-background flex-row px-12 justify-between`}
    >
      {/* PROGRESS */}
      {traineeCourseId ? (
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
      ) : (
        <View className="w-36 py-1.5 bg-white rounded-xl shadow-sm elevation-6 border border-background-sub2 flex-row justify-between px-4">
          <View className="my-auto">
            <Ionicons name="card" size={26} color="#3B82F6" />
          </View>
          <View className="my-auto" style={{ width: 60 }}>
            <Text
              className="text-2xl font-semibold text-foreground"
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.7}
            >
              {formatShortVND(price)}
            </Text>
            <Text className="text-fs14 text-secondaryText">Giá</Text>
          </View>
        </View>
      )}

      {/* PROGRAM COUNT */}
      <View
        className={`w-36 py-1.5 bg-white rounded-xl shadow-sm elevation-6 border border-background-sub2 flex-row justify-between px-4`}
      >
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
