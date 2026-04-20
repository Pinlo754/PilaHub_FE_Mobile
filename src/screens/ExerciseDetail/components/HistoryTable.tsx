import { useState } from 'react';
import { WorkoutSessionType } from '../../../utils/WorkoutSessionType';
import { Pressable, Text, View } from 'react-native';
import { formatDateTime } from '../../../utils/day';
import Ionicons from '@react-native-vector-icons/ionicons';
import { colors } from '../../../theme/colors';
import WorkoutDetailModal from './WorkoutDetailModal';

type Props = {
  workoutHistory: WorkoutSessionType[];
};

const PAGE_SIZE = 3;

const HistoryTable = ({ workoutHistory }: Props) => {
  const [page, setPage] = useState(1);
  const [selectedSession, setSelectedSession] =
    useState<WorkoutSessionType | null>(null);

  const totalPages = Math.ceil(workoutHistory.length / PAGE_SIZE);
  const paginatedData = workoutHistory.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  const goToPage = (p: number) => {
    if (p < 1 || p > totalPages) return;
    setPage(p);
  };

  return (
    <>
      {/* Rows */}
      <View className="flex-col gap-2">
        {paginatedData.map((session, index) => (
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
        ))}
      </View>

      {/* Pagination */}
      {totalPages > 1 && (
        <View className="flex-row items-center justify-center gap-2 mt-3">
          {/* Prev */}
          <Pressable
            onPress={() => goToPage(page - 1)}
            disabled={page === 1}
            className={`w-8 h-8 rounded-lg items-center justify-center ${page === 1 ? 'bg-inactive-lighter' : 'bg-background-sub1'}`}
          >
            <Ionicons
              name="chevron-back"
              size={16}
              color={page === 1 ? colors.inactive.darker : colors.secondaryText}
            />
          </Pressable>

          {/* Page numbers */}
          <Text className={`font-semibold text-sm text-foreground`}>
            {page}/{totalPages}
          </Text>

          {/* Next */}
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

      {/* Total count */}
      {/* <Text className="text-secondaryText text-xs text-center mt-2">
        {workoutHistory.length} buổi tập · Trang {page}/{totalPages}
      </Text> */}

      {/* Detail Modal */}
      <WorkoutDetailModal
        session={selectedSession}
        onClose={() => setSelectedSession(null)}
      />
    </>
  );
};

export default HistoryTable;
