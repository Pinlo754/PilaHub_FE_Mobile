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
};

export function VideoControls({
  paused,
  duration,
  currentTime,
  onPlay,
  onSeek,
  onSeekBy,
}: Props) {
  return (
    <View className={`px-4 pb-10`}>
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

      <View className="absolute top-[160px] left-4 right-4 self-center">
        {/* Arrows */}
        {/* <View className="flex-row justify-around items-center gap-10 mb-8">
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
        </View> */}

        {/* Progress Bar */}
        <VideoProgress
          duration={duration}
          currentTime={currentTime}
          onSeek={onSeek}
        />

        {/* Time */}
        <View className="flex-row absolute -bottom-4 left-[18px]">
          <Text className="color-background text-xs font-medium">
            {formatTime(currentTime, { pad: true })} /{' '}
            {formatTime(duration, { pad: true })}
          </Text>
        </View>
      </View>
    </View>
  );
}
