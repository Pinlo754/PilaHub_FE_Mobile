import React from 'react';
import { View } from 'react-native';
import Video from 'react-native-video';

type Props = {
  videoRef: any;
  source: string;
  paused: boolean;
  onLoad: (d: any) => void;
  onProgress: (p: any) => void;
  onEnd?: () => void;
};

export function VideoSurface({
  videoRef,
  source,
  paused,
  onLoad,
  onProgress,
  onEnd,
}: Props) {
  return (
    <View className="w-full h-full">
      <Video
        ref={videoRef}
        source={{ uri: source }}
        paused={paused}
        resizeMode="cover"
        style={{ width: '100%', height: '100%' }}
        onLoad={onLoad}
        onProgress={onProgress}
        onEnd={onEnd}
        pointerEvents="none"
      />
    </View>
  );
}
