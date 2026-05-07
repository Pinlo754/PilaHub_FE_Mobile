import Ionicons from '@react-native-vector-icons/ionicons';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { ExerciseType } from '../../../utils/ExerciseType';
import { formatTime } from '../../../utils/time';
import { colors } from '../../../theme/colors';
import { useEffect, useRef, useState } from 'react';
import { ExerciseEquipment } from '../../../utils/EquipmentType';
import {
  getBodyPartLabel,
  getBreathingRuleConfig,
  getExerciseTypeConfig,
} from '../../../utils/uiMapper';

type Props = {
  exerciseDetail: ExerciseType;
  isPracticeTab: boolean;
  canPlayTheory: boolean;
  isFromList: boolean;
  equipments: ExerciseEquipment[];
};

const SectionHeader = ({ icon, label }: { icon: string; label: string }) => (
  <View className="flex-row gap-1 items-center">
    <Ionicons name={icon as any} size={20} color={colors.foreground} />
    <Text className="text-foreground font-semibold">{label}</Text>
  </View>
);

// const Badge = ({
//   label,
//   bgColor,
//   textColor,
// }: {
//   label: string;
//   bgColor: string;
//   textColor: string;
// }) => (
//   <View className={`px-2 py-0.5 rounded-full ${bgColor}`}>
//     <Text className={`text-xs font-semibold ${textColor}`}>{label}</Text>
//   </View>
// );

const Description = ({ exerciseDetail, isPracticeTab, equipments }: Props) => {
  // CONSTANT
  const PAGE_SIZE = 5;

  // USE REF
  const scrollRef = useRef<ScrollView>(null);

  // STATE
  const [page, setPage] = useState(1);

  // VARIABLE
  const exerciseTypeConfig = getExerciseTypeConfig(exerciseDetail.exerciseType);
  const breathingConfig = getBreathingRuleConfig(exerciseDetail.breathingRule);

  // HANDLER
  const totalPages = Math.ceil(equipments.length / PAGE_SIZE);
  const paginatedData = equipments.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  const goToPage = (p: number) => {
    if (p < 1 || p > totalPages) return;
    setPage(p);
  };

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
          <SectionHeader icon="time-outline" label="Thời lượng:" />

          <Text className="text-secondaryText font-medium">
            {formatTime(exerciseDetail.duration || 0, {
              showSeconds: false,
            })}
          </Text>
        </View>

        {/* Exercise Type */}
        <View className="flex-row gap-2 items-center mb-3">
          <SectionHeader icon="fitness-outline" label="Loại bài tập:" />
          {/* <Badge
            label={exerciseTypeConfig.label}
            bgColor={exerciseTypeConfig.bgColor}
            textColor={exerciseTypeConfig.textColor}
          /> */}
          <Text className="text-secondaryText font-medium">
            {exerciseTypeConfig.label}
          </Text>
        </View>

        {/* Breathing Rule */}
        {exerciseDetail.breathingRule && (
          <View className="flex-row gap-2 items-center mb-3">
            <SectionHeader icon="leaf-outline" label="Kỹ thuật thở:" />
            {/* <Badge
            label={breathingConfig.label}
            bgColor={breathingConfig.bgColor}
            textColor={breathingConfig.textColor}
          /> */}
            <Text className="text-secondaryText font-medium">
              {breathingConfig.label}
            </Text>
          </View>
        )}

        {/* AI */}
        <View className="flex-row gap-2 items-center mb-2">
          <SectionHeader icon="sparkles-outline" label="Hỗ trợ AI:" />

          <Ionicons
            name={
              exerciseDetail.haveAIsupported
                ? 'checkmark-circle'
                : 'close-circle'
            }
            size={20}
            color={
              exerciseDetail.haveAIsupported
                ? colors.success.DEFAULT
                : colors.danger.DEFAULT
            }
          />
        </View>

        {/* Body Parts */}
        {exerciseDetail.bodyParts && exerciseDetail.bodyParts.length > 0 && (
          <View className="flex-col gap-2 mb-3">
            <SectionHeader icon="body-outline" label="Bộ phận cơ thể:" />
            <View className="flex-row flex-wrap gap-2">
              {exerciseDetail.bodyParts.map(bp => (
                <View
                  key={bp.bodyPartId}
                  className="px-2 py-0.5 rounded-full bg-background-sub1"
                >
                  <Text className="text-sm font-medium text-secondaryText">
                    {getBodyPartLabel(bp.name)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Description */}
        <View className={`flex-col mb-2`}>
          <SectionHeader icon="information-circle-outline" label="Mô tả:" />

          <Text className="text-secondaryText font-medium">
            {exerciseDetail.description}
          </Text>
        </View>

        {/* Benefits */}
        {exerciseDetail.benefits && (
          <View className="flex-col mb-3">
            <SectionHeader icon="star-outline" label="Lợi ích:" />
            <Text className="text-secondaryText font-medium mt-1">
              {exerciseDetail.benefits}
            </Text>
          </View>
        )}

        {/* Prerequisites */}
        {exerciseDetail.prerequisites && (
          <View className="flex-col mb-3">
            <SectionHeader icon="alert-circle-outline" label="Yêu cầu trước:" />
            <Text className="text-secondaryText font-medium mt-1">
              {exerciseDetail.prerequisites}
            </Text>
          </View>
        )}

        {/* Contraindications */}
        {exerciseDetail.contraindications && (
          <View className="flex-col mb-3">
            <View className="flex-row gap-1 items-center">
              <Ionicons
                name="warning-outline"
                size={20}
                color={colors.danger.DEFAULT}
              />
              <Text className="text-danger font-semibold">Chống chỉ định:</Text>
            </View>
            <Text className="text-secondaryText font-medium mt-1">
              {exerciseDetail.contraindications}
            </Text>
          </View>
        )}

        {/* Equipment */}
        {exerciseDetail.equipmentRequired && (
          <View className="flex-col gap-2 pb-5">
            <View className="flex-row gap-1 items-center">
              <Ionicons
                name="barbell-outline"
                size={20}
                color={colors.foreground}
              />
              <Text className="text-foreground font-semibold">Dụng cụ tập</Text>
            </View>
            {equipments.length === 0 ? (
              <View className="items-center py-8 gap-2">
                <Ionicons
                  name="barbell-outline"
                  size={40}
                  color={colors.inactive[80]}
                />
                <Text className="text-secondaryText text-sm">
                  Không cần dụng cụ
                </Text>
              </View>
            ) : (
              <>
                {/* Table Header */}
                <View className="flex-row gap-2 pb-2 border-b border-foreground mb-1">
                  <Text className="w-10 font-medium text-secondaryText text-center">
                    STT
                  </Text>
                  <Text className="flex-1 font-medium text-secondaryText">
                    Tên dụng cụ
                  </Text>
                  <Text className="w-12 font-medium text-secondaryText text-center">
                    SL
                  </Text>
                  <Text className="w-16 font-medium text-secondaryText text-center">
                    Bắt buộc
                  </Text>
                </View>

                {/* Table Rows */}
                <View className="flex-col gap-2">
                  {paginatedData.map((item, index) => (
                    <View
                      key={item.exerciseEquipmentId}
                      className="flex-row gap-2 border-b border-background-sub1 pb-2 items-center"
                    >
                      <Text className="w-10 text-secondaryText font-medium text-center">
                        {(page - 1) * PAGE_SIZE + index + 1}
                      </Text>
                      <View className="flex-1">
                        <Text className="text-foreground font-semibold">
                          {item.equipmentName}
                        </Text>
                        {item.usageNotes ? (
                          <Text
                            className="text-secondaryText mt-0.5 text-sm"
                            numberOfLines={2}
                          >
                            {item.usageNotes}
                          </Text>
                        ) : null}
                      </View>
                      <Text className="w-12 text-secondaryText font-medium text-center">
                        {item.quantity}
                      </Text>
                      <View className="w-16 items-center">
                        {item.required ? (
                          <Ionicons
                            name="checkmark-circle"
                            size={20}
                            color={colors.success.DEFAULT}
                          />
                        ) : (
                          <Ionicons
                            name="remove-circle-outline"
                            size={20}
                            color={colors.inactive[80]}
                          />
                        )}
                      </View>
                    </View>
                  ))}
                </View>

                {/* Pagination */}
                {totalPages > 1 && (
                  <View className="flex-row items-center justify-center gap-2 mt-3">
                    <Pressable
                      onPress={() => goToPage(page - 1)}
                      disabled={page === 1}
                      className={`w-8 h-8 rounded-lg items-center justify-center ${page === 1 ? 'bg-inactive-lighter' : 'bg-background-sub1'}`}
                    >
                      <Ionicons
                        name="chevron-back"
                        size={16}
                        color={
                          page === 1
                            ? colors.inactive.darker
                            : colors.secondaryText
                        }
                      />
                    </Pressable>

                    <Text className="font-semibold text-sm text-foreground">
                      {page}/{totalPages}
                    </Text>

                    <Pressable
                      onPress={() => goToPage(page + 1)}
                      disabled={page === totalPages}
                      className={`w-8 h-8 rounded-lg items-center justify-center ${page === totalPages ? 'bg-inactive-lighter' : 'bg-background-sub1'}`}
                    >
                      <Ionicons
                        name="chevron-forward"
                        size={16}
                        color={
                          page === totalPages
                            ? colors.inactive.darker
                            : colors.secondaryText
                        }
                      />
                    </Pressable>
                  </View>
                )}
              </>
            )}
          </View>
        )}

        {/* History */}
        {/* {isPracticeTab && canPlayTheory && (
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

            <View className="w-full">
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
        )} */}
      </ScrollView>
    </View>
  );
};

export default Description;
