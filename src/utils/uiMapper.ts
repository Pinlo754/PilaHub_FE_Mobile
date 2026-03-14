import { colors } from '../theme/colors';
import { BookingStatus } from './CoachBookingType';
import { LevelType } from './CourseType';

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

// FUNCTIONS
export const getProgressColor = (progress: number) =>
  PROGRESS_RULES.find(r => progress >= r.min)?.color ?? colors.danger.DEFAULT;

export const getPointContent = (point: number) =>
  POINT_RULES.find(r => point >= r.min) ?? POINT_RULES.at(-1)!;


export const getLevelConfig = (level: LevelType) => LEVEL_MAP[level];

export const getLevelNumber = (level: LevelType) =>
  LEVEL_MAP[level]?.value;

export const getLevelLabel = (level: LevelType) =>
  LEVEL_MAP[level].label;

export const getLevelTarget = (level: LevelType) => LEVEL_MAP[level].target;

export const getBookingStatusConfig = (status: BookingStatus) =>
  BOOKING_STATUS_MAP[status];
