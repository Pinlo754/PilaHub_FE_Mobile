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
  
  const initialIndex = Math.max(0, ages.findIndex(a => a === (data.age ?? 28)));
  const [selectedIndex, setSelectedIndex] = useState<number>(initialIndex);
  const selectedAge = ages[selectedIndex];

  // scroll to initial index once on mount
  useEffect(() => {
    setTimeout(() => {
      listRef.current?.scrollToOffset({ offset: selectedIndex * ITEM_WIDTH, animated: false });
    }, 50);
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

  return {
    ages,
    scrollX,
    listRef,
    selectedAge,
    onMomentumEnd,
    onNext,
    onBack,
  };
};
