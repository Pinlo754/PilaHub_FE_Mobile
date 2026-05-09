import React from 'react';
import { View, Pressable, Text } from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { VideoProgress } from './VideoProgress';
import { colors } from '../../../../theme/colors';
import { formatTime } from '../../../../utils/time';

type Props = {
  paused: boolean;
  duration: number;
  currentTime: number;
  onPlay: () => void;
  onSeek: (v: number) => void;
  onSeekBy: (v: number) => void;
  onFullscreen?: () => void;
  isFullscreen: boolean;
  hideFullscreen?: boolean;
  onBack?: () => void;
  reset?: () => void;
};

export function VideoControls({
  paused,
  duration,
  currentTime,
  onPlay,
  onSeek,
  onSeekBy,
  onFullscreen,
  isFullscreen,
  hideFullscreen,
  onBack,
  reset,
}: Props) {
  // HANDLERS
  const onPressBack = () => {
    onBack?.();
    reset?.();
  };

  return (
    <View className={`px-4 ${isFullscreen ? 'pb-8' : 'pb-2'}`}>
      {/* Back */}
      {onBack && (
        <Pressable
          onPress={onPressBack}
          className="bg-black/40 rounded-full w-10 h-10 flex justify-center items-center"
           style={{ position: 'absolute', top: -290, left: 24, zIndex: 10 }}
        >
          <Ionicons
            name="chevron-back-outline"
            size={24}
            color={colors.background.DEFAULT}
          />
        </Pressable>
      )}

      {/* Progress Bar */}
      <VideoProgress
        duration={duration}
        currentTime={currentTime}
        onSeek={onSeek}
      />

      <View className="">
        {/* Time */}
        <View className="flex-row absolute top-0 left-4">
          <Text className="color-background text-xs font-medium">
            {formatTime(currentTime, { pad: true })} /{' '}
            {formatTime(duration, { pad: true })}
          </Text>
        </View>

        {/* Control */}
        <View className="flex-row items-center gap-10 self-center">
          <Pressable onPress={() => onSeekBy(-10)}>
            <Ionicons
              name="play-back"
              size={24}
              color={colors.background.DEFAULT}
            />
          </Pressable>

          <Pressable onPress={onPlay}>
            <Ionicons
              name={paused ? 'play-circle-outline' : 'pause-circle-outline'}
              size={45}
              color={colors.background.DEFAULT}
            />
          </Pressable>

          <Pressable onPress={() => onSeekBy(10)}>
            <Ionicons
              name="play-forward"
              size={24}
              color={colors.background.DEFAULT}
            />
          </Pressable>
        </View>

        {/* Expand / Shrink */}
        {!hideFullscreen && (
          <Pressable onPress={onFullscreen} className="absolute top-3 right-4">
            <Ionicons
              name={isFullscreen ? 'contract' : 'expand'}
              size={22}
              color={colors.background.DEFAULT}
            />
          </Pressable>
        )}
      </View>
    </View>
  );
}
