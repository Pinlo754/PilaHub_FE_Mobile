import Ionicons from '@react-native-vector-icons/ionicons';
import { View, Pressable } from 'react-native';

type Props = {
  toggleMic: () => void;
  micOn: boolean;
  toggleCamera: () => void;
  cameraOn: boolean;
  leaveCall: () => void;
  flipCamera: () => void;
};

const Control = ({
  cameraOn,
  leaveCall,
  toggleCamera,
  toggleMic,
  micOn,
  flipCamera,
}: Props) => {
  return (
    <View className="absolute bottom-10 w-full px-10 flex-row justify-around">
      {/* Camera On/off */}
      <Pressable
        onPress={toggleCamera}
        className="bg-black/40 w-16 h-16 flex items-center justify-center rounded-full"
      >
        <Ionicons
          name={cameraOn ? 'videocam-off' : 'videocam'}
          size={28}
          color="white"
        />
      </Pressable>

      {/* Flip Camera */}
      <Pressable
        onPress={flipCamera}
        className="bg-black/40 w-16 h-16 flex items-center justify-center rounded-full"
      >
        <Ionicons name="camera-reverse" size={28} color="white" />
      </Pressable>

      {/* Mic On/off */}
      <Pressable
        onPress={toggleMic}
        className="bg-black/40 w-16 h-16 rounded-full flex items-center justify-center"
      >
        <Ionicons name={micOn ? 'mic-off' : 'mic'} size={28} color="white" />
      </Pressable>

      {/* Leave Call */}
      <Pressable
        onPress={leaveCall}
        className="bg-[#F83D39] w-16 h-16 rounded-full flex items-center justify-center"
      >
        <Ionicons name="close" size={28} color="white" />
      </Pressable>
    </View>
  );
};

export default Control;
