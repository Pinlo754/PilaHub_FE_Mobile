import React from 'react';
import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

type Props = {
  mode: 'front' | 'side';
};

export default function BodySilhouetteOverlay({ mode }: Props) {
  return (
    <View
      pointerEvents="none"
      className="absolute inset-0 items-center justify-center"
    >
      <View className="w-3/4 h-4/5 items-center justify-center">
        <Svg width="100%" height="100%" viewBox="0 0 200 400">

          {mode === 'front' && (
            <Path
              d="
                M100 20
                C 90 40, 80 60, 80 80
                C 80 100, 120 100, 120 80
                C 120 60, 110 40, 100 20

                M80 80
                C 60 130, 55 170, 60 210
                C 65 250, 70 280, 80 320
                C 85 340, 90 360, 100 380
                C 110 360, 115 340, 120 320
                C 130 280, 135 250, 140 210
                C 145 170, 140 130, 120 80
              "
              fill="none"
              stroke="white"
              strokeWidth={3}
            />
          )}

          {mode === 'side' && (
            <Path
              d="
                M110 25
                C 105 40, 100 55, 100 70
                C 100 80, 110 90, 115 95

                M100 70
                C 90 110, 95 135, 100 150
                C 105 165, 110 180, 105 195
                C 100 210, 90 225, 95 240
                C 100 255, 110 270, 108 290
                C 106 310, 102 340, 100 370
              "
              fill="none"
              stroke="white"
              strokeWidth={3}
            />
          )}
        </Svg>
      </View>
    </View>
  );
}
