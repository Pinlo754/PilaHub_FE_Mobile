import React, { useMemo, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import StageCarousel from './StageCarousel';
import StageCalendar from './StageCalendar';
import ScheduleDetail from './ScheduleDetail';
import SupplementSection from './SupplementSection';

// Normalize API stage shape { stage: {...}, schedules: [ { schedule, exercises } ] }
function normalizeApiStages(apiStages: any[]) {
  if (!Array.isArray(apiStages)) return [];

  return apiStages.map((entry: any, idx: number) => {
    const st = entry?.stage ?? entry ?? {};
    const rawSchedules = Array.isArray(entry?.schedules)
      ? entry.schedules
      : Array.isArray(st?.schedules)
      ? st.schedules
      : [];

    const schedules = rawSchedules.map((rs: any) => {
      const s = rs?.schedule ?? rs ?? {};
      const exercises = Array.isArray(rs?.exercises)
        ? rs.exercises.map((ex: any) => ({
            exerciseName: ex?.exerciseName ?? ex?.name ?? ex?.exercise?.name ?? ex?.title ?? 'Bài tập',
            sets: ex?.sets ?? ex?.repsSets ?? ex?.setsCount ?? null,
            reps: ex?.reps ?? ex?.repetition ?? null,
            durationSeconds: ex?.durationSeconds ?? ex?.duration ?? null,
            thumbnail: ex?.thumbnail ?? ex?.image ?? ex?.picture ?? null,
            ...ex,
          }))
        : [];

      return {
        scheduleName: s?.scheduleName ?? s?.name ?? s?.title ?? null,
        scheduledDate: s?.scheduledDate ?? s?.startDate ?? s?.startTime ?? s?.date ?? null,
        dayOfWeek: s?.dayOfWeek ?? s?.day ?? null,
        durationMinutes: s?.durationMinutes ?? s?.duration ?? null,
        sets: s?.sets ?? null,
        exercises,
        ...s,
      };
    });

    return {
      // canonical fields used across the UI
      stageName: st?.stageName ?? st?.title ?? st?.name ?? `Giai đoạn ${idx + 1}`,
      durationWeeks: st?.durationWeeks ?? st?.duration ?? st?.weeks ?? 0,
      supplementRecommendations: st?.supplementRecommendations ?? st?.supplements ?? st?.supplement ?? [],
      schedules,
      // keep original for reference
      _raw: entry,
      ...st,
    };
  });
}

export default function StageRendererApi({ apiStages, _roadmap, loading }: any) {
  const normalized = useMemo(() => normalizeApiStages(apiStages), [apiStages]);
  const [selectedStageIndex, setSelectedStageIndex] = useState(0);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  if (loading) {
    return (
      <View className="items-center justify-center my-6">
        <ActivityIndicator size="small" color="#8B4513" />
        <Text className="mt-2">Đang tải giai đoạn...</Text>
      </View>
    );
  }
  const selectedStage = normalized[selectedStageIndex] ?? null;

  const selectedSchedule =
    selectedStage?.schedules?.find((s: any) =>
      selectedDate ? s.scheduledDate?.startsWith?.(selectedDate) : false
    ) ?? null;

  if (!normalized?.length) {
    return null;
  }

  return (
    <>
      {/* Stage selector */}
      <View className="mt-6">
        <Text className="text-lg font-semibold text-[#8B4513] mb-3 px-2">Giai đoạn</Text>
        <StageCarousel stages={normalized} onChangeIndex={setSelectedStageIndex} />
      </View>

      {/* Calendar */}
      <StageCalendar
        stage={selectedStage}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
      />

      {/* Schedule detail */}
      <ScheduleDetail schedule={selectedSchedule} />

      {/* Supplement */}
      <SupplementSection stage={selectedStage} />

      {/* Fallback: if the selected stage has no supplements, show roadmap-level supplements when available */}
      {!selectedStage?.supplementRecommendations?.length && _roadmap?.supplementRecommendations?.length ? (
        <SupplementSection stage={{ supplementRecommendations: _roadmap.supplementRecommendations }} />
      ) : null}
    </>
  );
}

export { normalizeApiStages };
