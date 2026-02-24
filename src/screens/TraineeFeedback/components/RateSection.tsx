import Ionicons from '@react-native-vector-icons/ionicons';
import { Pressable, Text, View } from 'react-native';
import { colors } from '../../../theme/colors';

type Props = {
  rating: number;
  onChange: (value: number) => void;
};

const RateSection = ({ rating, onChange }: Props) => {
  // CONSTANTS
  const MAXSTARS = 5;

  return (
    <View className="mt-6 mx-4">
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
