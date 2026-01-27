import { useEffect, useRef, useState } from 'react';
import { Animated } from 'react-native';
import { useOnboardingStore } from '../../../../store/onboarding.store';


export const ITEM_HEIGHT = 42;
export const CM_MIN = 120;
export const CM_MAX = 240;

export const HEIGHTS = Array.from(
  { length: CM_MAX - CM_MIN + 1 },
  (_, i) => CM_MIN + i
);

export const useHeightLogic = () => {
  const { data, setData, step, setStep } = useOnboardingStore();

  const scrollY = useRef(new Animated.Value(0)).current;
  const listRef = useRef<Animated.FlatList<number>>(null);

  const height = data.height ?? 165;
  const [currentIndex, setCurrentIndex] = useState(
    HEIGHTS.findIndex(v => v === height)
  );

  // scroll về đúng vị trí khi mở step
  useEffect(() => {
    setTimeout(() => {
      listRef.current?.scrollToOffset({
        offset: currentIndex * ITEM_HEIGHT,
        animated: false,
      });
    }, 50);
  }, [currentIndex]);

  const onMomentumEnd = (e: any) => {
    const index = Math.round(
      e.nativeEvent.contentOffset.y / ITEM_HEIGHT
    );
    setCurrentIndex(index);
    setData({ height: HEIGHTS[index], heightUnit: 'cm' });
  };

  return {
    HEIGHTS,
    ITEM_HEIGHT,
    scrollY,
    listRef,
    currentHeight: HEIGHTS[currentIndex],
    currentIndex,
    onMomentumEnd,
    onNext: () => setStep(step + 1),
    onBack: () => setStep(step - 1),
  };
};
