import { useEffect, useState, useMemo } from 'react';
import { useOnboardingStore } from '../../../../store/onboarding.store';
import { fetchInjuries } from '../../../../services/profile';
import { Alert } from 'react-native';

export const useInjuryLogic = () => {
  const { data, setData, step, setStep } = useOnboardingStore();
  const [injuries, setInjuries] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // search state
  const [searchText, setSearchText] = useState<string>('');

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

  // filtered list based on search text
  const filteredInjuries = useMemo(() => {
    const q = (searchText || '').toString().trim().toLowerCase();
    if (!q) return injuries;
    return injuries.filter((inj: any) => {
      const name = (inj.name ?? '').toString().toLowerCase();
      const desc = (inj.description ?? '').toString().toLowerCase();
      return name.includes(q) || desc.includes(q);
    });
  }, [injuries, searchText]);

  const onBack = () => setStep(step - 1);

  const onSkip = () => {
    // user has no injuries / wants to skip
    // persist a skip flag so submitProfiles will NOT call personal-injuries API
    try {
      (setData as any)({ personalInjuriesSkipped: true });
    } catch {}
    setStep(step + 1);
  };

  // helper to normalize and select injury (store only locally until submitProfiles)
  const selectInjury = (inj: any | null) => {
    if (!inj) return setSelected(null);
    const normalized = { ...inj, injuryId: inj.injuryId ?? inj.id };
    setSelected(normalized);
  };

  const onNext = async () => {
    if (!selected) return Alert.alert('Vui lòng chọn chấn thương hoặc bỏ qua');
    try {
      setLoading(true);

      // save selection into onboarding store for later server submission in submitProfiles
      const existing = ((data as any).personalInjuries ?? []) as any[];
      const toSave = { injuryId: selected.injuryId ?? selected.id, notes };
      (setData as any)({ personalInjuries: [...existing, toSave], personalInjuriesSkipped: false });

      setStep(step + 1);
    } catch (e) {
      console.log('Error saving personal injury locally', e);
      Alert.alert('Lỗi', 'Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return {
    injuries,
    filteredInjuries,
    selected,
    setSelected,
    selectInjury,
    notes,
    setNotes,
    loading,
    searchText,
    setSearchText,
    onBack,
    onSkip,
    onNext,
  };
};
