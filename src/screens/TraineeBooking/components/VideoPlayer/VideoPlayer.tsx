import React, { useEffect } from 'react';
import { Pressable, View, Dimensions } from 'react-native';
import { VideoSurface } from './VideoSurface';
import { VideoControls } from './VideoControls';
import { useVideoPlayer } from '../../../../hooks/useVideoPlayer';
import Orientation from 'react-native-orientation-locker';

const { height } = Dimensions.get('window');

type Props = {
  source: string;
  onBack: () => void;
};

export default function VideoPlayer({ source, onBack }: Props) {
  // HOOOK
  const player = useVideoPlayer({});

  useEffect(() => {
    Orientation.lockToLandscape();

    return () => {
      Orientation.lockToPortrait();
    };
  }, []);

  return (
    <View className="w-full" style={{ height: height }}>
      <VideoSurface
        videoRef={player.videoRef}
        source={source}
        paused={player.paused}
        onLoad={d => player.setDuration(d.duration)}
        onProgress={p => player.setCurrentTime(p.currentTime)}
      />

      <Pressable onPress={player.onTouchPlayer} className="absolute inset-0">
        {/* CONTROLS */}
        {player.showControls && (
          <View className="absolute inset-0 justify-end bg-black/20">
            <VideoControls
              paused={player.paused}
              duration={player.duration}
              currentTime={player.currentTime}
              onPlay={player.togglePlay}
              onSeek={player.seek}
              onSeekBy={player.seekBy}
              isFullscreen={true}
              hideFullscreen
              onBack={onBack}
              reset={player.reset}
            />
          </View>
        )}
      </Pressable>
    </View>
  );
}
