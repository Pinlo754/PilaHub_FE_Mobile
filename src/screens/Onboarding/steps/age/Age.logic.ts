import { useRef, useState, useEffect } from 'react';
import { Animated } from 'react-native';
import { useOnboardingStore } from '../../../../store/onboarding.store';


const MIN_AGE = 12;
const MAX_AGE = 80;
export const ITEM_WIDTH = 96; // larger item width for smoother interaction

export const useAgeLogic = () => {
  const { data, setData, step, setStep } = useOnboardingStore();
  const scrollX = useRef(new Animated.Value(0)).current;
  const listRef = useRef<Animated.FlatList<number> | null>(null);

  // compute initial index from stored age
  const ages = Array.from(
    { length: MAX_AGE - MIN_AGE + 1 },
    (_, i) => MIN_AGE + i
  );
  
  const initialIndex = Math.max(0, ages.findIndex(a => a === (data.age ?? 21)));
  const [selectedIndex, setSelectedIndex] = useState<number>(initialIndex);
  const selectedAge = ages[selectedIndex];

  // getItemLayout helper so FlatList can measure items precisely
  const getItemLayout = (_: any, index: number) => ({ length: ITEM_WIDTH, offset: ITEM_WIDTH * index, index });

  // scroll to initial index once on mount using scrollToIndex on next animation frame
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      try {
        if (listRef.current && typeof listRef.current?.scrollToIndex === 'function') {
          // center the item roughly by using viewPosition 0.5
          (listRef.current as any).scrollToIndex({ index: initialIndex, animated: false, viewPosition: 0.5 });
        } else {
          // fallback to scrollToOffset
          listRef.current?.scrollToOffset({ offset: initialIndex * ITEM_WIDTH, animated: false });
        }
      } catch {
        // ignore index errors (may occur if list not yet populated)
        // fallback to offset after small delay
        setTimeout(() => {
          try {
            listRef.current?.scrollToOffset({ offset: initialIndex * ITEM_WIDTH, animated: false });
          } catch {}
        }, 50);
      }
    });

    return () => cancelAnimationFrame(raf);
    // run only once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onMomentumEnd = (e: any) => {
    const index = Math.round(
      e.nativeEvent.contentOffset.x / ITEM_WIDTH
    );
    const safeIndex = Math.max(0, Math.min(ages.length - 1, index));
    setSelectedIndex(safeIndex);
    setData({ age: ages[safeIndex] });
  };

  const onNext = () => setStep(step + 1);
  const onBack = () => step > 0 && setStep(step - 1);

  // only allow continue when age has been saved into onboarding store (persisted)
  const canContinue = typeof data.age === 'number' && !isNaN(data.age);

  return {
    ages,
    scrollX,
    listRef,
    selectedAge,
    onMomentumEnd,
    onNext,
    onBack,
    // expose helper props for FlatList
    initialIndex,
    getItemLayout,
    canContinue,
  };
};
