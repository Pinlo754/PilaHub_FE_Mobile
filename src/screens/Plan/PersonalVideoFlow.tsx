import React from 'react';
import { Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import VideoPlayer from '../AIPractice/components/VideoPlayer/VideoPlayer';
import { markPersonalExerciseCompleted } from '../../services/personalExercise.service';

// Lightweight wrapper screen to play a tutorial and mark personal exercise as completed when video ends
export default function PersonalVideoFlow({ route }: any) {
  const navigation = useNavigation<any>();
  const { source, personalExerciseId } = route.params ?? {};

  const handleEnd = async () => {
    try {
      if (personalExerciseId) {
        await markPersonalExerciseCompleted(personalExerciseId);
      }
    } catch (err) {
      console.warn('complete failed', err);
      Alert.alert('Lỗi', 'Không thể cập nhật hoàn thành bài tập');
    }

    // go back to previous screen (RoadMap usually)
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate('RoadMap');
  };

  return (
    <React.Fragment>
      <VideoPlayer source={source} isVideoPlay={true} togglePlayButton={() => {}} onEnd={handleEnd} />
    </React.Fragment>
  );
}
