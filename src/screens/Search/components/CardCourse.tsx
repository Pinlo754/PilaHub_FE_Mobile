import { Image, Text, View } from 'react-native';
import { CourseType } from '../../../utils/CourseType';

const CardCourse = ({ item }: { item: CourseType }) => {
  return (
    <View className="px-4 flex mb-6">
      {/* Image */}
      <View className="w-full aspect-[16/9] rounded-lg overflow-hidden mb-3">
        <Image
          source={{
            uri: item.img_url,
          }}
          style={{ width: '100%', height: '100%' }}
          resizeMode="cover"
        />
      </View>

      {/* Name */}
      <Text className="text-center color-foreground font-bold text-lg">
        {item.name}
      </Text>
    </View>
  );
};

export default CardCourse;
