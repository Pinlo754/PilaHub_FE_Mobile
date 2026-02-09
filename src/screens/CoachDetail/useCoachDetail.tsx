import { useEffect, useRef, useState } from 'react';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { RouteProp } from '@react-navigation/native';
import { coachMock } from '../../mocks/searchData';
import { CoachType } from '../../utils/CoachType';
import { Animated } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

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

  // USE REF
  const scrollY = useRef(new Animated.Value(0)).current;

  // FETCH
  const fetchById = () => {
    setCoachDetail(coachMock[0]);
  };

  // HANDLERS
  const onPressBtn = () => {
    navigation.navigate('RegisterCalendar', {
      coach_id: selectedCoachId || coach_id,
    });
  };

  // USE EFFECT
  useEffect(() => {
    if (!coach_id) return;

    fetchById();
  }, [coach_id]);

  return {
    coachDetail,
    scrollY,
    selectedCoachId,
    onPressBtn,
  };
};
