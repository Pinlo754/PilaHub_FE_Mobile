import React from 'react';
import { View, StyleSheet } from 'react-native';
import Video, { OnLoadData, OnProgressData } from 'react-native-video';

type Props = {
  source?: string | null;
  paused: boolean;
  videoRef?: any;
  onLoad?: (d: OnLoadData) => void;
  onProgress?: (p: OnProgressData) => void;
  onEnd?: () => void;
  repeat?: boolean;
};

export default function RoadmapVideoSurface({
  source,
  paused,
  videoRef,
  onLoad,
  onProgress,
  onEnd,
  repeat = false,
}: Props) {
  if (!source) return <View style={styles.container} />;

  return (
    <View style={styles.container}>
      <Video
        ref={videoRef}
        source={{ uri: source }}
        paused={paused}
        repeat={repeat}
        resizeMode="cover"
        style={styles.video}
        onLoad={(d) => onLoad && onLoad(d)}
        onProgress={(p) => onProgress && onProgress(p)}
        onEnd={() => onEnd && onEnd()}
        progressUpdateInterval={250}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', height: '100%' },
  video: { width: '100%', height: '100%' },
});