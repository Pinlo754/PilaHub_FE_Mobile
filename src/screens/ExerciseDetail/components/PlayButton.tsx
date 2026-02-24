import { Pressable, View } from 'react-native';
import NotchedBackground from '../../../components/NotchedBackground';
import Ionicons from '@react-native-vector-icons/ionicons';
import { colors } from '../../../theme/colors';

type Props = {
  isVideoPlay: boolean;
  togglePlayButton: () => void;
};

const PlayButton = ({ isVideoPlay, togglePlayButton }: Props) => {
  return (
    <>
      <View className="absolute -top-12 w-full">
        <NotchedBackground
          notchRadius={35}
          shoulderRadius={18}
          cornerRadius={25}
          height={50}
          backgroundColor={colors.background.DEFAULT}
        />
      </View>
      <Pressable
        onPress={togglePlayButton}
        className={`absolute self-center -top-[65px] z-20 w-16 h-16 rounded-full bg-background items-center justify-center ${!isVideoPlay && 'pl-1'}`}
      >
        <Ionicons
          name={isVideoPlay ? 'pause' : 'play'}
          size={38}
          color={colors.foreground}
        />
      </Pressable>
    </>
  );
};

export default PlayButton;
