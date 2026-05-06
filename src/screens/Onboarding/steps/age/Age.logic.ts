import { useRef, useState, useEffect, useMemo } from 'react';
import { Animated } from 'react-native';
import { useOnboardingStore } from '../../../../store/onboarding.store';

const MIN_AGE = 12;
const MAX_AGE = 80;
const DEFAULT_AGE = 21;

export const ITEM_WIDTH = 96;

export const useAgeLogic = () => {
  const { data, setData, step, setStep } = useOnboardingStore();

  const scrollX = useRef(new Animated.Value(0)).current;
  const listRef = useRef<Animated.FlatList<number> | null>(null);

  const ages = useMemo(() => {
    return Array.from(
      { length: MAX_AGE - MIN_AGE + 1 },
      (_, i) => MIN_AGE + i,
    );
  }, []);

  const getIndexFromAge = (age?: number) => {
    const value = typeof age === 'number' ? age : DEFAULT_AGE;
    const foundIndex = ages.findIndex(item => item === value);

    if (foundIndex >= 0) {
      return foundIndex;
    }

    return ages.findIndex(item => item === DEFAULT_AGE);
  };

  const initialIndex = getIndexFromAge(data.age);

  const [selectedIndex, setSelectedIndex] = useState<number>(initialIndex);

  const selectedAge = ages[selectedIndex] ?? DEFAULT_AGE;

  const getItemLayout = (_: any, index: number) => ({
    length: ITEM_WIDTH,
    offset: ITEM_WIDTH * index,
    index,
  });

  /**
   * Khi vào lại màn Age:
   * - Lấy age từ store
   * - Set lại selectedIndex
   * - Scroll thước về đúng vị trí
   *
   * Không dùng scrollToIndex + viewPosition nữa
   * vì dễ lệch với paddingHorizontal.
   */
  useEffect(() => {
    const index = getIndexFromAge(data.age);
    const offset = index * ITEM_WIDTH;

    setSelectedIndex(index);
    scrollX.setValue(offset);

    const timer = setTimeout(() => {
      try {
        listRef.current?.scrollToOffset({
          offset,
          animated: false,
        });
      } catch {}
    }, 80);

    return () => clearTimeout(timer);
  }, [data.age, ages, scrollX]);

  const syncSelectedByOffset = (offsetX: number) => {
    const rawIndex = Math.round(offsetX / ITEM_WIDTH);
    const safeIndex = Math.max(0, Math.min(ages.length - 1, rawIndex));

    setSelectedIndex(safeIndex);
    setData({ age: ages[safeIndex] });
  };

  /**
   * Chỉ dùng onMomentumScrollEnd.
   * Không dùng thêm onScrollEndDrag vì sẽ bị gọi 2 lần,
   * gây hiện tượng nhảy qua lại liên tục.
   */
  const onMomentumEnd = (e: any) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    syncSelectedByOffset(offsetX);
  };

  const onNext = () => {
    setData({ age: selectedAge });
    setStep(step + 1);
  };

  const onBack = () => {
    if (step > 0) {
      setData({ age: selectedAge });
      setStep(step - 1);
    }
  };

  const canContinue = typeof selectedAge === 'number' && !isNaN(selectedAge);

  return {
    ages,
    scrollX,
    listRef,
    selectedAge,
    selectedIndex,
    onMomentumEnd,
    onNext,
    onBack,
    initialIndex,
    getItemLayout,
    canContinue,
  };
};