import { useEffect, useState } from 'react';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import LiveSessionService from '../../hooks/liveSession.service';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AssessmentCriterionType } from '../../utils/AssessmentCriterionType';
import { SessionAssessmentService } from '../../hooks/sessionAssessment.service';
import { AssessmentCriterionService } from '../../hooks/assessmentCriterion.service';

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
  const [role, setRole] = useState<string | null>(null);
  const [criteria, setCriteria] = useState<AssessmentCriterionType[]>([]);
  const [scores, setScores] = useState<Record<string, string>>({});

  // VARIABLE
  const mode: ModeType | undefined = (() => {
    if (liveSessionIdParam) {
      return role === 'TRAINEE' ? 'feedbackForCoach' : 'feedbackForTrainee';
    }

    // if (courseIdParam) {
    //   return 'feedbackForCourse';
    // }

    return undefined;
  })();

  const modeConfig = {
    feedbackForCoach: {
      title: 'Bạn thấy HLV dạy như thế nào?',
      showInfo: false,
      showRating: true,
      showComment: false,
      validate: () => rating > 0,
      submit: () => {
        feedbackForCoach();
      },
    },

    feedbackForTrainee: {
      title: 'Bạn thấy học viên tập như thế nào?',
      showInfo: false,
      showRating: false,
      showComment: false,
      validate: () => isAssessmentValid(),
      submit: () => {
        feedbackForTrainee();
      },
    },

    feedbackForCourse: {
      title: 'Bạn thấy khóa học này như thế nào?',
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

  const isAssessmentValid = () => {
    if (criteria.length === 0) return false;
    return criteria.every(c => {
      const val = parseFloat(scores[c.assessmentCriterionId] ?? '');
      return !isNaN(val) && val >= 1 && val <= 10;
    });
  };

  // API
  const feedbackForCoach = async () => {
    setIsLoading(true);
    try {
      if (!liveSessionIdParam) return null;
      console.log(
        `Submitting feedback for coach id: ${liveSessionIdParam} with rating:`,
        rating,
      );
      await LiveSessionService.feedbackForCoach(liveSessionIdParam, rating);

      openSuccessModal('Đã đánh giá thành công!');

      setTimeout(() => {
        navigation.navigate('MainTabs', { screen: 'Home' });
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

      const results = criteria.map(c => ({
        criterionId: c.assessmentCriterionId,
        score: parseFloat(scores[c.assessmentCriterionId]),
      }));

      await SessionAssessmentService.createSessionAssessment(
        liveSessionIdParam,
        { results },
      );

      openSuccessModal('Đã đánh giá thành công!');

      setTimeout(() => {
        navigation.navigate('CoachScreen');
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

  const fetchCriteria = async () => {
    setIsLoading(true);
    try {
      const data = await AssessmentCriterionService.getAll();
      const sorted = [...data].sort((a, b) => a.displayOrder - b.displayOrder);
      setCriteria(sorted);
    } catch (err: any) {
      setError('Không thể tải tiêu chí đánh giá.');
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

  const onScoreChange = (criterionId: string, value: string) => {
    setScores(prev => ({ ...prev, [criterionId]: value }));
  };

  // CHECK
  const isValid = config?.validate() ?? false;
  const showInfo = config?.showInfo ?? false;
  const showRating = config?.showRating ?? false;
  const showComment = config?.showComment ?? false;
  const title = config?.title || 'Bạn cảm thấy thế nào?';

  // USE EFFECT
  useEffect(() => {
    const loadRole = async () => {
      const storedRole = await AsyncStorage.getItem('role');
      setRole(storedRole);
    };

    loadRole();
  }, []);

  useEffect(() => {
    if (mode === 'feedbackForTrainee') {
      fetchCriteria();
    }
  }, [mode]);

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
    title,
    liveSessionIdParam,
    criteria,
    scores,
    onScoreChange,
  };
};
