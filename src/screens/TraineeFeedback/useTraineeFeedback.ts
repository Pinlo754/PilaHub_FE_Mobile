import { useState } from 'react';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { LiveSessionService } from '../../hooks/liveSession.service';

type Props = {
  route: RouteProp<RootStackParamList, 'TraineeFeedback'>;
  navigation: NativeStackNavigationProp<RootStackParamList, 'TraineeFeedback'>;
};

export type ModeType =
  | 'feedbackForCoach'
  | 'feedbackForTrainee'
  | 'feedbackForCourse';

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

export const useTraineeFeedback = ({ route, navigation }: Props) => {
  // CONSTANTS
  const TIMEOUT = 3010;
  const ROLE = 'TRAINEE';

  // PARAM
  const liveSessionIdParam = route.params?.liveSessionId;

  // STATE
  const [info, setInfo] = useState<infoType>(mockInfo);
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // VARIABLE
  const mode: ModeType | undefined = (() => {
    if (liveSessionIdParam) {
      return ROLE === 'TRAINEE' ? 'feedbackForCoach' : 'feedbackForTrainee';
    }

    // if (courseIdParam) {
    //   return 'feedbackForCourse';
    // }

    return undefined;
  })();

  const modeConfig = {
    feedbackForCoach: {
      showInfo: false,
      showRating: true,
      showComment: false,
      validate: () => rating > 0,
      submit: () => {
        feedbackForCoach();
      },
    },

    feedbackForTrainee: {
      showInfo: false,
      showRating: false,
      showComment: true,
      validate: () => comment.trim().length > 0,
      submit: () => {
        feedbackForTrainee();
      },
    },

    feedbackForCourse: {
      showInfo: true,
      showRating: true,
      showComment: true,
      validate: () => rating > 0 && comment.trim().length > 0,
      submit: () => {
        console.log('submit feedback for course');
      },
    },
  };

  const config = mode ? modeConfig[mode] : undefined;

  // API
  const feedbackForCoach = async () => {
    setIsLoading(true);
    try {
      if (!liveSessionIdParam) return null;

      await LiveSessionService.feedbackForCoach(liveSessionIdParam, rating);

      openSuccessModal('Đã đánh giá thành công!');

      setTimeout(() => {
        navigation.navigate('MainTabs');
      }, TIMEOUT);
    } catch (err: any) {
      if (err?.type === 'BUSINESS_ERROR') {
        setError(err.message);
      } else {
        setError('Có lỗi xảy ra. Vui lòng thử lại.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const feedbackForTrainee = async () => {
    setIsLoading(true);
    try {
      if (!liveSessionIdParam) return null;

      await LiveSessionService.feedbackForTrainee(liveSessionIdParam, comment);

      openSuccessModal('Đã đánh giá thành công!');

      setTimeout(() => {
        navigation.navigate('MainTabs');
      }, TIMEOUT);
    } catch (err: any) {
      if (err?.type === 'BUSINESS_ERROR') {
        setError(err.message);
      } else {
        setError('Có lỗi xảy ra. Vui lòng thử lại.');
      }
    } finally {
      setIsLoading(false);
    }
  };

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
    config?.submit();
  };

  // CHECK
  const isValid = config?.validate() ?? false;
  const showInfo = config?.showInfo ?? false;
  const showRating = config?.showRating ?? false;
  const showComment = config?.showComment ?? false;

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
    mode,
    showComment,
    showInfo,
    showRating,
    isLoading,
  };
};
