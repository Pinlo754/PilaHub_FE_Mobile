import { useEffect, useState, useMemo } from 'react';
import { useOnboardingStore } from '../../../../store/onboarding.store';
import { fetchInjuries, submitPersonalInjuries } from '../../../../services/profile';
import { Alert } from 'react-native';

export const useInjuryLogic = () => {
  const { data, setData, step, setStep } = useOnboardingStore();
  const [injuries, setInjuries] = useState<any[]>([]);
  // support multiple selection
  const [selected, setSelected] = useState<any[]>([]);
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // search state
  const [searchText, setSearchText] = useState<string>('');

  // toast state for lightweight notifications
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info', duration = 3000) => {
    setToastMsg(message);
    setToastType(type);
    setToastVisible(true);
    if (duration && duration > 0) {
      setTimeout(() => {
        try { setToastVisible(false); } catch {}
      }, duration);
    }
  };

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

  const onSkip = async () => {
    // user has no injuries / wants to skip
    try {
      (setData as any)({ personalInjuriesSkipped: true });
    } catch {}
    setStep(step + 1);
  };

  // helper to normalize and toggle injury selection (store only locally until submitProfiles)
  const selectInjury = (inj: any | null) => {
    if (!inj) return setSelected([]);
    const normalized = { ...inj, injuryId: inj.injuryId ?? inj.id };
    setSelected((prev) => {
      const exists = prev.find((p) => (p.injuryId ?? p.id) === (normalized.injuryId ?? normalized.id));
      if (exists) return prev.filter((p) => (p.injuryId ?? p.id) !== (normalized.injuryId ?? normalized.id));
      return [...prev, normalized];
    });
  };

  const onNext = async () => {
    if (!selected || selected.length === 0) return Alert.alert('Vui lòng chọn chấn thương hoặc bỏ qua');
    try {
      setLoading(true);

      // save selection into onboarding store for later server submission in submitProfiles
      const existing = ((data as any).personalInjuries ?? []) as any[];
      // map each selected injury to the persisted shape; apply `notes` to each selected injury
      const toSaveArr = selected.map((s: any) => ({ injuryId: s.injuryId ?? s.id, notes }));
      (setData as any)({ personalInjuries: [...existing, ...toSaveArr], personalInjuriesSkipped: false });

      // Immediately submit to server (best-effort). If success, set a saved flag.
      try {
        const injRes = await submitPersonalInjuries({ ...(data as any), personalInjuries: toSaveArr });
        if (injRes.ok) {
          (setData as any)({ personalInjuriesSaved: true });
          showToast('Danh sách chấn thương đã được lưu lên server.', 'success');
        } else {
          console.warn('submitPersonalInjuries immediate returned error', injRes.error);
          const msg = typeof injRes.error === 'string' ? injRes.error : JSON.stringify(injRes.error);
          showToast(`Lỗi khi lưu chấn thương: ${msg}`, 'error', 5000);
        }
      } catch (e) {
        console.warn('submitPersonalInjuries immediate thrown', e);
        showToast('Không thể lưu chấn thương. Vui lòng thử lại sau.', 'error');
      }

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
    // toast state for UI
    toastVisible,
    toastMsg,
    toastType,
    setToastVisible,
  };
};
