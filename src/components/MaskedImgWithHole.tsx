import React from 'react';
import { View, Dimensions } from 'react-native';
import Svg, {
  Defs,
  Mask,
  Rect,
  Circle,
  Image as SvgImage,
} from 'react-native-svg';

const { width } = Dimensions.get('window');

type Props = {
  imageUri: string;
  holeRadius?: number;
};

const MaskedImgWithHole = ({ imageUri, holeRadius = 42 }: Props) => {
  const cardWidth = width - 30;
  const cardHeight = 220;
  const holeX = 35;
  const holeY = 35;

  const visibleRadius = 3;
  const visibleX_1 = 64;
  const visibleY_1 = 3;
  const visibleX_2 = 3;
  const visibleY_2 = 64;

  return (
    <View>
      <Svg width={cardWidth} height={cardHeight}>
        <Defs>
          <Mask id="holeMask">
            {/* White = visible */}
            <Rect width="100%" height="100%" rx="5" ry="5" fill="white" />

            {/* Black = cut out */}
            <Circle cx={holeX} cy={holeY} r={holeRadius} fill="black" />
            <Rect width="63" height="63" rx="0" ry="0" fill="black" />

            {/* Circle phụ để bo cong cạnh phải */}
            <Circle
              cx={visibleX_1}
              cy={visibleY_1}
              r={visibleRadius}
              fill="white"
            />

            {/* Circle phụ để bo cong cạnh dưới */}
            <Circle
              cx={visibleX_2}
              cy={visibleY_2}
              r={visibleRadius}
              fill="white"
            />
          </Mask>
        </Defs>

        <SvgImage
          href={{ uri: imageUri }}
          width="100%"
          height="100%"
          preserveAspectRatio="xMidYMid slice"
          mask="url(#holeMask)"
        />
      </Svg>
    </View>
  );
};

export default MaskedImgWithHole;
