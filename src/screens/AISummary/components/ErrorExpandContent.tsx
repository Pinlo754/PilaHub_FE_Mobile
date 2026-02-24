import { Image, Pressable, Text, View } from 'react-native';
import { ErrorItemType } from '../../../utils/SummaryType';
import Ionicons from '@react-native-vector-icons/ionicons';
import { colors } from '../../../theme/colors';

type Props = {
  item: ErrorItemType;
  onPlayVideo: (src: string) => void;
};

const ErrorExpandContent = ({ item, onPlayVideo }: Props) => {
  return (
    <View className="mt-3 px-2">
      <View
        className="rounded-lg overflow-hidden mb-4 self-center"
        style={{ width: 300, height: 160 }}
      >
        <Image
          source={{ uri: item.thumbnail_url }}
          className="w-full h-full"
          resizeMode="cover"
        />

        {/* Play Button */}
        <Pressable
          className="absolute z-10 inset-0 bg-black/20"
          onPress={() => onPlayVideo(item.video_url)}
        >
          <View className="absolute self-center top-16">
            <Ionicons
              name="play-circle-outline"
              size={50}
              color={colors.background.DEFAULT}
            />
          </View>
        </Pressable>
      </View>

      <Text className="text-foreground font-medium">{item.desc}</Text>
    </View>
  );
};

export default ErrorExpandContent;
