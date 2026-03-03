import { useState, useEffect } from 'react';
import { launchImageLibrary } from 'react-native-image-picker';
import { useOnboardingStore } from '../../../../store/onboarding.store';
import { getProfile } from '../../../../services/auth';


export const useInformationLogic = () => {
  const { data, setData, step, setStep } = useOnboardingStore();

  const [avatar, setAvatar] = useState<string | undefined>(
    data.avatar
  );
  const [fullName, setFullName] = useState(data.fullName ?? '');
  const [nickname, setNickname] = useState(data.nickname ?? '');
  const [email, setEmail] = useState(data.email ?? '');
  const [phone, setPhone] = useState(data.phone ?? '');

  // keep local state in sync when store changes elsewhere
  useEffect(() => {
    if ((data.avatar ?? null) !== (avatar ?? null)) setAvatar(data.avatar);
    if ((data.fullName ?? '') !== fullName) setFullName(data.fullName ?? '');
    if ((data.nickname ?? '') !== nickname) setNickname(data.nickname ?? '');
    if ((data.email ?? '') !== email) setEmail(data.email ?? '');
    if ((data.phone ?? '') !== phone) setPhone(data.phone ?? '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.avatar, data.fullName, data.nickname, data.email, data.phone]);

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
    const result = await launchImageLibrary({
      mediaType: 'photo',
      quality: 0.8,
    });

    if (result.assets && result.assets[0]?.uri) {
      setAvatar(result.assets[0].uri);
    }
  };

  const onNext = () => {
    // persist current form into onboarding store immediately
    setData({
      avatar,
      fullName,
      nickname,
      email,
      phone,
    });
    // advance step
    setStep(step + 1);
  };

  const onBack = () => setStep(step - 1);

  return {
    avatar,
    fullName,
    nickname,
    email,
    phone,
    setFullName,
    setNickname,
    setEmail,
    setPhone,
    pickAvatar,
    onNext,
    onBack,
  };
};
