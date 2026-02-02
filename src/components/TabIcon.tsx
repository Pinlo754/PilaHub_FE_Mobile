import Ionicons from '@react-native-vector-icons/ionicons';

type Props = {
  color: string;
  size?: number;
  focused: boolean;
};

type IconName = React.ComponentProps<typeof Ionicons>['name'];

export const TabIcon =
  (outline: IconName, fill: IconName, baseSize = 22, baseColor?: string) =>
  ({ color, size, focused }: Props) => {
    const finalSize = baseSize ?? size;

    const finalColor = baseColor ?? color;

    return (
      <Ionicons
        name={focused ? fill : outline}
        size={finalSize}
        color={finalColor}
      />
    );
  };
