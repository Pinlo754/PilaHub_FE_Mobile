import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors } from '../../../theme/colors';

type Props = {
  size?: number;
  strokeWidth?: number;
  progress: number;
  max?: number;
  isPass: boolean;
};

export const ProgressSemicircle = ({
  size = 200,
  strokeWidth = 14,
  progress,
  max = 100,
  isPass,
}: Props) => {
  const radius = (size - strokeWidth) / 2;
  const full = 2 * Math.PI * radius;

  const ARC_RATIO = 0.75;
  const arcLength = full * ARC_RATIO;

  const percent = Math.min(Math.max(progress / max, 0), 1);
  const strokeDashoffset = arcLength * (1 - percent);

  return (
    <View className="items-center justify-center">
      <Svg width={size} height={size}>
        {/* Background */}
        <Circle
          stroke={colors.background.DEFAULT}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${arcLength} ${full}`}
          strokeLinecap="round"
          rotation="135"
          origin={`${size / 2}, ${size / 2}`}
        />

        {/* Progress */}
        <Circle
          stroke={isPass ? colors.success.DEFAULT : colors.danger.DEFAULT}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${arcLength} ${full}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="135"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>

      {/* Center */}
      <View
        className="absolute bg-background rounded-full items-center justify-center self-center"
        style={{ width: 130, height: 130 }}
      >
        <Text
          className={`pt-2 text-5xl font-bold ${
            isPass ? 'color-success' : 'color-danger'
          }`}
        >
          {progress}
        </Text>

        <View
          className={`w-20 h-[2px] my-1 ${isPass ? 'bg-success' : 'bg-danger'}`}
        />

        <Text
          className={`text-2xl font-bold ${
            isPass ? 'color-success' : 'color-danger'
          }`}
        >
          {max}
        </Text>
      </View>
    </View>
  );
};
