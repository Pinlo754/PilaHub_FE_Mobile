import { Image, Text, View } from 'react-native';
import { ExerciseType } from '../../../utils/ExerciseType';

const CardExercise = ({ item }: { item: ExerciseType }) => {
  return (
    <View key={item.id} className="flex-row gap-4 mb-3 px-4">
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
          {item.duration}
        </Text>
      </View>
    </View>
  );
};

export default CardExercise;
