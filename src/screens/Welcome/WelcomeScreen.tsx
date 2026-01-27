import PagerView from 'react-native-pager-view';
import React, { useRef } from 'react'
import { RootStackParamList } from '../../navigation/AppNavigator';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { slides } from './slides';
import SlideItem from './SlideItem';
import { Animated } from 'react-native';
type Props = NativeStackScreenProps<RootStackParamList, 'Welcome'>;
const WelcomeScreen: React.FC<Props> = ({ navigation }) => {
    const pagerRef = useRef<PagerView>(null);
    const animatedIndex = useRef(new Animated.Value(0)).current;
    const [currentIndex, setCurrentIndex] = React.useState(0);
    const goNext = () => {
      if (currentIndex === slides.length - 1) {
        navigation.replace('Onboarding');
      } else {
        pagerRef.current?.setPage(currentIndex + 1);
      }
    }
    const onPageSelected = (e: any) => {
      const index = e.nativeEvent.position;
      setCurrentIndex(index);
      Animated.spring(animatedIndex, {
        toValue: index,
        useNativeDriver: true,
        friction: 8,
        tension: 80,
      }).start();
    }

  return (
    <PagerView ref={pagerRef} style={{ flex: 1 }}
    onPageSelected={onPageSelected}>
      {slides.map((slide, index) => (
        <SlideItem
          key={slide.id}
          index={index}
          total={slides.length}
          animatedIndex={animatedIndex}
          title={slide.title}
          subtitle={slide.subtitle}
          showSkip={slide.showSkip}
          onNext={goNext}
          onSkip={() => navigation.replace('Login')}
        />
        ))}
      </PagerView>
  );

}

export default WelcomeScreen