import { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { Pressable } from 'react-native';
import { useIsFocused, useNavigation } from '@react-navigation/native';

export const RenderCenterTabBtn = (props: BottomTabBarButtonProps) => {
  return <TabCenterBtn {...props} />;
};

const TabCenterBtn = (props: BottomTabBarButtonProps) => {
  const { onPress, children } = props;
  const isFocused = useIsFocused();
  const nav: any = useNavigation();
  return (
    <Pressable
      onPress={(e) => {
        console.log('Center tab pressed');
        try {
          // navigate immediately to Roadmap (deterministic)
          try {
            nav.navigate('Roadmap');
          } catch (navErr) {
            console.warn('navigate Roadmap failed', navErr);
          }
          // still call provided onPress handler if present
          if (onPress) onPress(e as any);
        } catch (err) {
          console.warn('Error handling center tab press', err);
        }
      }}
      className={`absolute -top-10 self-center w-[60px] h-[60px] rounded-full flex justify-center items-center pt-1 ${isFocused ? 'bg-foreground' : 'bg-secondaryText'} `}
    >
      {children}
    </Pressable>
  );
};

export default TabCenterBtn;
