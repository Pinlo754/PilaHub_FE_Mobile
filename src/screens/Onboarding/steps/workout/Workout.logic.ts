import { useState } from 'react';
import { useOnboardingStore } from '../../../../store/onboarding.store';

export const WORKOUT_FREQUENCIES = [
  { key: 'SEDENTARY', title: 'Ít vận động', desc: '0 giờ/tuần' },
  { key: 'LIGHT', title: 'Nhẹ', desc: '1–2 buổi/tuần' },
  { key: 'MODERATE', title: 'Trung bình', desc: '3–4 buổi/tuần' },
  { key: 'ACTIVE', title: 'Năng động', desc: '5–6 buổi/tuần' },
  { key: 'ATHLETE', title: 'Vận động viên', desc: '7+ buổi/tuần' },
];

export const WORKOUT_LEVELS = [
  { key: 'BEGINNER', title: 'Người mới' },
  { key: 'INTERMEDIATE', title: 'Trung cấp' },
  { key: 'ADVANCED', title: 'Nâng cao' },
];

export type WorkoutFrequencyKey = 'SEDENTARY' | 'LIGHT' | 'MODERATE' | 'ACTIVE' | 'ATHLETE';
export type WorkoutLevelKey = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';

export const useWorkoutLogic = () => {
  const { data, setData, step, setStep } = useOnboardingStore();

  const [frequency, setFrequency] = useState<WorkoutFrequencyKey | undefined>(
    data.workoutFrequency as WorkoutFrequencyKey | undefined
  );
  const [level, setLevel] = useState<WorkoutLevelKey | undefined>(data.workoutLevel as WorkoutLevelKey | undefined);

  const selectFrequency = (key: WorkoutFrequencyKey) => setFrequency(key);
  const selectLevel = (key: WorkoutLevelKey) => setLevel(key);

  const onBack = () => setStep(step - 1);

  const onNext = () => {
    if (!frequency || !level) return;
    setData({ workoutFrequency: frequency, workoutLevel: level });
    setStep(step + 1);
  };

  return {
    frequencies: WORKOUT_FREQUENCIES,
    levels: WORKOUT_LEVELS,
    frequency,
    level,
    selectFrequency,
    selectLevel,
    onBack,
    onNext,
  };
};
