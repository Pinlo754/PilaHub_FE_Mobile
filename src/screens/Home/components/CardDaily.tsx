import Ionicons from '@react-native-vector-icons/ionicons';
import { Image, Pressable, Text, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { CourseType } from '../../../utils/CourseType';

type Props = {
  item: CourseType;
  onPress: () => void;
};

const CardDaily = ({ item, onPress }: Props) => {
  // COLOR
  const SUB_2 = '#FFFAF0';
  return (
    <Pressable
      className="pr-4 w-100 h-50 rounded-lg overflow-hidden"
      onPress={onPress}
    >
      <LinearGradient
        colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.5)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{}}
      >
        <Image
          source={{
            uri: 'https://www.toponseek.com/wp-content/uploads/2024/07/celeb-la-gi-6.jpg',
          }}
          style={{ width: '100%', height: '100%' }}
          resizeMode="cover"
        />
      </LinearGradient>

      {/* Content */}
      <View className="absolute">
        {/* Name */}
        <Text className="color-background-sub2 text-lg font-semibold">
          {item.course_name}
        </Text>

        <View className="flex-row gap-4">
          {/* Date */}
          <View className="flex-row gap-2 items-center">
            <Ionicons name="calendar-outline" size={24} color={SUB_2} />
            <Text className="color-background-sub2 font-medium">Buổi 2</Text>
          </View>
          {/* Time */}
          <View className="flex-row gap-2 items-center">
            <Ionicons name="time-outline" size={24} color={SUB_2} />
            <Text className="color-background-sub2 font-medium">15p</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
};

export default CardDaily;
