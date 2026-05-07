import { colors } from '../theme/colors';
import { BookingStatus } from './CoachBookingType';
import { TrainingDay } from './CourseLessonProgressType';
import { LevelType } from './CourseType';
import { BodyPartNameType, BreathingRuleType, ExerciseTypeEnum } from './ExerciseType';

// TYPE
type MapType = {
  bgColor: string;
  textColor: string;
  label: string;
};

// RULES
const PROGRESS_RULES = [
  { min: 70, color: colors.success.DEFAULT },
  { min: 40, color: colors.warning.DEFAULT },
  { min: 0, color: colors.danger.DEFAULT },
];

const POINT_RULES = [
  { min: 90, title: 'Xuất sắc!', desc: 'Bạn đã hoàn thành rất tuyệt vời.' },
  { min: 75, title: 'Rất tốt!', desc: 'Hiệu suất tập luyện rất cao.' },
  { min: 60, title: 'Tốt!', desc: 'Bạn đã hoàn thành tốt buổi tập.' },
  { min: 40, title: 'Khá ổn!', desc: 'Hãy cố gắng thêm một chút nhé.' },
  { min: 0, title: 'Cố gắng hơn!', desc: 'Đừng bỏ cuộc, lần sau sẽ tốt hơn.' },
];

export const LEVEL_MAP: Record<
  LevelType,
  { value: number; label: string; target: string }
> = {
  BEGINNER: {
    value: 1,
    label: 'Dễ',
    target: 'Người mới bắt đầu làm quen với các động tác Pilates.',
  },
  INTERMEDIATE: {
    value: 2,
    label: 'Trung bình',
    target: 'Người đã có nền tảng và kinh nghiệm nhất định.',
  },
  ADVANCED: {
    value: 3,
    label: 'Khó',
    target: 'Người có kỹ năng và khả năng kiểm soát cơ thể tốt hơn.',
  },
};

export const BOOKING_STATUS_MAP: Record<
  BookingStatus,
  { bgColor: string; textColor: string; label: string }
> = {
  SCHEDULED: {
    bgColor: colors.info.lighter,
    textColor: colors.info.darker,
    label: 'Sắp tới',
  },

  READY: {
    bgColor: colors.success[20],
    textColor: colors.success.darker,
    label: 'Sẵn sàng',
  },

  IN_PROGRESS: {
    bgColor: colors.purple[20],
    textColor: colors.purple.DEFAULT,
    label: 'Đang diễn ra',
  },

  COMPLETED: {
    bgColor: colors.success[20],
    textColor: colors.success.DEFAULT,
    label: 'Đã hoàn thành',
  },

  CANCELLED_BY_COACH: {
    bgColor: colors.danger[20],
    textColor: colors.danger.darker,
    label: 'HLV đã huỷ',
  },

  CANCELLED_BY_TRAINEE: {
    bgColor: colors.danger[20],
    textColor: colors.danger.darker,
    label: 'Bạn đã huỷ',
  },

  NO_SHOW_BY_COACH: {
    bgColor: colors.warning[20],
    textColor: colors.foreground,
    label: 'HLV vắng mặt',
  },

  NO_SHOW_BY_TRAINEE: {
    bgColor: colors.warning[20],
    textColor: colors.foreground,
    label: 'Bạn vắng mặt',
  },

  REFUNDED: {
    bgColor: colors.orange[20],
    textColor: colors.orange.DEFAULT,
    label: 'Đã hoàn tiền',
  },
};

export const TRAINING_DAYS: Record<TrainingDay, string> = {
  0: 'T2',
  1: 'T3',
  2: 'T4',
  3: 'T5',
  4: 'T6',
  5: 'T7',
  6: 'CN',
};

export const EXERCISE_TYPE_MAP: Record<ExerciseTypeEnum, MapType> = {
  CORE_STRENGTHENING: {
    label: 'Tăng cường core',
    bgColor: 'bg-red-100',
    textColor: 'text-red-700',
  },
  PELVIC_FLOOR_ENGAGEMENT: {
    label: 'Sàn chậu',
    bgColor: 'bg-pink-100',
    textColor: 'text-pink-700',
  },
  SPINAL_ARTICULATION: {
    label: 'Cột sống linh hoạt',
    bgColor: 'bg-indigo-100',
    textColor: 'text-indigo-700',
  },
  SPINAL_FLEXION: {
    label: 'Gập cột sống',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-700',
  },
  SPINAL_EXTENSION: {
    label: 'Duỗi cột sống',
    bgColor: 'bg-cyan-100',
    textColor: 'text-cyan-700',
  },
  SPINAL_ROTATION_TWIST: {
    label: 'Xoay cột sống',
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-700',
  },
  LATERAL_FLEXION: {
    label: 'Nghiêng người',
    bgColor: 'bg-teal-100',
    textColor: 'text-teal-700',
  },
  HIP_WORK: {
    label: 'Hông',
    bgColor: 'bg-orange-100',
    textColor: 'text-orange-700',
  },
  LEG_STRENGTHENING: {
    label: 'Chân',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-700',
  },
  SHOULDER_STABILIZATION: {
    label: 'Ổn định vai',
    bgColor: 'bg-emerald-100',
    textColor: 'text-emerald-700',
  },
  ARM_STRENGTHENING: {
    label: 'Tay',
    bgColor: 'bg-lime-100',
    textColor: 'text-lime-700',
  },
  BALANCE_STABILITY: {
    label: 'Thăng bằng',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-700',
  },
  FLEXIBILITY_STRETCHING: {
    label: 'Giãn cơ',
    bgColor: 'bg-rose-100',
    textColor: 'text-rose-700',
  },
  BREATHING_RELAXATION: {
    label: 'Thở & thư giãn',
    bgColor: 'bg-sky-100',
    textColor: 'text-sky-700',
  },
  FULL_BODY_INTEGRATION: {
    label: 'Toàn thân',
    bgColor: 'bg-green-100',
    textColor: 'text-green-700',
  },
};

export const BREATHING_RULE_MAP: Record<BreathingRuleType, MapType> = {
  INHALE_ON_EFFORT: {
    label: 'Hít khi gắng sức',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-700',
  },
  EXHALE_ON_EFFORT: {
    label: 'Thở ra khi gắng sức',
    bgColor: 'bg-green-100',
    textColor: 'text-green-700',
  },
  NASAL_BREATHING: {
    label: 'Thở bằng mũi',
    bgColor: 'bg-cyan-100',
    textColor: 'text-cyan-700',
  },
  MOUTH_BREATHING: {
    label: 'Thở bằng miệng',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-700',
  },
  BOX_BREATHING: {
    label: 'Box breathing',
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-700',
  },
  DIAPHRAGMATIC: {
    label: 'Thở bụng',
    bgColor: 'bg-emerald-100',
    textColor: 'text-emerald-700',
  },
  RHYTHMIC: {
    label: 'Thở theo nhịp',
    bgColor: 'bg-indigo-100',
    textColor: 'text-indigo-700',
  },
  HOLD_BREATH: {
    label: 'Nín thở',
    bgColor: 'bg-red-100',
    textColor: 'text-red-700',
  },
  FREE_BREATHING: {
    label: 'Thở tự do',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-700',
  },
};

export const BODY_PART_MAP: Record<
  BodyPartNameType,
  { label: string }
> = {
  Head: {
    label: "Đầu",
  },
  Neck: {
    label: "Cổ",
  },
  "Cervical Spine": {
    label: "Cột sống cổ",
  },
  "Thoracic Spine": {
    label: "Cột sống ngực",
  },
  "Lumbar Spine": {
    label: "Cột sống thắt lưng",
  },
  Core: {
    label: "Cơ trung tâm",
  },
  Shoulders: {
    label: "Vai",
  },
  "Upper Back": {
    label: "Lưng trên",
  },
  "Lower Back": {
    label: "Lưng dưới",
  },
  Chest: {
    label: "Ngực",
  },
  "Upper Arms": {
    label: "Cánh tay trên",
  },
  Elbows: {
    label: "Khuỷu tay",
  },
  Forearms: {
    label: "Cẳng tay",
  },
  Wrists: {
    label: "Cổ tay",
  },
  Hands: {
    label: "Bàn tay",
  },
  Hips: {
    label: "Hông",
  },
  Glutes: {
    label: "Mông",
  },
  Thighs: {
    label: "Đùi",
  },
  Knees: {
    label: "Đầu gối",
  },
  Calves: {
    label: "Bắp chân",
  },
  Ankles: {
    label: "Cổ chân",
  },
  Feet: {
    label: "Bàn chân",
  },
};

// FUNCTIONS
export const getProgressColor = (progress: number) =>
  PROGRESS_RULES.find(r => progress >= r.min)?.color ?? colors.danger.DEFAULT;

export const getPointContent = (point: number) =>
  POINT_RULES.find(r => point >= r.min) ?? POINT_RULES.at(-1)!;

export const getLevelConfig = (level: LevelType) => LEVEL_MAP[level];

export const getLevelNumber = (level: LevelType) => LEVEL_MAP[level].value;

export const getLevelLabel = (level: LevelType) => LEVEL_MAP[level].label;

export const getLevelTarget = (level: LevelType) => LEVEL_MAP[level].target;

export const getBookingStatusConfig = (status: BookingStatus) =>
  BOOKING_STATUS_MAP[status];

export const getExerciseTypeConfig = (type: ExerciseTypeEnum) =>
  EXERCISE_TYPE_MAP[type];

export const getExerciseTypeLabel = (type: ExerciseTypeEnum) =>
  EXERCISE_TYPE_MAP[type].label;

export const getBreathingRuleConfig = (rule: BreathingRuleType) =>
  BREATHING_RULE_MAP[rule];

export const getBreathingRuleLabel = (rule: BreathingRuleType) =>
  BREATHING_RULE_MAP[rule].label;

export const getBodyPartLabel = (
  name: string | null | undefined,
): string => {
  if (!name) return "Không xác định";

  return BODY_PART_MAP[name as BodyPartNameType]?.label || name;
};
