import { colors } from '../theme/colors';

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

// FUNCTIONS
export const getProgressColor = (progress: number) =>
  PROGRESS_RULES.find(r => progress >= r.min)?.color ?? colors.danger.DEFAULT;

export const getPointContent = (point: number) =>
  POINT_RULES.find(r => point >= r.min) ?? POINT_RULES.at(-1)!;
