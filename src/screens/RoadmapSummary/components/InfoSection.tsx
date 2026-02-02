import { Text, View } from 'react-native';
import ProgressCircle from '../../../components/ProgressCircle';
import { colors } from '../../../theme/colors';
import Ionicons from '@react-native-vector-icons/ionicons';

type Props = {
  percent: number;
  dayCompleted: number;
  weight_1: number;
  weight_2: number;
};

const InfoSection = ({ percent, dayCompleted, weight_1, weight_2 }: Props) => {
  return (
    <View className="mx-4 mt-4 p-4 bg-background-sub2 rounded-xl shadow-sm elevation-10">
      <View className="flex-row justify-between items-center">
        {/* Left section */}
        <View>
          <Text className="color-secondaryText font-semibold">
            Tiến độ hiện tại
          </Text>
          <Text className="color-foreground font-bold text-3xl">
            {percent}%
          </Text>
        </View>

        {/* Right section */}
        <ProgressCircle
          size={60}
          strokeWidth={6}
          bgColor="#FFF"
          progressColor={colors.foreground}
          percent={percent}
        />
      </View>

      <View className="flex-row mt-2 gap-40 items-center">
        {/* Buổi tập */}
        <View>
          <Text className="color-secondaryText font-semibold">Đã tập</Text>
          <Text className="color-foreground font-bold text-xl">
            {dayCompleted} buổi
          </Text>
        </View>

        {/* Cân nặng */}
        <View>
          <Text className="color-secondaryText font-semibold">Cân nặng</Text>
          <View className="flex-row items-center gap-1">
            <Text className="color-foreground font-bold text-xl">
              {weight_1}kg
            </Text>
            {weight_2 > 0 && (
              <>
                <Ionicons
                  name="arrow-forward-outline"
                  size={16}
                  color={colors.foreground}
                />
                <Text className="color-foreground font-bold text-xl">
                  {weight_2}kg
                </Text>
              </>
            )}
          </View>
        </View>
      </View>
    </View>
  );
};

export default InfoSection;
