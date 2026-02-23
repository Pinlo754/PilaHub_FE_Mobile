import { Pressable, StatusBar, View } from 'react-native';
import Header from './components/Header';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { useAIPractice } from './useAIPractice';
import ImageExercise from './components/ImageExercise';
import VideoPlayer from './components/VideoPlayer/VideoPlayer';
import InstructModal from './components/InstructModal';

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

  return (
    <View className="flex-1 bg-background pt-14">
      <StatusBar hidden={showInstruct} />

      {/* Header */}
      <Header openInstructModal={openInstructModal} />

      {/* Image / Video Record */}
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
      )}

      {/* Instruct Modal */}
      {showInstruct && (
        <View className="absolute inset-0 bg-black/40">
          <InstructModal visible={showInstruct} onClose={closeInstructModal} />
        </View>
      )}
    </View>
  );
};

export default AIPractice;
