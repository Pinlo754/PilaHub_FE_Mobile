import React from 'react';
import { View, Image, ImageStyle } from 'react-native';

type Props = {
  mode: 'front' | 'side';
};

export default function BodySilhouetteOverlay({ mode }: Props) {
  const imageSource =
    mode === 'front'
      ? require('../../../assets/front.png')
      : require('../../../assets/right.png');

  const imageStyle: ImageStyle =
    mode === 'front'
      ? {
          width: '200%',
          height: '100%',
          resizeMode: 'contain',
          // transform: [
          //   {
          //     translateY: 20, // chỉnh ảnh front xuống / lên ở đây
          //   },
          // ],
        }
      : {
          width: '145%',
          height: '100%',
          resizeMode: 'contain',
          transform: [
            {
              translateY: 25, // chỉnh ảnh side xuống / lên ở đây
            },
          ],
        };

  return (
    <View
      pointerEvents="none"
      className="absolute inset-0 items-center justify-center"
    >
      <View className="w-3/4 h-4/5 items-center justify-center">
        <Image source={imageSource} style={imageStyle} />
      </View>
    </View>
  );
}