import { Text, View } from 'react-native';
import PlayButton from './PlayButton';
import Ionicons from '@react-native-vector-icons/ionicons';

type Props = {
  isPracticeTab: boolean;
  exerciseName: string;
  isVideoPlay: boolean;
  togglePlayButton: () => void;
};

const StatsSection = ({
  isPracticeTab,
  exerciseName,
  isVideoPlay,
  togglePlayButton,
}: Props) => {
  // COLOR
  const DANGER_DARKER = '#BF1A1A';

  return (
    <View className="absolute px-4 h-[5%] w-full bottom-0 flex bg-background">
      {/* Play button */}
      <PlayButton
        isVideoPlay={isVideoPlay}
        togglePlayButton={togglePlayButton}
      />

      {isPracticeTab ? (
        <>
          <View className="absolute -top-6 left-4">
            <View className="flex-row gap-1 items-center">
              <Ionicons
                name="fitness-outline"
                size={20}
                color={DANGER_DARKER}
              />
              <View className="flex-row gap-1 items-end">
                <Text className="color-foreground font-bold">100</Text>
                <Text className="color-foreground text-sm">bpm</Text>
              </View>
            </View>
          </View>
          <Text
            className={`text-center text-4xl font-bold color-foreground mt-2`}
          >
            10 rep
          </Text>
        </>
      ) : (
        <Text
          className={`text-center text-2xl font-bold color-foreground mt-2`}
        >
          {exerciseName}
        </Text>
      )}
    </View>
  );
};

export default StatsSection;
