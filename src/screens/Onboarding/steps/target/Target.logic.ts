import { useState, useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { TargetItem } from './Target.type';
import { useOnboardingStore } from '../../../../store/onboarding.store';
import {
  setOnboardingCompleted,
  clearOnboarding,
  setOnboardingCompletedFor,
} from '../../../../utils/storage';
import { getProfile } from '../../../../services/auth';
import { RootStackParamList } from '../../../../navigation/AppNavigator';
import { fetchFitnessGoals } from '../../../../services/profile';

const ALLOW_MULTI = true; // false = chọn 1 | true = chọn nhiều

export const useTargetLogic = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'Onboarding'>>();
  const { data, setData, step, setStep } = useOnboardingStore();

  const [targets, setTargets] = useState<TargetItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<string[]>(data.targets ?? []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const res = await fetchFitnessGoals();
        if (!mounted) return;
        if (res.ok) {
          const items = (res.data && (res.data.data ?? res.data)) ?? res.data;
          const mapped: TargetItem[] = (Array.isArray(items) ? items : []).map((g: any) => ({
            key: g.id ?? g.goalId ?? String(g._id ?? ''),
            title: g.vietnameseName ?? g.name ?? g.viName ?? g.vietName ?? g.code ?? String(g.id),
            description: g.description ?? '',
            icon: g.icon ?? '🏁',
          }));
          setTargets(mapped);
        } else {
          setTargets([]);
        }
      } catch {
        setTargets([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const toggleTarget = (key: string) => {
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

    // mark onboarding completed for the authenticated user (if available)
    try {
      const me = await getProfile();
      if (me.ok) {
        const d: any = me.data;
        const userId = d?.id ?? d?.accountId ?? d?.memberId ?? null;
        if (userId) {
          await setOnboardingCompletedFor(userId);
        }
      }
    } catch {
      // ignore failures here
    }

    navigation.reset({
      index: 0,
      routes: [{ name: 'InputBody' }],
    });
  };

  return {
    targets,
    loading,
    selected,
    toggleTarget,
    onBack,
    onFinish,
    allowMulti: ALLOW_MULTI,
  };
};
