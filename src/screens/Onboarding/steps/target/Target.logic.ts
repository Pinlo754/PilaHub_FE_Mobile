import { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { TargetItem, TargetKey } from './Target.type';
import { useOnboardingStore } from '../../../../store/onboarding.store';
import {
  setOnboardingCompleted,
  clearOnboarding,
} from '../../../../utils/storage';
import { RootStackParamList } from '../../../../navigation/AppNavigator';

const ALLOW_MULTI = true; // false = chọn 1 | true = chọn nhiều

export const TARGETS: TargetItem[] = [
  {
    key: 'lose_weight',
    title: 'Giảm cân',
    description: 'Đốt mỡ, cải thiện vóc dáng',
    icon: '🔥',
  },
  {
    key: 'gain_muscle',
    title: 'Tăng cơ',
    description: 'Xây dựng cơ bắp',
    icon: '💪',
  },
  {
    key: 'maintain',
    title: 'Giữ dáng',
    description: 'Duy trì thể trạng hiện tại',
    icon: '🧘',
  },
  {
    key: 'healthy',
    title: 'Sức khoẻ',
    description: 'Cải thiện sức khoẻ tổng thể',
    icon: '❤️',
  },
];

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Onboarding'>;

export const useTargetLogic = () => {
  const navigation = useNavigation<NavigationProp>();
  const { data, setData, step, setStep } = useOnboardingStore();

  const [selected, setSelected] = useState<TargetKey[]>(
    data.targets ?? []
  );

  const toggleTarget = (key: TargetKey) => {
    if (ALLOW_MULTI) {
      setSelected((prev) =>
        prev.includes(key)
          ? prev.filter((k) => k !== key)
          : [...prev, key]
      );
    } else {
      setSelected([key]);
    }
  };

  const onBack = () => {
    setStep(step - 1);
  };

  const onFinish = async () => {
    if (selected.length === 0) return;

    setData({ targets: selected });

    await clearOnboarding();

    await setOnboardingCompleted();

    navigation.reset({
      index: 0,
      routes: [{ name: 'MethodSelect' }],
    });
  };

  return {
    targets: TARGETS,
    selected,
    toggleTarget,
    onBack,
    onFinish,
    allowMulti: ALLOW_MULTI,
  };
};
