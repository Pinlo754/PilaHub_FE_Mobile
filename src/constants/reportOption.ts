export type reportType = 'video' | 'coach' | 'liveSession';

export type ReportReason =
  | 'COACH_NO_SHOW'
  | 'COACH_LATE'
  | 'POOR_TEACHING_QUALITY'
  | 'INAPPROPRIATE_BEHAVIOR'
  | 'SESSION_TECHNICAL_ISSUE'
  | 'OTHER'
  | '';

export type optionType = {
  id: number;
  label: string;
  value: ReportReason;
};

export const VIDEO_OPTIONS: optionType[] = [
  {
    id: 1,
    label: 'Hướng dẫn sai kỹ thuật',
    value: '',
  },
  {
    id: 2,
    label: 'Nội dung gây nguy hiểm cho người tập',
    value: '',
  },
  {
    id: 3,
    label: 'Thông tin sai lệch hoặc gây hiểu nhầm',
    value: '',
  },
  {
    id: 4,
    label: 'Nội dung không phù hợp / phản cảm',
    value: '',
  },
  {
    id: 5,
    label: 'Quảng cáo hoặc spam',
    value: '',
  },
  {
    id: 6,
    label: 'Vi phạm bản quyền',
    value: '',
  },
  {
    id: 7,
    label: 'Âm thanh / hình ảnh kém chất lượng',
    value: '',
  },
  {
    id: 8,
    label: 'Nội dung không đúng chủ đề Pilates',
    value: '',
  },
  {
    id: 9,
    label: 'Lý do khác',
    value: '',
  },
];

export const COACH_OPTIONS: optionType[] = [
  {
    id: 1,
    label: 'HLV thường xuyên đến trễ hoặc vắng mặt mà không thông báo trước',
    value: '',
  },
  {
    id: 2,
    label: 'Không giảng dạy đúng nội dung đã cam kết trong khóa học',
    value: '',
  },
  {
    id: 3,
    label: 'Hướng dẫn sai kỹ thuật',
    value: '',
  },
  {
    id: 4,
    label: 'Thiếu quan sát và chỉnh sửa động tác cho học viên',
    value: '',
  },

  {
    id: 5,
    label:
      'Thái độ thiếu tôn trọng, cáu gắt hoặc nói chuyện không phù hợp với học viên',
    value: '',
  },
  {
    id: 6,
    label:
      'Dạy quá nhanh hoặc quá chậm, không phù hợp với trình độ của học viên',
    value: '',
  },
  {
    id: 7,
    label: 'Không tuân thủ thời lượng buổi học',
    value: '',
  },
  {
    id: 8,
    label: 'Vi phạm quyền riêng tư',
    value: '',
  },
  {
    id: 9,
    label: 'Lý do khác',
    value: '',
  },
];

export const LIVESESSION_OPTIONS: optionType[] = [
  {
    id: 1,
    label: 'Huấn luyện viên không tham gia buổi tập',
    value: 'COACH_NO_SHOW',
  },
  {
    id: 2,
    label: 'Huấn luyện viên tham gia muộn',
    value: 'COACH_LATE',
  },
  {
    id: 3,
    label: 'Chất lượng hướng dẫn chưa đáp ứng mong đợi',
    value: 'POOR_TEACHING_QUALITY',
  },
  {
    id: 4,
    label: 'Hành vi của huấn luyện viên không phù hợp',
    value: 'INAPPROPRIATE_BEHAVIOR',
  },
  {
    id: 5,
    label: 'Buổi tập gặp vấn đề kỹ thuật',
    value: 'SESSION_TECHNICAL_ISSUE',
  },
  {
    id: 6,
    label: 'Lý do khác',
    value: 'OTHER',
  },
];
