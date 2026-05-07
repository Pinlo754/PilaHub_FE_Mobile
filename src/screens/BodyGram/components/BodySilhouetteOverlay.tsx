import React from 'react';
import { View, Image, ImageStyle } from 'react-native';

type Props = {
  mode: 'front' | 'side';
  isFrontCamera?: boolean;     // Nhận biết đang dùng camera trước hay sau
};

export default function BodySilhouetteOverlay({ 
  mode, 
  isFrontCamera = false 
}: Props) {

  const imageSource =
    mode === 'front'
      ? require('../../../assets/front.png')
      : require('../../../assets/right.png');

  // Chỉ flip tấm right khi dùng camera trước
  const shouldFlip = mode === 'side' && isFrontCamera;

  const imageStyle: ImageStyle =
    mode === 'front'
      ? {
          width: '200%',
          height: '100%',
          resizeMode: 'contain',
          // transform: [
          //   { translateY: 20 },
          // ],
        }
      : {
          width: '145%',
          height: '100%',
          resizeMode: 'contain',
          transform: [
            // Flip ngang tấm right khi dùng camera trước
            ...(shouldFlip ? [{ scaleX: -1 }] : []),
            {
              translateY: 25,        // Giữ nguyên giá trị cũ của bạn
            },
          ],
        };

  return (
    <View
      pointerEvents="none"
      className="absolute inset-0 items-center justify-center"
    >
      <View className="w-3/4 h-4/5 items-center justify-center">
        <Image 
          source={imageSource} 
          style={imageStyle} 
        />
      </View>
    </View>
  );
}