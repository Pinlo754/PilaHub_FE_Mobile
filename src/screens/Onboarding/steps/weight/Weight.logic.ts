import { useEffect, useRef, useState } from 'react';
import { Animated } from 'react-native';
import { WeightUnit } from './Weight.type';
import { useOnboardingStore } from '../../../../store/onboarding.store';

export const ITEM_WIDTH = 40;

const KG_MIN = 30;
const KG_MAX = 150;
const KG_TO_LB = 2.20462;
const round1 = (v: number) => Math.round(v * 2) / 2;

export const useWeightLogic = () => {
  const { data, setData, step, setStep } = useOnboardingStore();

  const scrollX = useRef(new Animated.Value(0)).current;
  const listRef = useRef<Animated.FlatList<number>>(null);

  const unit: WeightUnit = data.weightUnit ?? 'kg';
  const savedWeight = data.weight ?? 75;

  const min = KG_MIN;
  const max = KG_MAX;

  /** full list: 30 → 150 (0.5kg) */
  const weights = Array.from(
    { length: (max - min) * 2 + 1 },
    (_, i) => min + i * 0.5
  );

  /** realtime preview */
  const [previewWeight, setPreviewWeight] = useState(savedWeight);

  /** scroll to saved weight on mount */
  const didInitScroll = useRef(false);

useEffect(() => {
  if (didInitScroll.current) return;

  const index = weights.findIndex(
    (w) => w === round1(savedWeight)
  );

  if (index >= 0) {
    setTimeout(() => {
      listRef.current?.scrollToOffset({
        offset: index * ITEM_WIDTH,
        animated: false,
      });
      didInitScroll.current = true;
    }, 20);
  }
}, [savedWeight, weights]);


  /** realtime scroll listener */
  useEffect(() => {
    const id = scrollX.addListener(({ value }) => {
      const index = Math.round(value / ITEM_WIDTH);
      const w = weights[index];
      if (w !== undefined) {
        setPreviewWeight(w);
      }
    });

    return () => scrollX.removeListener(id);
  }, [scrollX, weights]);

  /** save when user release */
  const onMomentumEnd = (e: any) => {
    const index = Math.round(
      e.nativeEvent.contentOffset.x / ITEM_WIDTH
    );
    const w = weights[index];
    if (w !== undefined) {
      setData({ weight: w });
    }
  };

  /** switch KG / LB */
  const setUnit = (u: WeightUnit) => {
    if (u === unit) return;

    if (u === 'lb') {
      setData({
        weightUnit: 'lb',
        weight: round1(savedWeight * KG_TO_LB),
      });
    } else {
      setData({
        weightUnit: 'kg',
        weight: round1(savedWeight / KG_TO_LB),
      });
    }
  };

  /** display number (realtime) */
  const displayWeight =
    unit === 'kg'
      ? round1(previewWeight)
      : round1(previewWeight * KG_TO_LB);

  const onNext = () => setStep(step + 1);
  const onBack = () => step > 0 && setStep(step - 1);

  return {
    weights,
    unit,
    displayWeight,
    scrollX,
    listRef,
    setUnit,
    onMomentumEnd,
    onNext,
    onBack,
  };
};
