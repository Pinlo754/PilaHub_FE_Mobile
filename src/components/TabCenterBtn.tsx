import Ionicons from '@react-native-vector-icons/ionicons';
import { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { Pressable } from 'react-native';

export const RenderCenterTabBtn = (props: BottomTabBarButtonProps) => {
  return <TabCenterBtn {...props} />;
};

const TabCenterBtn = (props: BottomTabBarButtonProps) => {
  const {
    accessibilityState,
    onPress,
    onLongPress,
    accessibilityRole,
    testID,
  } = props;
  const focused = accessibilityState?.selected;
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityRole={accessibilityRole}
      testID={testID}
      className={`absolute -top-10 self-center w-[60px] h-[60px] rounded-full flex justify-center items-center pt-1 ${focused ? 'bg-foreground' : 'bg-secondaryText'} `}
    >
      <Ionicons name="git-network-outline" size={30} color="#FFF" />
    </Pressable>
  );
};

export default TabCenterBtn;
