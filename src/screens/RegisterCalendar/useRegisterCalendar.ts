import { useCallback, useEffect, useState } from 'react';
import { coachMock } from '../../mocks/searchData';
import { CoachType } from '../../utils/CoachType';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { RouteProp } from '@react-navigation/native';

type Props = {
  route: RouteProp<RootStackParamList, 'RegisterCalendar'>;
};

export const useRegisterCalendar = ({ route }: Props) => {
  // PARAM
  const paramCoachId = route.params?.coach_id ?? null;

  // STATE
  const [coaches, setCoaches] = useState<CoachType[]>(coachMock);
  const [selectedCoachId, setSelectedCoachId] = useState<string | null>(
    paramCoachId,
  );
  const [selectedPurpose, setSelectedPurpose] = useState<string | null>(null);
  const [showNotiModal, setShowNotiModal] = useState<boolean>(false);
  const [notiMsg, setNotiMsg] = useState<string>('');

  // HANDLERS
  const openNotiModal = (msg: string) => {
    setNotiMsg(msg);
    setShowNotiModal(true);
  };

  const closeNotiModal = () => {
    setNotiMsg('');
    setShowNotiModal(false);
  };

  const onPressCoach = useCallback((id: string) => {
    setSelectedCoachId(id);
  }, []);

  const clearCoachId = () => {
    setSelectedCoachId(null);
  };

  const onPressRegister = () => {};

  // CHECK
  const isValid = !selectedPurpose;

  // USE EFFECT
  useEffect(() => {
    if (paramCoachId) {
      setSelectedCoachId(paramCoachId);
    }
  }, [paramCoachId]);

  return {
    coaches,
    selectedCoachId,
    selectedPurpose,
    onPressPurpose: setSelectedPurpose,
    onPressCoach,
    clearCoachId,
    showNotiModal,
    notiMsg,
    onPressRegister,
    closeNotiModal,
    isValid,
  };
};
