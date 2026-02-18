import { useState } from 'react';
import { useOnboardingStore } from '../../../../store/onboarding.store';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../../navigation/AppNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Onboarding'>;

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

export const useWorkoutLogic = () => {
  const navigation = useNavigation<NavigationProp>();
  const { data, setData, step, setStep } = useOnboardingStore();

  const [frequency, setFrequency] = useState<string | undefined>(
    data.workoutFrequency
  );
  const [level, setLevel] = useState<string | undefined>(data.workoutLevel);

  const selectFrequency = (key: string) => setFrequency(key);
  const selectLevel = (key: string) => setLevel(key);

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
