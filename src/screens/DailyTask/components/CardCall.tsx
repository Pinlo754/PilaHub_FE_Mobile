import { Pressable, Text, View } from 'react-native';
import { CardItem } from '../../../utils/DailyTaskType';
import MaskedImgWithHole from '../../../components/MaskedImgWithHole';
import Ionicons from '@react-native-vector-icons/ionicons';
import { colors } from '../../../theme/colors';

type Props = {
  item: CardItem;
  onPress: () => void;
};

const CardCall = ({ item, onPress }: Props) => {
  return (
    <Pressable className="flex mb-6 rounded-lg w-full" onPress={onPress}>
      {/* Image */}
      <MaskedImgWithHole
        imageUri={item.thumbnail_url}
        holeRadius={40}
        overlay={true}
      />

      {/* Video Icon */}
      <View className="absolute top-0 w-20 h-20 rounded-full bg-background-sub1 items-center justify-center">
        <Ionicons name="videocam-outline" size={35} color={colors.foreground} />
      </View>

      <View className="absolute bottom-3 left-4">
        {/* Name */}
        <Text className="color-background text-xl font-semibold">
          {item.title}
        </Text>

        <View className="flex-row gap-5">
          {/* Date */}
          <View className="flex-row gap-2 items-center">
            <Ionicons
              name="calendar-outline"
              size={18}
              color={colors.background.DEFAULT}
            />
            <Text className="color-background text-lg">
              Buổi {item.session}
            </Text>
          </View>
          {/* Time */}
          <View className="flex-row gap-1 items-center">
            <Ionicons
              name="time-outline"
              size={20}
              color={colors.background.DEFAULT}
            />
            <Text className="color-background text-lg">{item.duration}</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
};

export default CardCall;
