import React, { useEffect, useState } from 'react';
import { View, Dimensions, Pressable, StyleSheet } from 'react-native';
import RoadmapVideoSurface from './VideoSurface';
import RoadmapVideoControls from './VideoControls';
import { useVideoPlayer } from '../../../../hooks/useVideoPlayer';

const { height } = Dimensions.get('window');

type Props = {
  source?: string | null;
  isVideoPlay: boolean;
  isVideoExpand: boolean;
  toggleVideoExpand: () => void;
  isPracticeTab: boolean;
  setIsShowFlag: (v: boolean) => void;
  onEnd?: () => void;
  onLoad?: (d: any) => void;
  onProgress?: (p: any) => void;
  hideControls?: boolean;

  // thêm prop này để video tự loop
  repeat?: boolean;
};

function VideoPlayer({
  source,
  isVideoPlay,
  isVideoExpand,
  toggleVideoExpand,
  isPracticeTab,
  setIsShowFlag,
  onEnd,
  onLoad: externalOnLoad,
  onProgress: externalOnProgress,
  hideControls = false,
  repeat = false,
}: Props) {
  const player = useVideoPlayer({
    isVideoPlay,
    setIsShowControls: setIsShowFlag,
  });

  const [ready, setReady] = useState(false);

  // Chỉ reset ready khi source đổi
  useEffect(() => {
    setReady(false);

    const t = setTimeout(() => {
      setReady(true);
    }, 100);

    return () => clearTimeout(t);
  }, [source]);

  // QUAN TRỌNG:
  // Chỉ reset video khi source đổi, không depend vào player object.
  // Nếu để [source, player], video sẽ reset mỗi lần parent re-render.
  useEffect(() => {
    player.reset();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source]);

  return (
    <View style={{ height: isVideoExpand ? height * 0.95 : height * 0.5 }}>
      {ready && (
        <RoadmapVideoSurface
          videoRef={player.videoRef}
          source={source}
          paused={player.paused}
          repeat={repeat}
          onLoad={d => {
            if (isFinite(d.duration)) {
              player.setDuration(d.duration);
            }

            player.setIsLoaded(true);

            if (externalOnLoad) {
              externalOnLoad(d);
            }
          }}
          onProgress={p => {
            if (!player.isLoaded && p.seekableDuration > 0) {
              player.setDuration(p.seekableDuration);
              player.setIsLoaded(true);
            }

            player.setCurrentTime(p.currentTime);

            if (externalOnProgress) {
              externalOnProgress(p);
            }
          }}
          onEnd={onEnd}
        />
      )}

      <Pressable onPress={player.onTouchPlayer} style={styles.pressOverlay}>
        {player.showControls && !hideControls && (
          <View style={styles.controlsOverlay}>
            <RoadmapVideoControls
              duration={player.duration}
              currentTime={player.currentTime}
              onSeek={player.seek}
              onSeekBy={player.seekBy}
              onFullscreen={toggleVideoExpand}
              isFullscreen={isVideoExpand}
              isPracticeTab={isPracticeTab}
              onCompleteReached={onEnd}
            />
          </View>
        )}
      </Pressable>
    </View>
  );
}

export default React.memo(VideoPlayer);

const styles = StyleSheet.create({
  pressOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  controlsOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
});