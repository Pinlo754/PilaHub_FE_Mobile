import { useRef } from 'react';
import { Animated } from 'react-native';
import { useOnboardingStore } from '../../../../store/onboarding.store';


const MIN_AGE = 12;
const MAX_AGE = 80;
export const ITEM_WIDTH = 64;

export const useAgeLogic = () => {
  const { data, setData, step, setStep } = useOnboardingStore();
  const scrollX = useRef(new Animated.Value(0)).current;

  const ages = Array.from(
    { length: MAX_AGE - MIN_AGE + 1 },
    (_, i) => MIN_AGE + i
  );
  

  const selectedAge = data.age ?? 28;

  const onMomentumEnd = (e: any) => {
    const index = Math.round(
      e.nativeEvent.contentOffset.x / ITEM_WIDTH
    );
    setData({ age: ages[index] });
  };

  const onNext = () => setStep(step + 1);
  const onBack = () => step > 0 && setStep(step - 1);

  return {
    ages,
    scrollX,
    selectedAge,
    onMomentumEnd,
    onNext,
    onBack,
  };
};
