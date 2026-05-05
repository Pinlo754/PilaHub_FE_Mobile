import { ManualExerciseItem, ManualStageItem } from "../types/manualRoadmap.types";

export const WEEKDAY_LABELS_VN: Record<string, string> = {
  MONDAY: 'Thứ 2',
  TUESDAY: 'Thứ 3',
  WEDNESDAY: 'Thứ 4',
  THURSDAY: 'Thứ 5',
  FRIDAY: 'Thứ 6',
  SATURDAY: 'Thứ 7',
  SUNDAY: 'Chủ nhật',
};

export const WEEKDAY_INDEX: Record<string, number> = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
};

/**
 * Format Date -> ISO có timezone +07:00 (KHÔNG dùng Z)
 */
export const toLocalISOString = (date: Date) => {
  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    date.getFullYear() +
    '-' +
    pad(date.getMonth() + 1) +
    '-' +
    pad(date.getDate()) +
    'T' +
    pad(date.getHours()) +
    ':' +
    pad(date.getMinutes()) +
    ':' +
    pad(date.getSeconds()) +
    '+07:00'
  );
};

/**
 * yyyy-mm-dd -> ISO +07:00
 */
export const toIsoStartOfDay = (date: string) => {
  return `${date}T00:00:00+07:00`;
};

/**
 * Cộng ngày (LOCAL)
 */
export const addDays = (dateString: string, days: number) => {
  const d = new Date(`${dateString}T00:00:00`);
  d.setDate(d.getDate() + days);

  return toLocalISOString(d).slice(0, 10);
};

/**
 * Lấy ngày đầu tiên của weekday (LOCAL +07)
 */
export const getFirstDateOfWeekday = (baseDate: string, weekday: string) => {
  const base = new Date(`${baseDate}T00:00:00`);
  const target = WEEKDAY_INDEX[weekday];

  if (target === undefined) return `${baseDate}T00:00:00+07:00`;

  const current = base.getDay();
  const diff = (target - current + 7) % 7;

  base.setDate(base.getDate() + diff);

  return toLocalISOString(base); // ✅ có +07:00
};

/**
 * Tính duration schedule
 */
export const calculateScheduleDuration = (
  exercises: ManualExerciseItem[],
) => {
  const totalSeconds = exercises.reduce((sum, ex) => {
    const sets = parseInt(ex.sets, 10) || 1;
    const duration = parseInt(ex.durationSeconds, 10) || 60;
    const rest = parseInt(ex.restSeconds, 10) || 30;

    return sum + sets * duration + Math.max(sets - 1, 0) * rest;
  }, 0);

  return Math.max(1, Math.ceil(totalSeconds / 60));
};

/**
 * Build stages
 */
export const buildManualStagesByWeeks = (
  totalWeeks: number,
  selectedTrainingDays: string[],
): ManualStageItem[] => {
  const safeWeeks = Math.max(1, totalWeeks || 4);
  const stageCount = Math.ceil(safeWeeks / 4);

  return Array.from({ length: stageCount }).map((_, stageIndex) => {
    const remainingWeeks = safeWeeks - stageIndex * 4;
    const durationWeeks = Math.min(4, remainingWeeks);

    return {
      id: `stage-${stageIndex + 1}`,
      stageName: `Giai đoạn ${stageIndex + 1}`,
      description: `Giai đoạn ${stageIndex + 1} trong ${durationWeeks} tuần.`,
      stageOrder: stageIndex + 1,
      durationWeeks: String(durationWeeks),
      schedules: selectedTrainingDays.map(day => ({
        id: `stage-${stageIndex + 1}-${day}`,
        scheduleName: `Buổi tập ${WEEKDAY_LABELS_VN[day]}`,
        description: `Lịch tập vào ${WEEKDAY_LABELS_VN[day]}.`,
        dayOfWeek: day,
        exercises: [],
      })),
    };
  });
};