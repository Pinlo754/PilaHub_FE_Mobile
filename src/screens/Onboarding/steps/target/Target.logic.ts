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

const ALLOW_MULTI = true; // keep allowing multiple selections but now we choose primary

export const useTargetLogic = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'Onboarding'>>();
  const { setData, step, setStep } = useOnboardingStore();

  const [targets, setTargets] = useState<TargetItem[]>([]);
  const [loading, setLoading] = useState(false);
  // store selected as a set of secondary + primary
  const [secondarySelected, setSecondarySelected] = useState<string[]>([]);
  const [primarySelected, setPrimarySelected] = useState<string | undefined>(undefined);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const res = await fetchFitnessGoals();
        if (!mounted) return;
        if (res.ok) {
          const items = (res.data && (res.data.data ?? res.data)) ?? res.data;
          const mapped: TargetItem[] = (Array.isArray(items ? items : []) ? items : []).map((g: any) => ({
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

  // Tap to set primary; long-press to toggle secondary
  const togglePrimary = (key: string) => {
    setPrimarySelected((prev) => (prev === key ? undefined : key));
  };

  const toggleSecondary = (key: string) => {
    setSecondarySelected((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const onBack = () => {
    setStep(step - 1);
  };

  const onFinish = async () => {
    // require at least primary
    if (!primarySelected) return;

    // persist both for API usage
    setData({
      targets: [primarySelected, ...secondarySelected],
      primaryGoalId: primarySelected,
      secondaryGoalIds: secondarySelected,
    });

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
    primarySelected,
    secondarySelected,
    togglePrimary,
    toggleSecondary,
    onBack,
    onFinish,
    allowMulti: ALLOW_MULTI,
  };
};
