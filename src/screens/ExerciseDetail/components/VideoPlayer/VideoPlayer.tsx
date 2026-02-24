import React from 'react';
import { Pressable, View, Dimensions } from 'react-native';
import { VideoSurface } from './VideoSurface';
import { VideoControls } from './VideoControls';
import { useVideoPlayer } from '../../../../hooks/useVideoPlayer';

const { height } = Dimensions.get('window');

type Props = {
  source: string;
  isVideoPlay: boolean;
  isVideoExpand: boolean;
  toggleVideoExpand: () => void;
  isPracticeTab: boolean;
  setIsShowFlag: (v: boolean) => void;
};

export default function VideoPlayer({
  source,
  isVideoPlay,
  isVideoExpand,
  toggleVideoExpand,
  isPracticeTab,
  setIsShowFlag,
}: Props) {
  // HOOOK
  const player = useVideoPlayer({
    isVideoPlay,
    setIsShowControls: setIsShowFlag,
  });

  return (
    <View
      className="w-full"
      style={{ height: isVideoExpand ? height * 0.95 : height * 0.5 }}
    >
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
          <View className="absolute inset-0 justify-end bg-black/20">
            <VideoControls
              duration={player.duration}
              currentTime={player.currentTime}
              onSeek={player.seek}
              onSeekBy={player.seekBy}
              onFullscreen={toggleVideoExpand}
              isFullscreen={isVideoExpand}
              isPracticeTab={isPracticeTab}
            />
          </View>
        )}
      </Pressable>
    </View>
  );
}
