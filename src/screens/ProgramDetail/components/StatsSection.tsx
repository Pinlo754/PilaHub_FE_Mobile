import { Text, View } from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { colors } from '../../../theme/colors';
import { useEffect, useState } from 'react';
import { secondsToTime } from '../../../utils/time';
import PlayButton from './PlayButton';

type Props = {
  isPracticeTab: boolean;
  exerciseName: string;
  isVideoPlay: boolean;
  togglePlayButton: () => void;
  exerciseDuration: number;
  exerciseTimeLeft: number;
  isExerciseRunning: boolean;
  currentSet?: number;
  totalSets?: number;
};

const StatsSection = ({
  isPracticeTab,
  exerciseName,
  isVideoPlay,
  togglePlayButton,
  exerciseDuration,
  exerciseTimeLeft,
  currentSet = 1,
  totalSets = 1,
}: Props) => {
  // STATE
  const [remainingTime, setRemainingTime] = useState(exerciseDuration);

  // USE EFFECT
  useEffect(() => {
    if (!isVideoPlay) return;

    if (remainingTime <= 0) return;

    const interval = setInterval(() => {
      setRemainingTime(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isVideoPlay, remainingTime]);

  useEffect(() => {
    setRemainingTime(exerciseDuration);
  }, [exerciseDuration]);
  return (
    <View className="absolute px-4 h-[8%] w-full bottom-0 flex bg-background">
      {/* Play button */}
      {/* {!isPracticeTab && ( */}
      <PlayButton
        isVideoPlay={isVideoPlay}
        togglePlayButton={togglePlayButton}
      />
      {/* )} */}

      {isPracticeTab ? (
        <>
          <View className="absolute -top-6 left-4">
            <View className="flex-row gap-1 items-center">
              <Ionicons
                name="repeat-outline"
                size={20}
                color={colors.foreground}
              />
              <View className="flex-row gap-1 items-end">
                <Text className="color-foreground font-bold">
                  {currentSet}/{totalSets}
                </Text>
                <Text className="color-foreground text-sm">sets</Text>
              </View>
            </View>
          </View>

          <View className="absolute -top-6 right-4">
            <View className="flex-row gap-1 items-center">
              <Ionicons
                name="stopwatch-outline"
                size={20}
                color={colors.foreground}
              />
              <View className="flex-row gap-1 items-end">
                <Text className="color-foreground font-bold">
                  {secondsToTime(exerciseTimeLeft, { pad: true })}
                </Text>
              </View>
            </View>
          </View>
          <Text
            className={`text-center text-2xl font-bold color-foreground mt-2`}
          >
            {exerciseName}
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
