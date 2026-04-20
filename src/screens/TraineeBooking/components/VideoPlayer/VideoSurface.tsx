import React, { useState, useCallback, useRef } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Video from 'react-native-video';

const { width: SW, height: SH } = Dimensions.get('window');
const PIP_WIDTH = 120;
const PIP_HEIGHT = 160;
const PIP_MARGIN = 16;
const PIP_TOP = 52;
const SYNC_THRESHOLD = 0.3; // giây lệch tối đa cho phép

type VideoSize = { naturalW: number; naturalH: number };

type Props = {
  videoRef: any;
  pipVideoRef: any;
  source: string;
  paused: boolean;
  onLoad: (d: any) => void;
  onProgress: (p: any) => void;
};

export function VideoSurface({
  videoRef,
  pipVideoRef,
  source,
  paused,
  onLoad,
  onProgress,
}: Props) {
  const [size, setSize] = useState<VideoSize | null>(null);
  const mainCurrentTime = useRef(0);
  // ✅ XÓA mainReady, pipReady hoàn toàn

  const handleLoad = (data: any) => {
    onLoad(data);
    const w = data.naturalSize?.width;
    const h = data.naturalSize?.height;
    if (w && h) setSize({ naturalW: w, naturalH: h });
  };

  const handleMainProgress = useCallback(
    (p: any) => {
      onProgress(p);
      mainCurrentTime.current = p.currentTime;
    },
    [onProgress],
  );

  const handlePipProgress = useCallback(
    (p: any) => {
      const diff = Math.abs(p.currentTime - mainCurrentTime.current);
      if (diff > SYNC_THRESHOLD && pipVideoRef.current) {
        pipVideoRef.current.seek(mainCurrentTime.current);
      }
    },
    [pipVideoRef],
  );

  const handlePipLoad = useCallback(() => {
    if (pipVideoRef.current) {
      pipVideoRef.current.seek(mainCurrentTime.current);
    }
  }, [pipVideoRef]);

  const aspect = size ? size.naturalW / size.naturalH : 16 / 9;
  const mainVideoH = (SW * 2) / aspect;
  const mainVideoTop = (SH - mainVideoH) / 2;
  const pipVideoH = (PIP_WIDTH * 2) / aspect;
  const pipVideoTop = (PIP_HEIGHT - pipVideoH) / 2;

  // ✅ Cả 2 video nhận cùng 1 giá trị paused, không có điều kiện phụ
  const sharedProps = {
    source: { uri: source },
    paused,
    resizeMode: 'contain' as const,
    pointerEvents: 'none' as const,
  };

  return (
    <View style={StyleSheet.absoluteFill}>
      <View style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]}>
        <Video
          ref={videoRef}
          {...sharedProps}
          onLoad={handleLoad}
          onProgress={handleMainProgress}
          progressUpdateInterval={250}
          style={{
            position: 'absolute',
            width: SW * 2,
            height: mainVideoH,
            top: mainVideoTop,
            left: 0,
          }}
        />
      </View>

      <View
        style={{
          position: 'absolute',
          top: PIP_TOP,
          right: PIP_MARGIN,
          width: PIP_WIDTH,
          height: PIP_HEIGHT,
          borderRadius: 10,
          overflow: 'hidden',
          borderWidth: 2,
          borderColor: 'white',
          backgroundColor: 'black',
        }}
      >
        <Video
          ref={pipVideoRef}
          {...sharedProps}
          onLoad={handlePipLoad}
          onProgress={handlePipProgress}
          progressUpdateInterval={500}
          style={{
            position: 'absolute',
            width: PIP_WIDTH * 2,
            height: pipVideoH,
            top: pipVideoTop,
            left: -PIP_WIDTH,
          }}
        />
      </View>
    </View>
  );
}
