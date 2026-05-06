import { useState, useEffect, useRef, useMemo } from 'react';
import { launchImageLibrary } from 'react-native-image-picker';
import {
  useOnboardingStore,
  OnboardingData,
} from '../../../../store/onboarding.store';
import storage from '@react-native-firebase/storage';
import { Alert } from 'react-native';

export const useInformationLogic = () => {
  const { data, setData, step, setStep } = useOnboardingStore();

  const [avatar, setAvatar] = useState<string | undefined>(data.avatar);
  const [uploading, setUploading] = useState(false);
  const [fullName, setFullName] = useState(data.fullName ?? '');

  useEffect(() => {
    if ((data.avatar ?? null) !== (avatar ?? null)) {
      setAvatar(data.avatar);
    }

    if (
      typeof data.fullName !== 'undefined' &&
      (data.fullName ?? '') !== fullName
    ) {
      setFullName(data.fullName ?? '');
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.avatar, data.fullName]);

  const isPickingRef = useRef<boolean>(false);
  const lastPickRef = useRef<number>(0);

  const pickAvatar = async () => {
    if (uploading || isPickingRef.current) return;

    const now = Date.now();
    const last = lastPickRef.current ?? 0;

    if (now - last < 1200) return;

    lastPickRef.current = now;
    isPickingRef.current = true;

    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
        selectionLimit: 1,
      });

      if (result.didCancel) return;

      const asset = result.assets && result.assets[0];
      if (!asset || !asset.uri) return;

      setUploading(true);

      const filename = `avatars/${Date.now()}_${asset.fileName ?? 'photo'}`;
      const ref = storage().ref(filename);

      const localPath = asset.uri.startsWith('file://')
        ? asset.uri.replace('file://', '')
        : asset.uri;

      await ref.putFile(localPath);

      const url = await ref.getDownloadURL();

      if (url) {
        setAvatar(url);
        setData({ avatar: url });
      }
    } catch {
      Alert.alert('Lỗi', 'Không thể tải ảnh lên. Vui lòng thử lại.');
    } finally {
      setUploading(false);
      isPickingRef.current = false;
    }
  };

  const updateOnboardingField = <K extends keyof OnboardingData>(
    key: K,
    value: OnboardingData[K],
  ) => {
    setData({
      [key]: value,
    } as Partial<OnboardingData>);
  };

  const saveCurrentInfo = () => {
    setData({
      avatar,
      fullName,
    });
  };

  const onNext = () => {
    saveCurrentInfo();
    setStep(step + 1);
  };

  const onBack = () => {
    saveCurrentInfo();

    if (step > 0) {
      setStep(step - 1);
    }
  };

  const canContinue = useMemo(() => {
    return fullName.trim().length > 0 && !uploading;
  }, [fullName, uploading]);

  const validationMessage = useMemo(() => {
    if (fullName.trim().length > 0) return '';
    return 'Vui lòng nhập họ và tên';
  }, [fullName]);

  return {
    avatar,
    uploading,
    fullName,
    onboardingData: data,

    setFullName,
    updateOnboardingField,

    pickAvatar,
    onNext,
    onBack,

    canContinue,
    validationMessage,
  };
};