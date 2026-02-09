import Ionicons from '@react-native-vector-icons/ionicons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Animated, Pressable, View } from 'react-native';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import { colors } from '../../../theme/colors';
import { useEffect, useState } from 'react';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'CoachDetail'>;
  scrollY: Animated.Value;
  coachId: string;
};

const Header = ({ navigation, scrollY, coachId }: Props) => {
  // STATE
  const [iconColor, setIconColor] = useState<string>(colors.foreground);

  // HANDLERS
  const onPressBack = () => {
    navigation.goBack();
  };

  const onPressReport = () => {
    navigation.navigate('TraineeReport', { coach_id: coachId });
  };

  // ANIMATIONS
  const bgOpacity = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  // USE EFFECT
  useEffect(() => {
    const id = scrollY.addListener(({ value }) => {
      if (value > 40) {
        setIconColor(colors.background.DEFAULT);
      } else {
        setIconColor(colors.foreground);
      }
    });

    return () => scrollY.removeListener(id);
  }, [scrollY]);

  return (
    <View className="absolute top-0 left-0 right-0 z-10">
      <Animated.View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 90,
          backgroundColor: 'rgba(0,0,0,0.4)',
          opacity: bgOpacity,
        }}
      />

      <View className="">
        <Pressable
          className="absolute top-16 left-4 z-10"
          onPress={() => onPressBack()}
        >
          <Ionicons name="chevron-back-outline" size={24} color={iconColor} />
        </Pressable>

        <Pressable
          className="absolute top-16 right-4 z-10"
          onPress={() => onPressReport()}
        >
          <Ionicons name="flag-outline" size={24} color={iconColor} />
        </Pressable>
      </View>
    </View>
  );
};

export default Header;
