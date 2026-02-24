import Ionicons from '@react-native-vector-icons/ionicons';
import { Image, Pressable, View } from 'react-native';
import { colors } from '../../../theme/colors';

type Props = {
  img_url: string;
  setIsVideoVisible: (v: boolean) => void;
  togglePlayButton: () => void;
};

const ImageRecord = ({
  img_url,
  setIsVideoVisible,
  togglePlayButton,
}: Props) => {
  return (
    <View className="w-full overflow-hidden mt-4" style={{ height: 260 }}>
      <Image
        source={{
          uri: img_url,
        }}
        style={{ width: '100%', height: '100%' }}
        resizeMode="cover"
      />

      {/* Play Button */}
      <Pressable
        className="absolute z-10 inset-0 bg-black/20"
        onPress={() => {
          setIsVideoVisible(true);
          togglePlayButton();
        }}
      >
        <View className="absolute self-center top-28">
          <Ionicons
            name="play-circle-outline"
            size={60}
            color={colors.background.DEFAULT}
          />
        </View>
      </Pressable>
    </View>
  );
};

export default ImageRecord;
