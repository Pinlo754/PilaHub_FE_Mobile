import { useEffect, useRef, useState } from 'react';
import { Animated } from 'react-native';
import { useOnboardingStore } from '../../../../store/onboarding.store';


export const ITEM_HEIGHT = 64; // increase item height to make ruler larger and finger interaction smoother
export const CM_MIN = 120;
export const CM_MAX = 240;

export const HEIGHTS = Array.from(
  { length: CM_MAX - CM_MIN + 1 },
  (_, i) => CM_MIN + i
);

export const useHeightLogic = () => {
  const { data, setData, step, setStep } = useOnboardingStore();

  const scrollY = useRef(new Animated.Value(0)).current;
  const listRef = useRef<Animated.FlatList<number> | null>(null);

  const height = data.height ?? 165;
  const initialIndex = Math.max(0, HEIGHTS.findIndex(v => v === height));
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  // scroll về đúng vị trí khi mở step
  useEffect(() => {
    setTimeout(() => {
      listRef.current?.scrollToOffset({
        offset: currentIndex * ITEM_HEIGHT,
        animated: false,
      });
    }, 50);
    // run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // keep in sync if external data.height changes
  useEffect(() => {
    const idx = Math.max(0, HEIGHTS.findIndex(v => v === (data.height ?? height)));
    if (idx !== currentIndex) {
      setCurrentIndex(idx);
      // snap to new index without animation to avoid visual jump
      setTimeout(() => {
        listRef.current?.scrollToOffset({ offset: idx * ITEM_HEIGHT, animated: false });
      }, 30);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.height]);

  const onMomentumEnd = (e: any) => {
    const rawIndex = e.nativeEvent.contentOffset.y / ITEM_HEIGHT;
    const index = Math.round(rawIndex);
    const safeIndex = Math.max(0, Math.min(HEIGHTS.length - 1, index));

    if (safeIndex !== currentIndex) setCurrentIndex(safeIndex);

    // snap to exact offset to avoid half-pixel drift
    setTimeout(() => {
      listRef.current?.scrollToOffset({ offset: safeIndex * ITEM_HEIGHT, animated: true });
    }, 0);

    setData({ height: HEIGHTS[safeIndex], heightUnit: 'cm' });
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
