import Ionicons from '@react-native-vector-icons/ionicons';
import { Dimensions, Image, Pressable, View } from 'react-native';
import { colors } from '../../../theme/colors';

const { height } = Dimensions.get('window');

type Props = {
  img_url: string;
  setIsVideoVisible: (v: boolean) => void;
  togglePlayButton: () => void;
};

const ImageExercise = ({
  img_url,
  setIsVideoVisible,
  togglePlayButton,
}: Props) => {
  return (
    <View className="w-full overflow-hidden" style={{ height: height * 0.86 }}>
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
        <View className="absolute self-center top-[300px]">
          <Ionicons
            name="play-circle-outline"
            size={70}
            color={colors.background.DEFAULT}
          />
        </View>
      </Pressable>
    </View>
  );
};

export default ImageExercise;
