export type reportType = 'video' | 'coach';

export type optionType = {
  id: number;
  label: string;
};

export const VIDEO_OPTIONS: optionType[] = [
  {
    id: 1,
    label: 'Hướng dẫn sai kỹ thuật',
  },
  {
    id: 2,
    label: 'Nội dung gây nguy hiểm cho người tập',
  },
  {
    id: 3,
    label: 'Thông tin sai lệch hoặc gây hiểu nhầm',
  },
  {
    id: 4,
    label: 'Nội dung không phù hợp / phản cảm',
  },
  {
    id: 5,
    label: 'Quảng cáo hoặc spam',
  },
  {
    id: 6,
    label: 'Vi phạm bản quyền',
  },
  {
    id: 7,
    label: 'Âm thanh / hình ảnh kém chất lượng',
  },
  {
    id: 8,
    label: 'Nội dung không đúng chủ đề Pilates',
  },
  {
    id: 9,
    label: 'Lý do khác',
  },
];

export const COACH_OPTIONS: optionType[] = [
  {
    id: 1,
    label: 'HLV thường xuyên đến trễ hoặc vắng mặt mà không thông báo trước',
  },
  {
    id: 2,
    label: 'Không giảng dạy đúng nội dung đã cam kết trong khóa học',
  },
  {
    id: 3,
    label: 'Hướng dẫn sai kỹ thuật',
  },
  {
    id: 4,
    label: 'Thiếu quan sát và chỉnh sửa động tác cho học viên',
  },
  {
    id: 5,
    label:
      'Thái độ thiếu tôn trọng, cáu gắt hoặc nói chuyện không phù hợp với học viên',
  },
  {
    id: 6,
    label:
      'Dạy quá nhanh hoặc quá chậm, không phù hợp với trình độ của học viên',
  },
  {
    id: 7,
    label: 'Không tuân thủ thời lượng buổi học',
  },
  {
    id: 8,
    label: 'Vi phạm quyền riêng tư',
  },
  {
    id: 9,
    label: 'Lý do khác',
  },
];
