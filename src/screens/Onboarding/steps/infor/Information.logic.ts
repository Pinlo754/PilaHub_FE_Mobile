import { useState, useEffect, useRef, useMemo } from 'react';
import { launchImageLibrary } from 'react-native-image-picker';
import { useOnboardingStore } from '../../../../store/onboarding.store';
import { getProfile } from '../../../../services/auth';
import storage from '@react-native-firebase/storage';
import { Alert } from 'react-native';


export const useInformationLogic = () => {
  const { data, setData, step, setStep } = useOnboardingStore();

  const [avatar, setAvatar] = useState<string | undefined>(
    data.avatar
  );
  const [uploading, setUploading] = useState(false);
  const [fullName, setFullName] = useState(data.fullName ?? '');
  const [email, setEmail] = useState(data.email ?? '');
  const [phone, setPhone] = useState(data.phone ?? '');
  // fields are persisted into onboarding store; submission is handled by OnboardingScreen

  // keep local state in sync when store changes elsewhere
  useEffect(() => {
    if ((data.avatar ?? null) !== (avatar ?? null)) setAvatar(data.avatar);
    // only sync fields that are explicitly present in the store to avoid
    // clobbering local edits when another part writes a partial update (e.g. avatar)
    if (typeof data.fullName !== 'undefined' && (data.fullName ?? '') !== fullName) setFullName(data.fullName ?? '');
    if (typeof data.email !== 'undefined' && (data.email ?? '') !== email) setEmail(data.email ?? '');
    if (typeof data.phone !== 'undefined' && (data.phone ?? '') !== phone) setPhone(data.phone ?? '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.avatar, data.fullName, data.email, data.phone]);

  // attempt to pre-fill email from server profile if not already present
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const profile = await getProfile();
        if (!mounted) return;
        if (profile.ok) {
          const d: any = profile.data;
          const serverEmail = d?.account?.email ?? d?.email ?? '';
          if (serverEmail && !email) {
            setEmail(serverEmail);
            // also persist into onboarding store so it's available app-wide
            setData({ email: serverEmail });
          }
        }
      } catch {
        // ignore
      }
    })();
    return () => { mounted = false; };
    // only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // prevent re-entrancy: block while picker is open or upload in progress
  const isPickingRef = useRef<boolean>(false);

  const pickAvatar = async () => {
    if (uploading || isPickingRef.current) {
      console.log('[pickAvatar] busy — ignoring tap');
      return;
    }

    const now = Date.now();
    const last = lastPickRef.current ?? 0;
    if (now - last < 1200) {
      console.log('[pickAvatar] tapped too fast — ignoring');
      return;
    }
    lastPickRef.current = now;

    isPickingRef.current = true;
    try {
      const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.8, selectionLimit: 1 });
      console.log('[pickAvatar] result', result);
      if (result.didCancel) return;
      const asset = result.assets && result.assets[0];
      console.log('[pickAvatar] asset', asset);
      if (!asset || !asset.uri) return;

      // upload to Firebase Storage
      setUploading(true);
      const filename = `avatars/${Date.now()}_${asset.fileName ?? 'photo'}`;
      const ref = storage().ref(filename);

      // handle different uri schemes (content:// or file://). Firebase putFile accepts both on Android/iOS
      const localPath = asset.uri.startsWith('file://') ? asset.uri.replace('file://', '') : asset.uri;
      console.log('[pickAvatar] uploading file:', localPath, '->', filename);
      await ref.putFile(localPath);
      const url = await ref.getDownloadURL();
      console.log('[pickAvatar] uploaded url', url);

      // persist into local state and onboarding store so later API call uses the URL
      if (url) {
        setAvatar(url);
        setData({ avatar: url });
      } else {
        console.warn('[pickAvatar] upload returned empty url');
      }
    } catch {
      console.warn('pickAvatar/upload error');
      Alert.alert('Lỗi', 'Không thể tải ảnh lên. Vui lòng thử lại.');
    } finally {
      setUploading(false);
      isPickingRef.current = false;
    }
  };

  // ref to prevent rapid repeated taps
  const lastPickRef = useRef<number>(0);

  const onNext = () => {
    // persist current form into onboarding store immediately; actual trainee creation
    // will be performed by OnboardingScreen when entering the Injury step
    setData({
      avatar,
      fullName,
      email,
      phone,
    });
    setStep(step + 1);
  };

  const onBack = () => setStep(step - 1);

  // NEW: computed canContinue and validation message (require fullName)
  const canContinue = useMemo(() => {
    return (fullName && fullName.trim().length > 0) && !uploading;
  }, [fullName, uploading]);

  const validationMessage = useMemo(() => {
    if (fullName && fullName.trim().length > 0) return '';
    return 'Vui lòng nhập họ và tên';
  }, [fullName]);

  return {
    avatar,
    uploading,
    fullName,
    email,
    phone,
    setFullName,
    setEmail,
    setPhone,
    pickAvatar,
    onNext,
    onBack,
    canContinue,
    validationMessage,
  };
};
