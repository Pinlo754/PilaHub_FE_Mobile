import React, { useEffect, useState } from 'react';
import { Pressable, View, Dimensions } from 'react-native';
import { VideoSurface } from './VideoSurface';
import { VideoControls } from './VideoControls';
import { useVideoPlayer } from '../../../../hooks/useVideoPlayer';

const { height } = Dimensions.get('window');

type Props = {
  source: string;
  isVideoExpand: boolean;
  toggleVideoExpand: () => void;
  isVideoPlay: boolean;
  togglePlayButton: () => void;
  seekTime: number | null;
};

export default function VideoPlayer({
  source,
  isVideoExpand,
  toggleVideoExpand,
  isVideoPlay,
  togglePlayButton,
  seekTime,
}: Props) {
  // HOOK
  const player = useVideoPlayer({ isVideoPlay });

  // PLAY BUTTON
  const onPressPlayBtn = () => {
    togglePlayButton();
  };
  const [isLoaded, setIsLoaded] = useState(false);
  // 🔥 SEEK KHI CLICK ERROR
  useEffect(() => {
  if (seekTime !== null && isLoaded) {
    console.log("seek video to:", seekTime);
    player.videoRef.current?.seek(seekTime);
  }
}, [seekTime, isLoaded]);

  return (
    <View className="w-full" style={{ height: isVideoExpand ? height : 260 }}>
      <VideoSurface
        videoRef={player.videoRef}
        source={source}
        paused={!isVideoPlay}
        onLoad={d => {
          player.setDuration(d.duration);
          setIsLoaded(true);
        }}
        onProgress={p => player.setCurrentTime(p.currentTime)}
      />

      <Pressable onPress={player.onTouchPlayer} className="absolute inset-0">
        {player.showControls && (
          <View className="absolute inset-0 justify-end bg-black/20">
            <VideoControls
              paused={!isVideoPlay}
              duration={player.duration}
              currentTime={player.currentTime}
              onPlay={onPressPlayBtn}
              onSeek={player.seek}
              onSeekBy={player.seekBy}
              onFullscreen={toggleVideoExpand}
              isFullscreen={isVideoExpand}
            />
          </View>
        )}
      </Pressable>
    </View>
  );
}