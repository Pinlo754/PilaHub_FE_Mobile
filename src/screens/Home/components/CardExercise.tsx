import { Image, Pressable, Text, View } from 'react-native';
import { ExerciseType } from '../../../utils/ExerciseType';

type Props = {
  item: ExerciseType;
  onPress: () => void;
};

const CardExercise = ({ item, onPress }: Props) => {
  return (
    <Pressable className="mr-4" onPress={onPress}>
      {/* Image */}
      <View className="w-[250px] h-[150px] rounded-lg overflow-hidden">
        <Image
          source={{ uri: item.image_url }}
          style={{ width: '100%', height: '100%' }}
          resizeMode="cover"
        />
      </View>

      {/* Content */}
      <View className="mt-2">
        {/* Name */}
        <Text className="color-foreground text-lg font-semibold">
          {item.name}
        </Text>

        <Text className="color-secondaryText">{item.name}</Text>
      </View>
    </Pressable>
  );
};

export default CardExercise;
