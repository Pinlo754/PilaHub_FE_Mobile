import React, { useState } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import Video from 'react-native-video';

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
  const { width: W, height: H } = useWindowDimensions();
  const SCALE = 0.8;
  // Luôn lấy cạnh dài = ngang (landscape), cạnh ngắn = dọc
  const SW = Math.max(W, H);
  const SH = Math.min(W, H);

  const [size, setSize] = useState<VideoSize | null>(null);

  const handleLoad = (data: any) => {
    onLoad(data);
    const w = data.naturalSize?.width;
    const h = data.naturalSize?.height;
    if (w && h) setSize({ naturalW: w, naturalH: h });
  };

  const aspect = size ? size.naturalW / size.naturalH : 16 / 9;
  const VERTICAL_OFFSET = 1; // thử 0.6 → 0.8 tuỳ mắt
  const videoH = (SW / aspect) * SCALE;
  const videoW = SW * SCALE;
  const videoTop = (SH - videoH) * VERTICAL_OFFSET;
  const videoLeft = (SW - videoW) / 2;

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
          width: videoW,
          height: videoH,
          top: videoTop,
          left: videoLeft,
        }}
      />
    </View>
  );
}
