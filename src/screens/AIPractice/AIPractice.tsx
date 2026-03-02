import { StatusBar, View } from 'react-native';
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
    imgUrl,
    videoUrl,
  } = useAIPractice({ route: props.route });

  return (
    <View className="flex-1 bg-background pt-14">
      <StatusBar hidden={showInstruct} />

      {/* Header */}
      <Header openInstructModal={openInstructModal} />

      {/* Image / Video Record */}
      {isVideoVisible ? (
        <VideoPlayer
          source={videoUrl}
          isVideoPlay={isVideoPlay}
          togglePlayButton={togglePlayButton}
        />
      ) : (
        <ImageExercise
          img_url={imgUrl}
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
