import { useState } from 'react';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'TraineeFeedback'>;
};

export type infoType = {
  course_name: string;
  number_of_week: number;
  duration: string;
  number_of_lesson: number;
  level: string;
};

const mockInfo: infoType = {
  course_name: 'Chuỗi Mat Cơ Bản',
  number_of_week: 4,
  duration: '1h30p',
  number_of_lesson: 12,
  level: 'Cơ bản',
};

export const useTraineeFeedback = ({ navigation }: Props) => {
  // CONSTANTS
  const TIMEOUT = 3010;

  // STATE
  const [info, setInfo] = useState<infoType>(mockInfo);
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState<string>('');

  // HANDLERS
  const openSuccessModal = (msg: string) => {
    setSuccessMsg(msg);
    setShowSuccessModal(true);
  };

  const closeSuccessModal = () => {
    setSuccessMsg('');
    setShowSuccessModal(false);
  };

  const onPressSubmit = () => {
    openSuccessModal('Đã đánh giá thành công!');
    setTimeout(() => {
      navigation.navigate('MainTabs');
    }, TIMEOUT);
  };

  // CHECK
  const isValid = rating > 0 && comment.trim().length > 0;

  return {
    info,
    onPressSubmit,
    showSuccessModal,
    successMsg,
    closeSuccessModal,
    rating,
    setRating,
    comment,
    setComment,
    isValid,
  };
};
