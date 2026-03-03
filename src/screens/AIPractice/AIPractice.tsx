import { Pressable, StatusBar, Text, View } from 'react-native';
import Header from './components/Header';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { useAIPractice } from './useAIPractice';
import ImageExercise from './components/ImageExercise';
import VideoPlayer from './components/VideoPlayer/VideoPlayer';
import InstructModal from './components/InstructModal';
import AITracking from '../AITracking/AITracking';
import { useState } from 'react';
type Props = NativeStackScreenProps<RootStackParamList, 'AIPractice'>;

const AIPractice = (props: Props) => {
  // HOOK
  const {
    isVideoVisible,
    setIsVideoVisible,
    isVideoPlay,
    togglePlayButton,
    showInstruct,
    openInstructModal,
    closeInstructModal,
  } = useAIPractice();
  const [feedback, setFeedback] = useState({
  status: 'Ready',
  detail: 'Đang đợi dữ liệu...',
});
  return (
    <View className="flex-1 bg-background pt-14">
      <StatusBar hidden={showInstruct} />

      {/* Header */}
      <View className="absolute top-0 h-36 pt-8 left-0 right-0 z-10 bg-background ">
        <Header openInstructModal={openInstructModal} />
      </View>
      {/* Image / Video Record
      {isVideoVisible ? (
        <VideoPlayer
          source="https://www.w3schools.com/html/mov_bbb.mp4"
          isVideoPlay={isVideoPlay}
          togglePlayButton={togglePlayButton}
        />
      ) : (
        <ImageExercise
          img_url={
            'https://images.pexels.com/photos/3823039/pexels-photo-3823039.jpeg'
          }
          setIsVideoVisible={setIsVideoVisible}
          togglePlayButton={togglePlayButton}
        />
      )} */}

      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
      >
        <AITracking onFeedback={setFeedback} />
      </View>
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
        }}
      >
        <View className='absolute bottom-0 left-0 right-0 h-40 bg-background'/>
        <View className="absolute bottom-10 left-5 right-5">
                <View className={`p-5 rounded-3xl border-2 ${feedback.status.includes('❌') ? 'border-red-500' : 'border-emerald-500'}`}>
                    <Text className={`text-2xl font-bold text-center ${feedback.status.includes('❌') ? 'text-red-500' : 'text-emerald-500'}`}>
                        {feedback.status}
                    </Text>
                    <Text className="text-foreground text-center text-base mt-2 font-medium">
                        {feedback.detail}
                    </Text>
                </View>
            </View>
      </View>
      {/* Instruct Modal */}
      {
        showInstruct && (
          <View className="absolute inset-0 bg-black/40">
            <InstructModal visible={showInstruct} onClose={closeInstructModal} />
          </View>
        )
      }

    </View >
  );
};

export default AIPractice;
