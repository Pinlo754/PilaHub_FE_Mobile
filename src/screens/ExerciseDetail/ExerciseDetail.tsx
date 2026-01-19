import React from 'react';
import { Pressable, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import ImageExercise from './components/ImageExercise';
import Content from './components/Content';
import { useExerciseDetail } from './useExerciseDetail';
import Ionicons from '@react-native-vector-icons/ionicons';

type Props = NativeStackScreenProps<RootStackParamList, 'ExerciseDetail'>;

const ExerciseDetail: React.FC<Props> = ({}) => {
  // COLOR
  const FOREGROUND = '#A0522D';

  // HOOK
  const { activeTab, onChangeTab } = useExerciseDetail();

  return (
    <View className="w-full flex-1 relative">
      {/* Header */}
      <Pressable className="absolute top-5 left-4 z-10">
        <Ionicons name="chevron-back-outline" size={24} color={FOREGROUND} />
      </Pressable>

      {/* Image */}
      <ImageExercise />

      {/* Content */}
      <Content activeTab={activeTab} onChangeTab={onChangeTab} />
    </View>
  );
};

export default ExerciseDetail;
