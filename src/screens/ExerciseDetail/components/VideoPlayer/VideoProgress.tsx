import React from 'react';
import Slider from '@react-native-community/slider';
import { colors } from '../../../../theme/colors';

type Props = {
  duration: number;
  currentTime: number;
  onSeek: (v: number) => void;
};

export function VideoProgress({ duration, currentTime, onSeek }: Props) {
  return (
    <Slider
      minimumValue={0}
      maximumValue={duration || 1}
      value={Math.min(currentTime, duration)}
      onSlidingComplete={onSeek}
      minimumTrackTintColor={colors.foreground}
      maximumTrackTintColor={colors.inactive.lighter}
      thumbTintColor={colors.foreground}
    />
  );
}
