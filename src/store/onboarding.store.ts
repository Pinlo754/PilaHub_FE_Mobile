

import { create } from 'zustand';
import { TargetKey } from '../screens/Onboarding/steps/target/Target.type';

type OnboardingData = {
  gender?: string;
  age?: number;
  weight?: number;
  weightUnit?: 'kg' | 'lb'; 
  height?: number;
  heightUnit?: 'cm' ;
  targets?: TargetKey[];
  avatar?: string;
  fullName?: string;
  email?: string;
  nickname?: string;
  phone?: string;
};

type OnboardingState = {
  step: number;
  data: OnboardingData;
  setStep: (step: number) => void;
  setData: (data: Partial<OnboardingData>) => void;
  reset: () => void;
};

export const useOnboardingStore = create<OnboardingState>((set) => ({
  step: 0,
  data: {},
  setStep: (step) => set({ step }),
  setData: (newData) =>
    set((state) => ({ data: { ...state.data, ...newData } })),
  reset: () => set({ step: 0, data: {} }),
}));
