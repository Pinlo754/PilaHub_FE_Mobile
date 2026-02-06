import React from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { SafeAreaView } from 'react-native-safe-area-context';
import ImageProgram from './components/ImageProgram';
import { useProgramDetail } from './useProgramDetail';
import ProgressConsume from './components/ProgressConsume';
import ProgramInformation from './components/ProgramInformation';
import ProgrameContent from './components/ProgrameContent';

type Props = NativeStackScreenProps<RootStackParamList, 'ProgramDetail'>;

const ProgramDetail: React.FC<Props> = ({ route, navigation }) => {
  const { programDetail } = useProgramDetail({ route });

  return (
    <View className="w-full flex-1">
      {programDetail ? (
        <>
          <ImageProgram
            imgUrl={programDetail.image_url}
            programName={programDetail.name}
          />
          <ProgressConsume
            progress={programDetail.progress}
            number_of_programs={programDetail.number_of_programs}
          />
          <ProgramInformation
            goal={programDetail.goal}
            target_trainee={programDetail.target_trainee}
          />
          <ProgrameContent />
        </>
      ) : (
        <ActivityIndicator size="large" color="#A0522D" />
      )}
    </View>
  );
};

export default ProgramDetail;
