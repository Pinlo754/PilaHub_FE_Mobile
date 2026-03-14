import Ionicons from '@react-native-vector-icons/ionicons';
import { Pressable, Text, View } from 'react-native';
import { colors } from '../../../theme/colors';
import { ModeType } from '../useTraineeFeedback';

type Props = {
  rating: number;
  onChange: (value: number) => void;
  mode: ModeType;
};

const RateSection = ({ rating, onChange, mode }: Props) => {
  // CONSTANTS
  const MAXSTARS = 5;

  // CHECK
  const isFeedbackForCoach = mode === 'feedbackForCoach';

  return (
    <View className={`mx-4 ${isFeedbackForCoach ? 'mb-6' : 'mt-6 '}`}>
      {/* Title */}
      <Text className="color-secondaryText font-semibold text-lg">
        Đánh giá trải nghiệm của bạn
      </Text>

      {/* Rating */}
      <View className="flex-row gap-4 self-center mt-2">
        {Array.from({ length: MAXSTARS }).map((_, i) => {
          const isActive = i < rating;

          return (
            <Pressable key={`star-${i}`} onPress={() => onChange(i + 1)}>
              <Ionicons
                name={isActive ? 'star' : 'star-outline'}
                size={35}
                color={isActive ? colors.foreground : colors.secondaryText}
              />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

export default RateSection;
