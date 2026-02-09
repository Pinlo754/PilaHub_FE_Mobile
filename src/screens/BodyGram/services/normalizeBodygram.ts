import { OnboardingData } from "../../../store/onboarding.store";

export function normalizeForBodygram(data: OnboardingData) {
  if (!data.age || !data.gender || !data.height || !data.weight) {
    throw new Error('Missing required body data');
  }

  const heightMm = data.heightUnit === 'cm'
    ? data.height * 10
    : data.height;

  const weightGram = data.weightUnit === 'kg'
    ? data.weight * 1000
    : data.weight * 1000;

  return {
    age: data.age,
    gender: data.gender,
    height: Math.round(heightMm),
    weight: Math.round(weightGram),
  };
}
