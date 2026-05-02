import React, { useState } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Video from 'react-native-video';

const { width: SW, height: SH } = Dimensions.get('window');

type VideoSize = { naturalW: number; naturalH: number };

type Props = {
  videoRef: any;
  source: string;
  paused: boolean;
  onLoad: (d: any) => void;
  onProgress: (p: any) => void;
};

export function VideoSurface({
  videoRef,
  source,
  paused,
  onLoad,
  onProgress,
}: Props) {
  const [size, setSize] = useState<VideoSize | null>(null);

  const handleLoad = (data: any) => {
    onLoad(data);
    const w = data.naturalSize?.width;
    const h = data.naturalSize?.height;
    if (w && h) setSize({ naturalW: w, naturalH: h });
  };

  const aspect = size ? size.naturalW / size.naturalH : 16 / 9;
  const videoH = SW / aspect; // landscape: SW là chiều dài màn hình ngang
  const videoTop = (SH - videoH) / 2;

  return (
    <View style={StyleSheet.absoluteFill}>
      <Video
        ref={videoRef}
        source={{ uri: source }}
        paused={paused}
        resizeMode="contain"
        pointerEvents="none"
        onLoad={handleLoad}
        onProgress={onProgress}
        progressUpdateInterval={250}
        style={{
          position: 'absolute',
          width: SW,
          height: videoH,
          top: videoTop,
          left: 0,
        }}
      />
    </View>
  );
}
