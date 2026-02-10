import { Image, View } from 'react-native';

const VideoRecord = () => {
  return (
    <View className="w-full overflow-hidden mt-4" style={{ height: 260 }}>
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

export default VideoRecord;
