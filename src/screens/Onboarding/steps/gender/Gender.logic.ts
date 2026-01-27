import { useOnboardingStore } from "../../../../store/onboarding.store";
import { Gender } from "./Gender.type";


export const useGenderLogic = () => {
  const { data, setData, step, setStep } = useOnboardingStore();

  const onSelectGender = (gender: Gender) => {
    setData({ gender });
  };

  const onNext = () => {
    if (!data.gender) return;
    setStep(step + 1);
  };

  const onBack = () => {
    if (step > 0) setStep(step - 1);
  };

  return {
    gender: data.gender,
    canContinue: !!data.gender,
    onSelectGender,
    onNext,
    onBack,
  };
};