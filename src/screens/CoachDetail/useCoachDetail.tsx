import { useEffect, useRef, useState } from 'react';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { RouteProp } from '@react-navigation/native';
import { coachMock } from '../../mocks/searchData';
import { CoachType } from '../../utils/CoachType';
import { Animated } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import api from '../../hooks/axiosInstance';

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

  // USE REF
  const scrollY = useRef(new Animated.Value(0)).current;

  // FETCH
  const fetchById = () => {
    api.get(`/coaches/${coachId}`).then((res) => {
      if (res.data.success) {
        setCoachDetail(res.data.data);
      } else {
        throw {
          type: 'BUSINESS_ERROR',
          message: res.data.message,
          errorCode: res.data.errorCode,
        };
      }
    });
  };

  // HANDLERS
  const onPressBtn = () => {
    navigation.navigate('RegisterCalendar', {
      coach_id: selectedCoachId || coachId,
    });
  };

  const sendRequestRoadmap = () => {
    console.log('Send request roadmap with coach id: ', coachId);
    navigation.navigate('SendRequestScreen', {
      coach_id: coachId,
    });
  };

  // USE EFFECT
  useEffect(() => {
    if (!coachId) return;

    fetchById();
  }, [coachId]);

  return {
    coachDetail,
    scrollY,
    selectedCoachId,
    onPressBtn,
    sendRequestRoadmap
  };
};
