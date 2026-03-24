import React, { useEffect, useState } from 'react';
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
  onVideoEnd: () => void;
};

export default function VideoPlayer({
  source,
  isVideoPlay,
  isVideoExpand,
  toggleVideoExpand,
  isPracticeTab,
  setIsShowFlag,
  onVideoEnd,
}: Props) {
  // HOOOK
  const player = useVideoPlayer({
    isVideoPlay,
    setIsShowControls: setIsShowFlag,
  });

  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 100); 
    return () => clearTimeout(t);
  }, [source]);

  useEffect(() => {
    player.reset(); 
  }, [source]);

  return (
    <View
      className="w-full"
      style={{ height: isVideoExpand ? height * 0.95 : height * 0.5 }}
    >
      {ready && (
        <VideoSurface
          key={`${source}`}
          videoRef={player.videoRef}
          source={source}
          paused={player.paused}
          onLoad={d => {
            const duration = d.duration;
            if (!isFinite(duration) || duration <= 0 || duration > 100000)
              return;

            player.setDuration(duration);
            player.setIsLoaded(true);
          }}
          onProgress={p => {
            if (!player.isLoaded) {
              // Vẫn chưa load xong nhưng progress đã có → dùng làm fallback
              if (p.seekableDuration > 0 && p.seekableDuration < 100000) {
                player.setDuration(p.seekableDuration);
                player.setIsLoaded(true); // mark loaded từ progress
              }
              return;
            }

            if (p.currentTime >= 0) {
              player.setCurrentTime(p.currentTime);
            }

            // Luôn cập nhật duration nếu seekableDuration hợp lệ hơn
            if (p.seekableDuration > 0 && p.seekableDuration < 100000) {
              player.setDuration(p.seekableDuration);
            }
          }}
          onEnd={onVideoEnd}
        />
      )}

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
