import React from 'react';
import { Pressable, View, Dimensions, Alert } from 'react-native';
import { VideoSurface } from './VideoSurface';
import { VideoControls } from './VideoControls';
import { useVideoPlayer } from '../../../../hooks/useVideoPlayer';
import { exerciseRoadmapService } from '../../../../hooks/exerciseRoadmap.service';

const { height } = Dimensions.get('window');

type Props = {
  source?: string | null;
  isVideoPlay: boolean;
  isVideoExpand: boolean;
  toggleVideoExpand: () => void;
  isPracticeTab: boolean;
  setIsShowFlag: (v: boolean) => void;
  personalExerciseId?: string; // optional id passed from parent
  personalScheduleId?: string; // optional schedule id
  onEnd?: () => Promise<void> | void;
  onLoad?: (duration: number) => void;
  onProgress?: (currentTime: number, duration: number) => void;
  hideControls?: boolean;
};

export default function VideoPlayer({
  source,
  isVideoPlay,
  isVideoExpand,
  toggleVideoExpand,
  isPracticeTab,
  setIsShowFlag,
  personalExerciseId,
  personalScheduleId,
  onEnd,
  onLoad,
  onProgress,
  hideControls,
}: Props) {
  // HOOOK
  const player = useVideoPlayer({
    isVideoPlay,
    setIsShowControls: setIsShowFlag,
  });

  const onVideoComplete = async () => {
    try {
      // if parent provided onEnd, delegate completion handling to parent
      if (typeof onEnd === 'function') {
        await onEnd();
        return;
      }
      if (!personalExerciseId) return;
      console.log('[VideoPlayer] marking exercise complete', personalExerciseId);
      await exerciseRoadmapService.completePersonalExercise(personalExerciseId);
      console.log('[VideoPlayer] exercise marked complete');

      if (personalScheduleId) {
        const exercises = await exerciseRoadmapService.getExercisesBySchedule(personalScheduleId);
        const allDone = Array.isArray(exercises) && exercises.every((e: any) => e.completed === true || e.isCompleted === true || e.is_completed === true);
        if (allDone) {
          console.log('[VideoPlayer] all exercises done for schedule, marking schedule complete', personalScheduleId);
          await exerciseRoadmapService.completePersonalSchedule(personalScheduleId);
          console.log('[VideoPlayer] schedule marked complete');
        }
      }

      // basic user feedback
      Alert.alert('Hoàn thành', 'Bài tập được đánh dấu hoàn thành');
    } catch (err: any) {
      console.error('[VideoPlayer] complete error', err);
      Alert.alert('Lỗi', 'Không thể đánh dấu hoàn thành. Vui lòng thử lại.');
    }
  };

  return (
    <View
      className="w-full"
      style={{ height: isVideoExpand ? height * 0.95 : height * 0.5 }}
    >
      <VideoSurface
        videoRef={player.videoRef}
        source={String(source ?? '')}
        paused={!isVideoPlay}
        onLoad={d => {
          player.setDuration(d.duration);
          if (typeof onLoad === 'function') onLoad(d.duration);
        }}
        onProgress={p => {
          player.setCurrentTime(p.currentTime);
          if (typeof onProgress === 'function') onProgress(p.currentTime, player.duration);
        }}
        onEnd={onVideoComplete}
      />

      <Pressable onPress={player.onTouchPlayer} className="absolute inset-0">
        {/* CONTROLS */}
        {player.showControls && !hideControls && (
          <View className="absolute inset-0 justify-end bg-black/20">
            <VideoControls
              duration={player.duration}
              currentTime={player.currentTime}
              onSeek={player.seek}
              onSeekBy={player.seekBy}
              onFullscreen={toggleVideoExpand}
              isFullscreen={isVideoExpand}
              isPracticeTab={isPracticeTab}
              onCompleteReached={onVideoComplete}
            />
          </View>
        )}
      </Pressable>
    </View>
  );
}
