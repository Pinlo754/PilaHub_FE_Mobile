import React from 'react';
import { View } from 'react-native';
import Video, { OnLoadData, OnProgressData } from 'react-native-video';

type Props = {
  videoRef: any;
  source: string;
  paused: boolean;
  repeat?: boolean;
  onLoad: (data: OnLoadData) => void;
  onProgress: (data: OnProgressData) => void;
  onEnd?: () => void;
};

export function VideoSurface({
  videoRef,
  source,
  paused,
  repeat,
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
        repeat={repeat}
        resizeMode="cover"
        style={{ width: '100%', height: '100%' }}
        onLoad={d => {
          onLoad(d);
        }}
        onError={e => {
          console.log('VIDEO ERROR', e);
        }}
        onProgress={onProgress}
        onEnd={onEnd}
        pointerEvents="none"
        progressUpdateInterval={250}
      />
    </View>
  );
}
