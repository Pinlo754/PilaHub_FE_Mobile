import Ionicons from '@react-native-vector-icons/ionicons';
import { Pressable, Text, View } from 'react-native';
import type { ComponentProps } from 'react';

type IconName = ComponentProps<typeof Ionicons>['name'];

export type ColorType = 'primary' | 'sub1' | 'sub2';

export type RoundedType = 'lg' | 'xl' | '2xl' | '3xl' | 'full';

const COLORS = {
  primary: '#A0522D',
  sub1: '#CD853F',
  sub2: '#F5DEB3',
};

const getColors = (type: ColorType) => {
  switch (type) {
    case 'sub1':
      return {
        backgroundColor: COLORS.sub1,
        textColor: '#FFF',
      };
    case 'sub2':
      return {
        backgroundColor: COLORS.sub2,
        textColor: COLORS.primary,
      };
    case 'primary':
    default:
      return {
        backgroundColor: COLORS.primary,
        textColor: '#FFF',
      };
  }
};

type Props = {
  text: string;
  onPress: () => void;
  disabled?: boolean;
  colorType?: ColorType;
  width?: number;
  height?: number;
  rounded?: RoundedType;
  iconName?: IconName;
};

const Button = ({
  text,
  onPress,
  disabled,
  colorType = 'primary',
  width,
  height,
  rounded = 'xl',
  iconName,
}: Props) => {
  const color = getColors(colorType);

  return (
    <Pressable
      className={`flex-row gap-2 items-center px-4 ${width ? '' : 'w-full'} rounded-${rounded} ${iconName ? 'py-2' : 'py-2.5'}`}
      style={{
        backgroundColor: color.backgroundColor,
        width: width ? width : undefined,
        height: height ? height : undefined,
      }}
      onPress={onPress}
      disabled={disabled}
    >
      {/* Icon left */}
      {iconName && (
        <Ionicons name={iconName} size={26} color={color.textColor} />
      )}

      {/* Label */}
      <Text
        className={`text-lg font-semibold ${iconName ? '' : 'flex-1 text-center'}`}
        style={{ color: color.textColor }}
      >
        {text}
      </Text>

      {/* Chevron right */}
      {iconName && (
        <View className="flex-1 items-end">
          <Ionicons
            name="chevron-forward-outline"
            size={24}
            color={color.textColor}
          />
        </View>
      )}
    </Pressable>
  );
};

export default Button;
