import React, { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { VideoSurface } from './VideoSurface';
import { VideoControls } from './VideoControls';
import Orientation from 'react-native-orientation-locker';
import { useWindowDimensions } from 'react-native';
import { useVideoPlayer } from '../../../../../hooks/useVideoPlayer';

type Props = {
  source: string;
  onBack: () => void;
};

export default function VideoPlayer({ source, onBack }: Props) {
  // HOOOK
  const player = useVideoPlayer({});
  const { width: W, height: H } = useWindowDimensions();
const width = Math.max(W, H);
const height = Math.min(W, H);


  useEffect(() => {
    Orientation.lockToLandscape();

    return () => {
      Orientation.lockToPortrait();
    };
  }, []);

  const [ready, setReady] = useState(false);
  
    useEffect(() => {
      const t = setTimeout(() => setReady(true), 100);
      return () => clearTimeout(t);
    }, [source]);
  
    useEffect(() => {
      player.reset();
    }, [source]);

  return (
    <View style={{ width, height }}>
      {ready && (
        <VideoSurface
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
        />
      )}

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
