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
      <View className="w-32 h-24 rounded-lg overflow-hidden">
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

        {/* Duration */}
        <Text className="color-secondaryText font-medium text-lg">
          {secondsToTime(item.duration)}
        </Text>

        <View className="flex-row items-center">
          {/* Difficult Level */}
          <View className="flex-row w-[100px] items-center gap-1">
            {Array.from({ length: getLevelNumber(item.difficultyLevel) }).map(
              (_, index) => (
                <Ionicons
                  key={index}
                  name="star"
                  size={18}
                  color={colors.warning.DEFAULT}
                />
              ),
            )}
          </View>

          {/* Require Equipment */}
          {item.equipmentRequired && (
            <View className="px-2 py-1 rounded-full mr-4">
              <Ionicons
                name="barbell-outline"
                size={22}
                color={colors.secondaryText}
              />
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
};

export default CardExercise;
