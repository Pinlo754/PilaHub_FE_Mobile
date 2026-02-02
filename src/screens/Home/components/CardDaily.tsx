import Ionicons from '@react-native-vector-icons/ionicons';
import { Image, Pressable, Text, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { CourseType } from '../../../utils/CourseType';
import { colors } from '../../../theme/colors';

type Props = {
  item: CourseType;
  onPress: () => void;
};

const CardDaily = ({ item, onPress }: Props) => {
  return (
    <Pressable
      className="mr-4 w-[280px] h-[160px] rounded-lg overflow-hidden"
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
      <View className="absolute bottom-1 left-2">
        {/* Name */}
        <Text className="color-background-sub2 text-lg font-semibold">
          {item.course_name}
        </Text>

        <View className="flex-row gap-5">
          {/* Date */}
          <View className="flex-row gap-2 items-center">
            <Ionicons
              name="calendar-outline"
              size={18}
              color={colors.background.sub2}
            />
            <Text className="color-background-sub2">Buổi 2</Text>
          </View>
          {/* Time */}
          <View className="flex-row gap-1 items-center">
            <Ionicons
              name="time-outline"
              size={20}
              color={colors.background.sub2}
            />
            <Text className="color-background-sub2">15p</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
};

export default CardDaily;
