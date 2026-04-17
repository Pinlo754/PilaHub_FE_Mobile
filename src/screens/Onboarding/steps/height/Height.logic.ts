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

  // helper for FlatList measurement (so FlatList can compute positions precisely)
  const getItemLayout = (_: any, index: number) => ({ length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index, index });

  // scroll to correct position once on mount using requestAnimationFrame + scrollToIndex when available
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      try {
        if (listRef.current && typeof (listRef.current as any).scrollToIndex === 'function') {
          (listRef.current as any).scrollToIndex({ index: initialIndex, animated: false, viewPosition: 0.5 });
        } else {
          listRef.current?.scrollToOffset({ offset: currentIndex * ITEM_HEIGHT, animated: false });
        }
      } catch {
        // fallback to offset after a short delay
        setTimeout(() => { listRef.current?.scrollToOffset({ offset: currentIndex * ITEM_HEIGHT, animated: false }); }, 80);
      }
    });

    return () => cancelAnimationFrame(raf);
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
    // expose helper props for FlatList
    getItemLayout,
    initialIndex,
  };
};
