import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated } from 'react-native';
import { WeightUnit } from './Weight.type';
import { useOnboardingStore } from '../../../../store/onboarding.store';

export const ITEM_WIDTH = 40;

const KG_MIN = 30;
const KG_MAX = 150;
const DEFAULT_WEIGHT = 75;
const KG_TO_LB = 2.20462;

const roundHalf = (v: number) => Math.round(v * 2) / 2;

const clamp = (value: number, min: number, max: number) => {
  return Math.max(min, Math.min(max, value));
};

export const useWeightLogic = () => {
  const { data, setData, step, setStep } = useOnboardingStore();

  const scrollX = useRef(new Animated.Value(0)).current;
  const listRef = useRef<Animated.FlatList<number> | null>(null);

  /**
   * Trong store mình nên lưu weight theo KG để gửi backend ổn định.
   * Unit chỉ là để hiển thị kg/lb trên UI.
   */
  const unit: WeightUnit = data.weightUnit ?? 'kg';

  const weights = useMemo(() => {
    return Array.from(
      { length: (KG_MAX - KG_MIN) * 2 + 1 },
      (_, i) => KG_MIN + i * 0.5,
    );
  }, []);

  const getSafeWeightKg = (weight?: number) => {
    if (typeof weight !== 'number' || isNaN(weight)) {
      return DEFAULT_WEIGHT;
    }

    return clamp(roundHalf(weight), KG_MIN, KG_MAX);
  };

  const getIndexFromWeight = (weightKg?: number) => {
    const safeWeight = getSafeWeightKg(weightKg);
    const index = Math.round((safeWeight - KG_MIN) / 0.5);

    return clamp(index, 0, weights.length - 1);
  };

  const initialIndex = getIndexFromWeight(data.weight);

  const [selectedIndex, setSelectedIndex] = useState(initialIndex);

  const selectedWeightKg = weights[selectedIndex] ?? DEFAULT_WEIGHT;

  /**
   * Khi vào lại màn Weight:
   * - Lấy data.weight trong store
   * - Set lại selectedIndex
   * - Scroll thước về đúng vị trí
   */
  useEffect(() => {
    const index = getIndexFromWeight(data.weight);
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
  }, [data.weight, weights, scrollX]);

  const getItemLayout = (_: any, index: number) => ({
    length: ITEM_WIDTH,
    offset: ITEM_WIDTH * index,
    index,
  });

  /**
   * Kéo tới đâu đổi số tới đó.
   * Không setData ở đây để tránh render liên tục và giật.
   */
  const onScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    {
      useNativeDriver: false,
      listener: (event: any) => {
        const offsetX = event.nativeEvent.contentOffset.x;
        const rawIndex = Math.round(offsetX / ITEM_WIDTH);
        const safeIndex = clamp(rawIndex, 0, weights.length - 1);

        setSelectedIndex(safeIndex);
      },
    },
  );

  /**
   * Khi thả tay thì lưu cân nặng vào store.
   */
  const onMomentumEnd = (e: any) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const rawIndex = Math.round(offsetX / ITEM_WIDTH);
    const safeIndex = clamp(rawIndex, 0, weights.length - 1);

    const weightKg = weights[safeIndex];

    setSelectedIndex(safeIndex);
    setData({
      weight: weightKg,
      weightUnit: unit,
    });
  };

  const setUnit = (newUnit: WeightUnit) => {
    if (newUnit === unit) return;

    /**
     * Không đổi data.weight khi đổi unit.
     * Vì data.weight đang lưu KG.
     * Chỉ đổi weightUnit để UI hiển thị kg/lb.
     */
    setData({
      weight: selectedWeightKg,
      weightUnit: newUnit,
    });
  };

  const displayWeight =
    unit === 'kg'
      ? roundHalf(selectedWeightKg)
      : roundHalf(selectedWeightKg * KG_TO_LB);

  const prevDisplayWeight =
    unit === 'kg'
      ? roundHalf(selectedWeightKg - 0.5)
      : roundHalf((selectedWeightKg - 0.5) * KG_TO_LB);

  const nextDisplayWeight =
    unit === 'kg'
      ? roundHalf(selectedWeightKg + 0.5)
      : roundHalf((selectedWeightKg + 0.5) * KG_TO_LB);

  const onNext = () => {
    setData({
      weight: selectedWeightKg,
      weightUnit: unit,
    });

    setStep(step + 1);
  };

  const onBack = () => {
    if (step > 0) {
      setData({
        weight: selectedWeightKg,
        weightUnit: unit,
      });

      setStep(step - 1);
    }
  };

  const canContinue =
    typeof selectedWeightKg === 'number' && !isNaN(selectedWeightKg);

  return {
    weights,
    unit,
    displayWeight,
    prevDisplayWeight,
    nextDisplayWeight,
    scrollX,
    listRef,
    setUnit,
    onScroll,
    onMomentumEnd,
    onNext,
    onBack,
    getItemLayout,
    canContinue,
  };
};