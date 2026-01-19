import Ionicons from '@react-native-vector-icons/ionicons';
import { Pressable, ScrollView, Text, View } from 'react-native';
import Button from '../../../components/Button';
import { ExerciseTab } from '../../../constants/exerciseTab';

type Props = {
  tabId: ExerciseTab;
};

const Description = ({ tabId }: Props) => {
  // COLOR
  const FOREGROUND = '#A0522D';
  const INFO_DARKER = '#3B82F6';

  // CHECK
  const isPracticeTab = tabId === ExerciseTab.Practice;

  return (
    <View className="mt-3 flex-1">
      {/* Scroll  */}
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Duration */}
        <View className="flex-row gap-2 items-center mb-2">
          <View className="flex-row gap-1 items-center">
            <Ionicons name="time-outline" size={24} color={FOREGROUND} />
            <Text className="text-foreground font-semibold">Thời lượng:</Text>
          </View>

          <Text className="text-secondaryText font-medium">60p</Text>
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
            Hướng dẫn thực hành các động tác Pilates cơ bản, tập trung vào tư
            thế đúng, nhịp thở và kiểm soát chuyển động, giúp người tập làm quen
            và thực hiện bài tập một cách an toàn, hiệu quả.
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

      {/* Btn */}
      {isPracticeTab && (
        <View className="pt-2">
          <Button
            text="Bắt đầu buổi tập"
            onPress={() => {}}
            colorType="sub2"
            rounded="full"
            iconName="log-in-outline"
          />
        </View>
      )}
    </View>
  );
};

export default Description;
