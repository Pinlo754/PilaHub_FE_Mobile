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
    <Pressable className="flex-row gap-4 mb-5 px-4" onPress={onPress}>
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
        <Text className="color-foreground font-bold text-lg line-clamp-2">
          {item.name}
        </Text>
        <View className="flex-row items-center gap-2">
          {/* Duration */}
          <Text className="color-secondaryText font-medium text-lg w-[110px]">
            {secondsToTime(item.duration)}
          </Text>

          {/* Difficult Level */}
          <View className="flex-row items-center gap-2">
            <Text className="color-secondaryText font-medium text-lg">
              Độ khó:
            </Text>

            <View className="flex-row items-center gap-1">
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
          </View>
        </View>
        {/* Require Equipment */}
        <View className="flex-row items-center gap-1">
          {/* <Ionicons
                   name="barbell-outline"
                   size={22}
                   color={colors.secondaryText}
                 /> */}
          <Text className="color-secondaryText font-medium">Dụng cụ tập:</Text>

          <Ionicons
            name={item.equipmentRequired ? 'checkmark-circle' : 'close-circle'}
            size={20}
            color={
              item.equipmentRequired
                ? colors.success.DEFAULT
                : colors.danger.DEFAULT
            }
          />
        </View>
      </View>
    </Pressable>
  );
};

export default CardExercise;
