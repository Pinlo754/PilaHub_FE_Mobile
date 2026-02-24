import React from 'react';
import { Pressable, View, Dimensions } from 'react-native';
import { VideoSurface } from './VideoSurface';
import { VideoControls } from './VideoControls';
import { useVideoPlayer } from '../../../../hooks/useVideoPlayer';

const { height } = Dimensions.get('window');

type Props = {
  source: string;
  isVideoPlay: boolean;
  togglePlayButton: () => void;
};

export default function VideoPlayer({
  source,
  isVideoPlay,
  togglePlayButton,
}: Props) {
  // HOOOK
  const player = useVideoPlayer({ isVideoPlay });

  // HANDLERS
  const onPressPlayBtn = () => {
    togglePlayButton();
  };

  return (
    <View className="w-full" style={{ height: height * 0.86 }}>
      <VideoSurface
        videoRef={player.videoRef}
        source={source}
        paused={!isVideoPlay}
        onLoad={d => player.setDuration(d.duration)}
        onProgress={p => player.setCurrentTime(p.currentTime)}
      />

      <Pressable onPress={player.onTouchPlayer} className="absolute inset-0">
        {/* CONTROLS */}
        {player.showControls && (
          <View className="absolute inset-0 justify-center bg-black/20">
            <VideoControls
              paused={!isVideoPlay}
              duration={player.duration}
              currentTime={player.currentTime}
              onPlay={onPressPlayBtn}
              onSeek={player.seek}
              onSeekBy={player.seekBy}
            />
          </View>
        )}
      </Pressable>
    </View>
  );
}
