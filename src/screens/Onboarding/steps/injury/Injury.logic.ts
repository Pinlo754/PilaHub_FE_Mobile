import { useEffect, useState } from 'react';
import { useOnboardingStore } from '../../../../store/onboarding.store';
import { fetchInjuries, createPersonalInjury } from '../../../../services/profile';
import { Alert } from 'react-native';

export const useInjuryLogic = () => {
  const { data, setData, step, setStep } = useOnboardingStore();
  const [injuries, setInjuries] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const res = await fetchInjuries();
        if (res.ok && mounted) {
          const arr = Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
          setInjuries(arr || []);
        }
      } catch (e) {
        console.log('Failed to load injuries', e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const onBack = () => setStep(step - 1);

  const onSkip = () => {
    // user has no injuries / wants to skip
    setStep(step + 1);
  };

  const onNext = async () => {
    if (!selected) return Alert.alert('Vui lòng chọn chấn thương hoặc bỏ qua');
    try {
      setLoading(true);
      const payload = { injuryId: selected.injuryId ?? selected.id, notes };
      const res = await createPersonalInjury(payload);
      if (!res.ok) {
        Alert.alert('Lỗi', 'Không thể lưu chấn thương. Vui lòng thử lại.');
        console.warn('createPersonalInjury failed', res.error);
        return;
      }

      // save to onboarding store for later use if needed
      const existing = ((data as any).personalInjuries ?? []) as any[];
      const added = res.data ?? res.data?.data ?? res.data;
      // cast setData to any to allow storing an app-specific field not declared in OnboardingData
      (setData as any)({ personalInjuries: [...existing, added] });

      setStep(step + 1);
    } catch (e) {
      console.log('Error posting personal injury', e);
      Alert.alert('Lỗi', 'Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return {
    injuries,
    selected,
    setSelected,
    notes,
    setNotes,
    loading,
    onBack,
    onSkip,
    onNext,
  };
};
