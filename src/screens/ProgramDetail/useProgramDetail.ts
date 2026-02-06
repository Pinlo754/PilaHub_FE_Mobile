import { useEffect, useState } from 'react';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { RouteProp } from '@react-navigation/native';
import { programMock } from '../../mocks/programData';
import { ProgramType } from '../../utils/RoadmapType';

type Props = {
  route: RouteProp<RootStackParamList, 'ProgramDetail'>;
};

export const useProgramDetail = ({ route }: Props) => {
  // PARAM
  const { program_id } = route.params;

  // STATE
  const [programDetail, setProgramDetail] = useState<ProgramType>();


  // FETCH
  const fetchById = () => {
    setProgramDetail(programMock[0]);
  };


  // USE EFFECT
  useEffect(() => {
    if (!program_id) return;

    fetchById();
  }, [program_id]);

  return {
    programDetail,
  };
};
