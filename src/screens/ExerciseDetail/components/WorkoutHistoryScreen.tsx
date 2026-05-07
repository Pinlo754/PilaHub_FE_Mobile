import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { colors } from '../../../theme/colors';
import { WorkoutSessionType } from '../../../utils/WorkoutSessionType';
import { formatDateTime } from '../../../utils/day';
import WorkoutDetailModal from './WorkoutDetailModal';

type Props = {
  visible: boolean;
  onClose: () => void;
  workoutHistory: WorkoutSessionType[];
  fetchAISummary: (workoutSessionId: string, recordUrl: string) => void;
};

type FilterTab = 'free' | 'course' | 'roadmap';

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: 'free', label: 'Tập lẻ' },
  { key: 'course', label: 'Khóa học' },
  { key: 'roadmap', label: 'Lộ trình cá nhân' },
];

const PAGE_SIZE = 13;

const WorkoutHistoryScreen = ({
  visible,
  onClose,
  workoutHistory,
  fetchAISummary,
}: Props) => {
  const [activeFilter, setActiveFilter] = useState<FilterTab>('free');
  const [page, setPage] = useState(1);
  const [selectedSession, setSelectedSession] =
    useState<WorkoutSessionType | null>(null);

  if (!visible) return null;

  const filteredData = workoutHistory.filter(session => {
    if (activeFilter === 'free')
      return !session.personalExerciseId && !session.lessonExerciseProgressId;
    if (activeFilter === 'course') return !!session.lessonExerciseProgressId;
    if (activeFilter === 'roadmap') return !!session.personalExerciseId;
    return true;
  });

  const totalPages = Math.ceil(filteredData.length / PAGE_SIZE);
  const paginatedData = filteredData.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  const goToPage = (p: number) => {
    if (p < 1 || p > totalPages) return;
    setPage(p);
  };

  const onChangeFilter = (tab: FilterTab) => {
    setActiveFilter(tab);
    setPage(1);
  };

  return (
    <View className="absolute inset-0 z-50 bg-background">
      {/* Header */}
      <View className="pt-14 pb-4">
        <Pressable onPress={onClose} className="absolute top-16 left-4 z-10">
          <Ionicons
            name="chevron-back-outline"
            size={22}
            color={colors.foreground}
          />
        </Pressable>
        <Text className="color-foreground text-3xl font-bold text-center">
          Lịch sử tập luyện
        </Text>
      </View>

      {/* Filter Tabs */}
      <View className="flex-row items-center justify-center mt-2 gap-1 pb-4">
        {FILTER_TABS.map(tab => (
          <Pressable
            key={tab.key}
            onPress={() => onChangeFilter(tab.key)}
            className={`flex items-center w-36 border-b-2 ${
              activeFilter === tab.key
                ? 'border-foreground'
                : 'border-transparent'
            }`}
          >
            <Text
              className={`text-lg font-semibold ${
                activeFilter === tab.key
                  ? 'color-foreground'
                  : 'color-secondaryText'
              }`}
            >
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Table Header */}
      <View className="flex-row gap-4 px-4 py-3 bg-background-sub1">
        <Text className="w-10 text-secondaryText font-semibold text-center">
          STT
        </Text>
        <Text className="grow text-secondaryText font-semibold">Thời gian</Text>
        <Text className="w-24 text-secondaryText font-semibold text-center">
          Hoàn thành
        </Text>
        <View className="w-9" />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Rows */}
        <View className="flex-col gap-2 px-4 pt-3">
          {paginatedData.length === 0 ? (
            <Text className="text-secondaryText text-center mt-6">
              Chưa có phiên tập được hoàn thành!
            </Text>
          ) : (
            paginatedData.map((session, index) => (
              <View
                key={session.workoutSessionId}
                className="flex-row gap-4 border-b border-background-sub1 pb-2 items-center"
              >
                <Text className="w-10 text-secondaryText font-medium text-center">
                  {(page - 1) * PAGE_SIZE + index + 1}
                </Text>
                <Text className="grow text-secondaryText font-medium">
                  {formatDateTime(session.startTime)}
                </Text>
                <View className="w-24 items-center">
                  {session.completed ? (
                    <Ionicons
                      name="checkmark-circle"
                      size={22}
                      color={colors.success.DEFAULT}
                    />
                  ) : (
                    <Ionicons
                      name="close-circle"
                      size={22}
                      color={colors.danger.DEFAULT}
                    />
                  )}
                </View>
                <Pressable
                  className="rounded-lg bg-info-20 p-1.5"
                  onPress={() => setSelectedSession(session)}
                >
                  <Ionicons name="eye" size={18} color={colors.info.darker} />
                </Pressable>
              </View>
            ))
          )}
        </View>

        {/* Pagination */}
        {totalPages > 1 && (
          <View className="flex-row items-center justify-center gap-2 mt-4">
            <Pressable
              onPress={() => goToPage(page - 1)}
              disabled={page === 1}
              className={`w-8 h-8 rounded-lg items-center justify-center ${page === 1 ? 'bg-inactive-lighter' : 'bg-background-sub1'}`}
            >
              <Ionicons
                name="chevron-back"
                size={16}
                color={
                  page === 1 ? colors.inactive.darker : colors.secondaryText
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
      </ScrollView>

      {/* Detail Modal */}
      <WorkoutDetailModal
        session={selectedSession}
        onClose={() => setSelectedSession(null)}
        onPressAISummary={fetchAISummary}
      />
    </View>
  );
};

export default WorkoutHistoryScreen;
