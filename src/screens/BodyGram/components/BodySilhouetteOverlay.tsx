import React from 'react';
import { View, Image } from 'react-native';
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
        {mode === 'front' ? (
          <Image
            source={require('../../../assets/front.png')}
            style={{ width: '100%', height: '100%', resizeMode: 'contain' }}
          />
        ) : (
          <Svg width="100%" height="100%" viewBox="0 0 200 400">
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
          </Svg>
        )}
      </View>
    </View>
  );
}
