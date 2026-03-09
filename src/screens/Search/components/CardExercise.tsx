import { Image, Pressable, Text, View } from 'react-native';
import { ExerciseType } from '../../../utils/ExerciseType';
import { secondsToTime } from '../../../utils/time';
import Ionicons from '@react-native-vector-icons/ionicons';
import { colors } from '../../../theme/colors';
import { getLevelNumber } from '../../../utils/uiMapper';

type Props = {
  item: ExerciseType;
  onPress?: () => void;
};

const CardExercise = ({ item, onPress }: Props) => {
  return (
    <Pressable className="flex-row gap-4 mb-3 px-4" onPress={onPress}>
      {/* Image */}
      <View className="w-32 h-20 rounded-lg overflow-hidden">
        <Image
          source={{
            uri: item.imageUrl,
          }}
          style={{ width: '100%', height: '100%' }}
          resizeMode="cover"
        />
      </View>

      {/* Info */}
      <View className="flex">
        {/* Name */}
        <Text className="color-foreground font-bold text-lg line-clamp-1 max-w-80 pr-4">
          {item.name}
        </Text>

        <View className="flex-row items-center gap-10">
          {/* Duration */}
          <Text className="color-secondaryText font-medium text-lg">
            {secondsToTime(item.default_duration_sec)}
          </Text>

          {/* Difficult Level */}
          <View className="flex-row items-center gap-1">
            {item.difficultyLevel &&
              Array.from({
                length: getLevelNumber(item.difficultyLevel),
              }).map((_, index) => (
                <Ionicons
                  key={index}
                  name="star"
                  size={18}
                  color={colors.warning.DEFAULT}
                />
              ))}
          </View>

          {/* Require Equipment */}
          {item.equipmentRequired && (
            <Ionicons
              name="barbell-outline"
              size={22}
              color={colors.secondaryText}
            />
          )}
        </View>
      </View>
    </Pressable>
  );
};

export default CardExercise;
