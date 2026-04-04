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
};

export default function VideoPlayer({ source, isVideoPlay, isVideoExpand, toggleVideoExpand, isPracticeTab, setIsShowFlag, onEnd, onLoad: externalOnLoad, onProgress: externalOnProgress, hideControls=false, ..._rest }: Props & any) {
  const player = useVideoPlayer({ isVideoPlay, setIsShowControls: setIsShowFlag });
  const [ready, setReady] = useState(false);

  useEffect(() => { const t = setTimeout(() => setReady(true), 100); return () => clearTimeout(t); }, [source]);
  useEffect(() => { player.reset(); }, [source, player]);

  return (
    <View style={{ height: isVideoExpand ? height * 0.95 : height * 0.5 }}>
      {ready && (
        <RoadmapVideoSurface
          videoRef={player.videoRef}
          source={source}
          paused={player.paused}
          onLoad={d => { if (isFinite(d.duration)) player.setDuration(d.duration); player.setIsLoaded(true); if (externalOnLoad) externalOnLoad(d); }}
          onProgress={p => { if (!player.isLoaded && p.seekableDuration > 0) { player.setDuration(p.seekableDuration); player.setIsLoaded(true); } player.setCurrentTime(p.currentTime); if (externalOnProgress) externalOnProgress(p); }}
          onEnd={onEnd}
        />
      )}

      <Pressable onPress={player.onTouchPlayer} style={styles.pressOverlay}>
        {player.showControls && !hideControls && (
          <View style={styles.controlsOverlay}>
            <RoadmapVideoControls duration={player.duration} currentTime={player.currentTime} onSeek={player.seek} onSeekBy={player.seekBy} onFullscreen={toggleVideoExpand} isFullscreen={isVideoExpand} isPracticeTab={isPracticeTab} onCompleteReached={onEnd} />
          </View>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  pressOverlay: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
  controlsOverlay: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.2)' },
});
