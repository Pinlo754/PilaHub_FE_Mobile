import { Image, View } from 'react-native';

const VideoShrink = ({ imgUrl }: { imgUrl: string }) => {
  return (
    <View className="w-full h-[50%] overflow-hidden">
      <Image
        source={{
          uri: imgUrl,
        }}
        style={{ width: '100%', height: '100%' }}
        resizeMode="cover"
      />
    </View>
  );
};

export default VideoShrink;
