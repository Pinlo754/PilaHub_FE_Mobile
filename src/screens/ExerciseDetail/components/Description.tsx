import Ionicons from '@react-native-vector-icons/ionicons';
import { ScrollView, Text, View } from 'react-native';
import { ExerciseType } from '../../../utils/ExerciseType';
import { secondsToTime } from '../../../utils/time';
import { colors } from '../../../theme/colors';
import { useEffect, useRef } from 'react';
import { WorkoutSessionType } from '../../../utils/WorkoutSessionType';
import HistoryTable from './HistoryTable';

type Props = {
  exerciseDetail: ExerciseType;
  isPracticeTab: boolean;
  workoutHistory?: WorkoutSessionType[];
  canPlayTheory: boolean;
  fetchAISummary: (workoutSessionId: string, recordUrl: string) => void;
  isFromList: boolean;
};

const Description = ({
  exerciseDetail,
  isPracticeTab,
  workoutHistory = [],
  canPlayTheory,
  fetchAISummary,
  isFromList,
}: Props) => {
  // USE REF
  const scrollRef = useRef<ScrollView>(null);

  // USE EFFECT
  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [isPracticeTab]);

  return (
    <View className="mt-3 flex-1 min-h-0">
      {/* Scroll  */}
      <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false}>
        {/* Duration */}
        <View className="flex-row gap-2 items-center mb-2">
          <View className="flex-row gap-1 items-center">
            <Ionicons name="time-outline" size={24} color={colors.foreground} />
            <Text className="text-foreground font-semibold">Thời lượng:</Text>
          </View>

          <Text className="text-secondaryText font-medium">
            {secondsToTime(exerciseDetail.duration)}
          </Text>
        </View>

        {/* Description */}
        <View className={`flex-col mb-2 ${isPracticeTab ? '' : 'pb-5'}`}>
          <View className="flex-row gap-1 items-center">
            <Ionicons
              name="information-circle-outline"
              size={24}
              color={colors.foreground}
            />

            <Text className="text-foreground font-semibold">Mô tả:</Text>
          </View>

          <Text className="text-secondaryText font-medium">
            {exerciseDetail.description}
          </Text>
        </View>

        {/* History */}
        {isPracticeTab && canPlayTheory && (
          <View className="flex-col gap-2 pb-5">
            <View className="flex-row gap-1 items-center">
              <Ionicons
                name="timer-outline"
                size={24}
                color={colors.foreground}
              />
              <Text className="text-foreground font-semibold">
                {isFromList
                  ? 'Lịch sử tập trong khóa học'
                  : 'Lịch sử tập buổi lẻ'}
              </Text>
            </View>

            {/* Table */}
            <View className="w-full">
              {/* Header */}
              <View className="flex-row gap-4 border-b border-background-sub1 pb-2 mb-2">
                <Text className="w-10 text-foreground font-medium text-center">
                  STT
                </Text>
                <Text className="grow text-foreground font-medium">
                  Thời gian
                </Text>
                <Text className="w-24 text-foreground font-medium text-center">
                  Hoàn thành
                </Text>
                <View className="w-8" />
              </View>

              {/* Body */}
              {workoutHistory.length === 0 ? (
                <View className="py-4 items-center">
                  <Text className="text-secondaryText">
                    Chưa có phiên tập được hoàn thành
                  </Text>
                </View>
              ) : (
                <HistoryTable
                  workoutHistory={workoutHistory}
                  fetchAISummary={fetchAISummary}
                />
              )}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default Description;
