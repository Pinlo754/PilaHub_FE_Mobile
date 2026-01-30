import { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { Pressable } from 'react-native';
import { useIsFocused } from '@react-navigation/native';

export const RenderCenterTabBtn = (props: BottomTabBarButtonProps) => {
  return <TabCenterBtn {...props} />;
};

const TabCenterBtn = (props: BottomTabBarButtonProps) => {
  const { onPress, children } = props;
  const isFocused = useIsFocused();
  return (
    <Pressable
      onPress={onPress}
      className={`absolute -top-10 self-center w-[60px] h-[60px] rounded-full flex justify-center items-center pt-1 ${isFocused ? 'bg-foreground' : 'bg-secondaryText'} `}
    >
      {children}
    </Pressable>
  );
};

export default TabCenterBtn;
