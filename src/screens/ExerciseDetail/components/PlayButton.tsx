import { Pressable, View } from 'react-native';
import NotchedBackground from '../../../components/NotchedBackground';
import Ionicons from '@react-native-vector-icons/ionicons';

type Props = {
  isVideoPlay: boolean;
  togglePlayButton: () => void;
};

const PlayButton = ({ isVideoPlay, togglePlayButton }: Props) => {
  // COLOR
  const FOREGROUND = '#A0522D';
  const SUB2 = '#FFF7ED';

  return (
    <>
      <View className="absolute -top-12 w-full">
        <NotchedBackground
          notchRadius={35}
          shoulderRadius={18}
          cornerRadius={25}
          height={50}
          backgroundColor={SUB2}
        />
      </View>
      <Pressable
        onPress={togglePlayButton}
        className={`absolute self-center -top-[65px] z-20 w-16 h-16 rounded-full bg-background items-center justify-center ${!isVideoPlay && 'pl-1'}`}
      >
        <Ionicons
          name={isVideoPlay ? 'pause' : 'play'}
          size={38}
          color={FOREGROUND}
        />
      </Pressable>
    </>
  );
};

export default PlayButton;
