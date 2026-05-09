import { useEffect, useRef, useState } from 'react';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { RouteProp } from '@react-navigation/native';
import { CoachType } from '../../utils/CoachType';
import { Animated } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import api from '../../hooks/axiosInstance';
import { CoachService } from '../../hooks/coach.service';
import { CoachFeedbackType } from '../../utils/CoachFeedbackType';
import { coachFeedbackService } from '../../hooks/coachFeedback.service';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MessageService } from '../../hooks/message.service';

type Props = {
  route: RouteProp<RootStackParamList, 'CoachDetail'>;
  navigation: NativeStackNavigationProp<RootStackParamList, 'CoachDetail'>;
};

export const useCoachDetail = ({ route, navigation }: Props) => {
  // PARAM
  const { coachId } = route.params;
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
    if (!coachId) return;

    setIsLoading(true);
    setError(null);
    try {
      const [resCoach, resCoachFeedback] = await Promise.all([
        CoachService.getById(coachId),
        coachFeedbackService.getById(coachId),
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
      coach_id: selectedCoachId || coachId,
      pricePerHour: coachDetail?.pricePerHour,
    });
  };

  const sendRequestRoadmap = () => {
    console.log('Send request roadmap with coach id: ', coachId);
    navigation.navigate('SendRequestScreen', {
      coach_id: coachId,
      pricePerHour: coachDetail?.pricePerHour,
    });
  };

  const onChatPress = async () => {
    try {
      const idStr = await AsyncStorage.getItem('id');
      const currentId = idStr ? JSON.parse(idStr) : null;

      if (!currentId || !coachId) return;

      // Fetch conversations to find the one with coach
      const response = await MessageService.getConversationByUser(currentId) as any;
      let conversationId = null;

      if (response && response.content) {
        const conversation = response.content.find(
          (conv: any) => conv.otherUserId === coachId
        );
        conversationId = conversation?.conversationId || null;
      }

      navigation.navigate('ChatScreen', {
        receiverId: coachId,
        receiverName: coachDetail?.fullName || '',
        receiverAvatar: coachDetail?.avatarUrl || '',
        conversationId: conversationId,
      });
    } catch (error) {
      console.error('Error navigating to chat:', error);
      // Fallback navigation without conversationId
      navigation.navigate('ChatScreen', {
        receiverId: coachId,
        receiverName: coachDetail?.fullName || '',
        receiverAvatar: coachDetail?.avatarUrl || '',
      });
    }
  };

  // USE EFFECT
  useEffect(() => {
    if (!coachId) return;

    fetchById();
  }, [coachId]);

  return {
    coachDetail,
    coachFeedbacks,
    scrollY,
    selectedCoachId,
    onPressBtn,
    sendRequestRoadmap,
    onChatPress,
    isLoading,
    error,
  };
};
