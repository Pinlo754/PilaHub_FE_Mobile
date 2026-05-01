import { useEffect, useState, useMemo, useCallback } from 'react';
import { useOnboardingStore } from '../../../../store/onboarding.store';
import { fetchInjuries, submitPersonalInjuries } from '../../../../services/profile';

export const useInjuryLogic = () => {
  const { data, setData, step, setStep } = useOnboardingStore();

  const [injuries, setInjuries] = useState<any[]>([]);
  const [selected, setSelected] = useState<any[]>([]);
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const [searchText, setSearchText] = useState<string>('');

  const [toastVisible, setToastVisible] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');

  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [modalIconName, setModalIconName] = useState<string | undefined>(undefined);
  const [modalIconBg, setModalIconBg] = useState<
    'grey' | 'red' | 'green' | 'blue' | 'yellow'
  >('red');

  const showToast = (
    message: string,
    type: 'success' | 'error' | 'info' = 'info',
    duration = 3000,
  ) => {
    setToastMsg(message);
    setToastType(type);
    setToastVisible(true);

    if (duration && duration > 0) {
      setTimeout(() => {
        try {
          setToastVisible(false);
        } catch {
          // ignore
        }
      }, duration);
    }
  };

  const showModal = useCallback(
    (
      title: string,
      message: string,
      iconName?: string,
      iconBg: 'grey' | 'red' | 'green' | 'blue' | 'yellow' = 'red',
    ) => {
      setModalTitle(title);
      setModalMessage(message);
      setModalIconName(iconName);
      setModalIconBg(iconBg);
      setModalVisible(true);
    },
    [],
  );

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoading(true);

        const res = await fetchInjuries();

        if (res.ok && mounted) {
          const arr = Array.isArray(res.data) ? res.data : res.data?.data ?? [];
          setInjuries(arr || []);
        }
      } catch (e) {
        console.log('Failed to load injuries', e);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const filteredInjuries = useMemo(() => {
    const q = (searchText || '').toString().trim().toLowerCase();

    if (!q) return injuries;

    return injuries.filter((inj: any) => {
      const name = (inj.name ?? '').toString().toLowerCase();
      const desc = (inj.description ?? '').toString().toLowerCase();

      return name.includes(q) || desc.includes(q);
    });
  }, [injuries, searchText]);

  const onBack = () => {
    setStep(step - 1);
  };

  const onSkip = async () => {
    try {
      (setData as any)({
        personalInjuriesSkipped: true,
      });
    } catch {
      // ignore
    }

    setStep(step + 1);
  };

  const selectInjury = (inj: any | null) => {
    if (!inj) {
      setSelected([]);
      return;
    }

    const normalized = {
      ...inj,
      injuryId: inj.injuryId ?? inj.id,
    };

    setSelected(prev => {
      const exists = prev.find(
        p => (p.injuryId ?? p.id) === (normalized.injuryId ?? normalized.id),
      );

      if (exists) {
        return prev.filter(
          p => (p.injuryId ?? p.id) !== (normalized.injuryId ?? normalized.id),
        );
      }

      return [...prev, normalized];
    });
  };

  const onNext = async () => {
    if (!selected || selected.length === 0) {
      return showModal(
        'Thiếu thông tin',
        'Vui lòng chọn chấn thương hoặc bỏ qua',
        'warning',
        'yellow',
      );
    }

    try {
      setLoading(true);

      const existing = ((data as any).personalInjuries ?? []) as any[];

      const toSaveArr = selected.map((s: any) => ({
        injuryId: s.injuryId ?? s.id,
        notes,
      }));

      (setData as any)({
        personalInjuries: [...existing, ...toSaveArr],
        personalInjuriesSkipped: false,
      });

      try {
        const injRes = await submitPersonalInjuries({
          ...(data as any),
          personalInjuries: toSaveArr,
        });

        if (injRes.ok) {
          (setData as any)({
            personalInjuriesSaved: true,
          });

          showToast('Danh sách chấn thương đã được lưu lên server.', 'success');
        } else {
          console.warn('submitPersonalInjuries immediate returned error', injRes.error);

          const msg =
            typeof injRes.error === 'string'
              ? injRes.error
              : JSON.stringify(injRes.error);

          showModal('Lỗi khi lưu chấn thương', String(msg), 'alert-circle', 'red');
        }
      } catch (e) {
        console.warn('submitPersonalInjuries immediate thrown', e);

        showModal(
          'Lỗi',
          'Không thể lưu chấn thương. Vui lòng thử lại sau.',
          'alert-circle',
          'red',
        );
      }

      setStep(step + 1);
    } catch (e) {
      console.log('Error saving personal injury locally', e);

      showModal('Lỗi', 'Có lỗi xảy ra. Vui lòng thử lại.', 'alert-circle', 'red');
    } finally {
      setLoading(false);
    }
  };

  const canContinue = selected.length > 0 && !loading;

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
    canContinue,

    toastVisible,
    toastMsg,
    toastType,
    setToastVisible,

    modalVisible,
    modalTitle,
    modalMessage,
    modalIconName,
    modalIconBg,
    setModalVisible,
  };
};