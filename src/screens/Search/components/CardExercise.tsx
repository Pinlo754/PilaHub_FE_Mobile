import { Image, Pressable, Text, View } from 'react-native';
import { ExerciseType } from '../../../utils/ExerciseType';
import { secondsToTime } from '../../../utils/time';

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
            uri: item.image_url,
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
        {/* Duration */}
        <Text className="color-secondaryText font-medium text-lg">
          {secondsToTime(item.default_duration_sec)}
        </Text>
      </View>
    </Pressable>
  );
};

export default CardExercise;
