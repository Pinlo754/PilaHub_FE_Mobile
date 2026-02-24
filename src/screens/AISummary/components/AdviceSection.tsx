import { Text, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { colors } from '../../../theme/colors';
import Ionicons from '@react-native-vector-icons/ionicons';

type Props = {
  desc?: string;
  tips?: string[];
};

const AdviceSection = ({
  desc = `Bạn đang duy trì tư thế và hơi thở rất tốt – đây là nền tảng quan trọng giúp cơ thể chuyển động nhẹ nhàng và an toàn. Khả năng kiểm soát của bạn cũng ổn định, chỉ cần luyện tập thêm một chút nữa là sẽ thấy sự khác biệt rõ rệt. Để cải thiện sức bền, bạn có thể làm theo các bước sau:`,
  tips = [
    'Tăng thời gian giữ tư thế thêm 5–10 giây.',
    'Thêm 1–2 lần lặp cho những động tác quen thuộc.',
    'Giữ nhịp thở đều khi bắt đầu mỏi.',
    'Tập chậm lại để kích hoạt cơ sâu hơn.',
  ],
}: Props) => {
  return (
    <View className="m-4 border border-info-darker/20 shadow-md elevation-md rounded-xl overflow-hidden">
      <LinearGradient
        colors={[colors.info.lighter, '#FFF']}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{
          padding: 16,
        }}
      >
        {/* Header */}
        <View className="flex-row items-center gap-2">
          <View className="w-10 h-10 rounded-full bg-info-darker flex items-center justify-center">
            <Ionicons name="planet" size={20} color="#FFF" />
          </View>

          <Text className="color-foreground font-bold text-lg">
            Lời khuyên từ AI
          </Text>
        </View>

        {/* Desc */}
        <Text className="color-foreground my-2">{desc}</Text>

        {/* Tips */}
        <View className="bg-background-sub1/30 rounded-xl p-3 gap-2">
          {tips.map((item, index) => (
            <View key={index} className="flex-row items-center">
              <Ionicons
                name="checkmark-circle"
                size={18}
                color={colors.success.DEFAULT}
              />
              <Text className="ml-1 text-sm text-foreground flex-1">
                {item}
              </Text>
            </View>
          ))}
        </View>
      </LinearGradient>
    </View>
  );
};

export default AdviceSection;
