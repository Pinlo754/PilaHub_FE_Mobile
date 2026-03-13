import { useEffect, useRef, useState } from 'react';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { RouteProp } from '@react-navigation/native';
import { CoachType } from '../../utils/CoachType';
import { Animated } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { coachService } from '../../hooks/coach.service';
import { CoachFeedbackType } from '../../utils/CoachFeedbackType';
import { coachFeedbackService } from '../../hooks/coachFeedback.service';

type Props = {
  route: RouteProp<RootStackParamList, 'CoachDetail'>;
  navigation: NativeStackNavigationProp<RootStackParamList, 'CoachDetail'>;
};

export const useCoachDetail = ({ route, navigation }: Props) => {
  // PARAM
  const { coach_id } = route.params;
  const { selectedCoachId } = route.params;

  // STATE
  const [coachDetail, setCoachDetail] = useState<CoachType>();
  const [coachFeedbacks, setCoachFeedbacks] = useState<CoachFeedbackType[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // USE REF
  const scrollY = useRef(new Animated.Value(0)).current;

  // FETCH
  const fetchById = async () => {
    if (!coach_id) return;

    setIsLoading(true);
    setError(null);
    try {
      const [resCoach, resCoachFeedback] = await Promise.all([
        coachService.getById(coach_id),
        coachFeedbackService.getById(coach_id),
      ]);

      setCoachDetail(resCoach);
      setCoachFeedbacks(resCoachFeedback);
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
  const onPressBtn = () => {
    navigation.navigate('RegisterCalendar', {
      coach_id: selectedCoachId || coach_id,
      pricePerHour: coachDetail?.pricePerHour,
    });
  };

  // USE EFFECT
  useEffect(() => {
    if (!coach_id) return;

    fetchById();
  }, [coach_id]);

  return {
    coachDetail,
    coachFeedbacks,
    scrollY,
    selectedCoachId,
    onPressBtn,
    isLoading,
    error,
  };
};
