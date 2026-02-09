import React from 'react';
import { View, Text } from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { colors } from '../../../theme/colors';

type Props = {
  rating: number;
  maxStars?: number;
  size?: number;
  showValue?: boolean;
};

const StarRating = ({
  rating,
  maxStars = 5,
  size = 16,
  showValue = false,
}: Props) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating - fullStars >= 0.5;
  const emptyStars = maxStars - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <View className="flex-row items-center gap-1">
      {/* Full */}
      {Array.from({ length: fullStars }).map((_, i) => (
        <Ionicons
          key={`full-${i}`}
          name="star"
          size={size}
          color={colors.warning.DEFAULT}
        />
      ))}

      {/* Half */}
      {hasHalfStar && (
        <Ionicons name="star-half" size={size} color={colors.warning.DEFAULT} />
      )}

      {/* Empty */}
      {Array.from({ length: emptyStars }).map((_, i) => (
        <Ionicons
          key={`empty-${i}`}
          name="star-outline"
          size={size}
          color={colors.warning.DEFAULT}
        />
      ))}

      {showValue && (
        <Text className="ml-1 text-xs color-foreground">
          {rating.toFixed(1)}
        </Text>
      )}
    </View>
  );
};

export default StarRating;
