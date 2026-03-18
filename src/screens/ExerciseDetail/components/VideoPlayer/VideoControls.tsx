import React from 'react';
import { View, Pressable, Text } from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { VideoProgress } from './VideoProgress';
import { colors } from '../../../../theme/colors';
import { formatTime } from '../../../../utils/time';

type Props = {
  duration: number;
  currentTime: number;
  onSeek: (v: number) => void;
  onSeekBy: (v: number) => void;
  onFullscreen: () => void;
  isFullscreen: boolean;
  isPracticeTab: boolean;
  onCompleteReached?: () => void;
};

export function VideoControls({
  duration,
  currentTime,
  onSeek,
  onSeekBy,
  onFullscreen,
  isFullscreen,
  isPracticeTab,
  onCompleteReached,
}: Props) {
  React.useEffect(() => {
    if (duration > 0 && currentTime >= duration - 0.5) {
      onCompleteReached?.();
    }
  }, [currentTime, duration, onCompleteReached]);

  return (
    <View className={`px-4  ${isFullscreen ? 'pb-20 mb-2' : 'pb-14'}`}>
      {/* Arrows */}
      {isPracticeTab && (
        <View className="flex-row justify-around items-center gap-10 mb-3">
          {/* Back */}
          <Pressable className="flex-row items-center gap-1">
            <Ionicons
              name="chevron-back-outline"
              size={18}
              color={colors.background.DEFAULT}
            />
            <Text className="color-background text-sm font-medium">
              Động tác trước
            </Text>
          </Pressable>

          {/* Forward */}
          <Pressable className="flex-row items-center gap-1">
            <Text className="color-background text-sm font-medium">
              Động tác sau
            </Text>
            <Ionicons
              name="chevron-forward-outline"
              size={18}
              color={colors.background.DEFAULT}
            />
          </Pressable>
        </View>
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
        <View className="flex-row items-center gap-32 pt-3 self-center">
          <Pressable onPress={() => onSeekBy(-10)}>
            <Ionicons
              name="play-back"
              size={26}
              color={colors.background.DEFAULT}
            />
          </Pressable>

          <Pressable onPress={() => onSeekBy(10)}>
            <Ionicons
              name="play-forward"
              size={26}
              color={colors.background.DEFAULT}
            />
          </Pressable>
        </View>

        {/* Expand / Shrink */}
        {!isPracticeTab && (
          <Pressable onPress={onFullscreen} className="absolute top-3 right-4">
            <Ionicons
              name={isFullscreen ? 'contract' : 'expand'}
              size={24}
              color={colors.background.DEFAULT}
            />
          </Pressable>
        )}
      </View>
    </View>
  );
}
