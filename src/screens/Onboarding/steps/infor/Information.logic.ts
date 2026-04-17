import { useState, useEffect } from 'react';
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

  // keep local state in sync when store changes elsewhere
  useEffect(() => {
    if ((data.avatar ?? null) !== (avatar ?? null)) setAvatar(data.avatar);
    if ((data.fullName ?? '') !== fullName) setFullName(data.fullName ?? '');
    if ((data.email ?? '') !== email) setEmail(data.email ?? '');
    if ((data.phone ?? '') !== phone) setPhone(data.phone ?? '');
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

  const pickAvatar = async () => {
    try {
      const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.8 });
      console.log('[pickAvatar] result', result);
      if (result.didCancel) return;
      const asset = result.assets && result.assets[0];
      console.log('[pickAvatar] asset', asset);
      if (!asset || !asset.uri) return;

      // upload to Firebase Storage
      setUploading(true);
      const filename = `avatars/${Date.now()}_${asset.fileName ?? 'photo'}`;
      const ref = storage().ref(filename);
      const localPath = asset.uri.replace('file://', '');
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
    } catch (e) {
      console.warn('pickAvatar/upload error', e);
      Alert.alert('Lỗi', 'Không thể tải ảnh lên. Vui lòng thử lại.');
    } finally {
      setUploading(false);
    }
  };

  const onNext = () => {
    // persist current form into onboarding store immediately
    setData({
      avatar,
      fullName,
      email,
      phone,
    });
    // advance step
    setStep(step + 1);
  };

  const onBack = () => setStep(step - 1);

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
  };
};
