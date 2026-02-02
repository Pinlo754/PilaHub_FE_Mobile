import { useRef } from 'react';
import { View } from 'react-native';
import Video, { VideoRef } from 'react-native-video';

const VideoShrink = () => {
  // REF
  const videoRef = useRef<VideoRef>(null);

  return (
    <View className="w-full h-[50%] overflow-hidden">
      <Video
        ref={videoRef}
        source={{
          uri: 'https://youtu.be/ufcDIOS1HRo?list=RDufcDIOS1HRo',
        }}
      />
    </View>
  );
};

export default VideoShrink;
