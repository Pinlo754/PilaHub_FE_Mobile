import Ionicons from '@react-native-vector-icons/ionicons';
import { Pressable, Text, View } from 'react-native';
import type { ComponentProps } from 'react';
import { colors } from '../theme/colors';

type IconName = ComponentProps<typeof Ionicons>['name'];

export type ColorType =
  | 'primary'
  | 'sub1'
  | 'sub2'
  | 'grey'
  | 'red'
  | 'green'
  | 'yellow'
  | 'blue';

export type RoundedType = 'lg' | 'xl' | '2xl' | '3xl' | 'full';

const getColors = (type: ColorType) => {
  switch (type) {
    case 'sub1':
      return {
        backgroundColor: colors.background.sub1,
        textColor: colors.foreground,
      };
    case 'sub2':
      return {
        backgroundColor: colors.background.sub2,
        textColor: colors.foreground,
      };
    case 'blue':
      return {
        backgroundColor: colors.info.lighter,
        textColor: colors.info.darker,
      };
    case 'green':
      return {
        backgroundColor: colors.success[20],
        textColor: colors.success.DEFAULT,
      };
    case 'grey':
      return {
        backgroundColor: colors.inactive.lighter,
        textColor: colors.inactive.darker,
      };
    case 'red':
      return {
        backgroundColor: colors.danger[20],
        textColor: colors.danger.darker,
      };
    case 'yellow':
      return {
        backgroundColor: colors.warning[20],
        textColor: colors.warning.DEFAULT,
      };
    case 'primary':
    default:
      return {
        backgroundColor: colors.foreground,
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
  iconSize?: number;
  showArrow?: boolean;
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
  iconSize = 26,
  showArrow,
}: Props) => {
  const color = getColors(colorType);

  const isShowArrow = iconName || showArrow;

  return (
    <Pressable
      className={`flex-row gap-2 items-center z-2  ${width ? '' : 'w-full'} rounded-${rounded} ${iconName ? 'py-2 pl-4 pr-2' : 'py-2.5'}`}
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
        <Ionicons name={iconName} size={iconSize} color={color.textColor} />
      )}

      {/* Label */}
      <Text
        className={`text-lg font-semibold ${iconName ? 'flex-grow' : 'flex-grow text-center'}`}
        style={{ color: color.textColor }}
      >
        {text}
      </Text>

      {/* Chevron right */}
      {isShowArrow && (
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
