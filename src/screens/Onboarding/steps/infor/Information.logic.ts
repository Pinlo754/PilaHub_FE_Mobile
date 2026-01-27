import { useState } from 'react';
import { launchImageLibrary } from 'react-native-image-picker';
import { useOnboardingStore } from '../../../../store/onboarding.store';


export const useInformationLogic = () => {
  const { data, setData, step, setStep } = useOnboardingStore();

  const [avatar, setAvatar] = useState<string | undefined>(
    data.avatar
  );
  const [fullName, setFullName] = useState(data.fullName ?? '');
  const [nickname, setNickname] = useState(data.nickname ?? '');
  const [email, setEmail] = useState(data.email ?? '');
  const [phone, setPhone] = useState(data.phone ?? '');

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
    setData({
      avatar,
      fullName,
      nickname,
      email,
      phone,
    });
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
