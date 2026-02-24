import Ionicons from '@react-native-vector-icons/ionicons';
import { Image, Pressable, Text, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { colors } from '../../../theme/colors';
import { CardItem } from '../../../utils/DailyTaskType';

type Props = {
  item: CardItem;
  onPress: () => void;
};

const CardCourse = ({ item, onPress }: Props) => {
  return (
    <Pressable
      className="h-[220px] rounded-lg overflow-hidden mb-6"
      onPress={onPress}
    >
      {/* Image */}
      <Image
        source={{ uri: item.thumbnail_url }}
        style={{ width: '100%', height: '100%' }}
        resizeMode="cover"
      />

      {/* Gradient Overlay */}
      <LinearGradient
        colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.6)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          bottom: 0,
        }}
      />

      {/* Content */}
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

export default CardCourse;
