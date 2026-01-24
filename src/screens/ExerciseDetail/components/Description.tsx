import Ionicons from '@react-native-vector-icons/ionicons';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { ExerciseType } from '../../../utils/ExerciseType';
import { secondsToTime } from '../../../utils/time';

type Props = {
  exerciseDetail: ExerciseType;
  isPracticeTab: boolean;
};

const Description = ({ exerciseDetail, isPracticeTab }: Props) => {
  // COLOR
  const FOREGROUND = '#A0522D';
  const INFO_DARKER = '#3B82F6';

  return (
    <View className="mt-3 flex-1 min-h-0">
      {/* Scroll  */}
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Duration */}
        <View className="flex-row gap-2 items-center mb-2">
          <View className="flex-row gap-1 items-center">
            <Ionicons name="time-outline" size={24} color={FOREGROUND} />
            <Text className="text-foreground font-semibold">Thời lượng:</Text>
          </View>

          <Text className="text-secondaryText font-medium">
            {secondsToTime(exerciseDetail.default_duration_sec)}
          </Text>
        </View>

        {/* Description */}
        <View className={`flex-col mb-2 ${isPracticeTab ? '' : 'pb-5'}`}>
          <View className="flex-row gap-1 items-center">
            <Ionicons
              name="information-circle-outline"
              size={24}
              color={FOREGROUND}
            />

            <Text className="text-foreground font-semibold">Mô tả:</Text>
          </View>

          <Text className="text-secondaryText font-medium">
            {exerciseDetail.description}
          </Text>
        </View>

        {/* History */}
        {isPracticeTab && (
          <View className="flex-col gap-2 pb-5">
            <View className="flex-row gap-1 items-center">
              <Ionicons name="timer-outline" size={24} color={FOREGROUND} />
              <Text className="text-foreground font-semibold">Lịch sử tập</Text>
            </View>

            {/* Table */}
            <View className="w-full">
              {/* Header */}
              <View className="flex-row gap-4 mb-2">
                <Text className="w-10 text-foreground font-medium text-center">
                  STT
                </Text>
                <Text className="grow text-foreground font-medium">
                  Thời gian
                </Text>
                <Text className="w-24 text-foreground font-medium text-center">
                  Phần trăm
                </Text>
                <View className="w-8" />
              </View>

              {/* Body */}
              <View className="flex-col gap-2">
                <View className="flex-row gap-4 border-t border-background-sub1 pt-2 items-center">
                  <Text className="w-10 text-secondaryText font-medium text-center">
                    1
                  </Text>
                  <Text className="grow text-secondaryText font-medium">
                    2023-12-01 08:00
                  </Text>
                  <Text className="w-24 text-secondaryText font-medium text-center">
                    80%
                  </Text>
                  <Pressable className="rounded-lg bg-info-20 p-1.5">
                    <Ionicons name="eye" size={18} color={INFO_DARKER} />
                  </Pressable>
                </View>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default Description;
