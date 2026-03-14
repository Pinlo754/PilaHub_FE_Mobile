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
import Header from './components/Header';

type Props = NativeStackScreenProps<RootStackParamList, 'ProgramDetail'>;

const ProgramDetail: React.FC<Props> = ({ route, navigation }) => {
  const { programDetail } = useProgramDetail({ route });

  return (
    <View className="w-full flex-1 bg-background">
      {programDetail ? (
        <>
          {/* Header */}
          <Header navigation={navigation} />
          <ImageProgram
            imgUrl={programDetail.imageUrl}
            programName={programDetail.name}
          />
          <ProgressConsume
            progress={10}
            number_of_programs={programDetail.totalLesson}
          />
          <ProgramInformation
            goal={programDetail.description}
            level={programDetail.level}
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
