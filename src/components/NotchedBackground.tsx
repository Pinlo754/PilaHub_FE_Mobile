import Svg, { Path } from 'react-native-svg';
import { Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

type Props = {
  height?: number;
  notchRadius?: number;
  notchX?: number;
  backgroundColor?: string;
  cornerRadius?: number;
  shoulderRadius?: number;
};

const NotchedBackground = ({
  height = 90,
  notchRadius = 30,
  notchX,
  backgroundColor = '#FFF7ED',
  cornerRadius = 0,
  shoulderRadius = 16,
}: Props) => {
  const centerX = notchX ?? width / 2;

  // Khoảng cách từ tâm đến điểm bắt đầu bo góc
  const notchWidth = notchRadius * 2;
  const leftNotchStart = centerX - notchWidth / 2;
  const rightNotchStart = centerX + notchWidth / 2;

  const rx = notchRadius;
  const ry = notchRadius;

  // Tạo đường cong hình bán nguyệt hoàn hảo lõm xuống với 2 góc bo mềm mại
  const path = `
    M 0 ${cornerRadius}
    ${cornerRadius > 0 ? `Q 0 0, ${cornerRadius} 0` : 'L 0 0'}
    
    L ${leftNotchStart - shoulderRadius} 0
    
    C ${leftNotchStart - shoulderRadius - 10} 0,
    ${leftNotchStart - 5} 0,
    ${leftNotchStart + 4} ${shoulderRadius + 1}
    
    A ${rx} ${ry + 3} 0 0 0 ${rightNotchStart - 2} ${shoulderRadius - 2}
    
    C ${rightNotchStart - 4} ${shoulderRadius + 5},
    ${rightNotchStart + 3} 0,
    ${rightNotchStart + shoulderRadius + 5} 0
    
    L ${width - cornerRadius} 0
    ${cornerRadius > 0 ? `Q ${width} 0, ${width} ${cornerRadius}` : `L ${width} 0`}
    
    L ${width} ${height}
    L 0 ${height}
    
    Z
  `;

  return (
    <Svg width={width + 1} height={height}>
      <Path d={path} fill={backgroundColor} />
    </Svg>
  );
};

export default NotchedBackground;
