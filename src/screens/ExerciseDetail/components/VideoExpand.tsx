import { Image, View } from 'react-native';

const VideoExpand = () => {
  return (
    <View className="w-full h-[95%] overflow-hidden">
      <Image
        source={{
          uri: 'https://cdn.mos.cms.futurecdn.net/RSRmmWZGBcNnLLynabFD2Z.jpg',
        }}
        style={{ width: '100%', height: '100%' }}
        resizeMode="cover"
      />
    </View>
  );
};

export default VideoExpand;
