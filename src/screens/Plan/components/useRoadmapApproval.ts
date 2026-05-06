import { useState, useCallback } from 'react';
import { RoadmapApi } from '../../../hooks/roadmap.api';

export const useRoadmapApproval = ({
  currentRoadmap,
  currentStages,
  coachRequests,
  onSuccess,
  onError
}: {
  currentRoadmap: any;
  currentStages: any[];
  coachRequests: any[];
  onSuccess: () => void;
  onError: (errorMsg: string) => void;
}) => {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // 1. Lấy ID của lộ trình
  const getRoadmapId = useCallback((rm: any) => {
    return rm?.roadmapId ?? rm?.id ?? rm?._id ?? null;
  }, []);

  // 2. Định dạng ngày hiển thị (vi-VN)
  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('vi-VN');

  // 3. Gom tất cả lịch tập từ các giai đoạn để tính toán thông tin
  const allSchedules = currentStages.flatMap(
    (st: any) => st.schedules?.map((s: any) => s.schedule ?? s) ?? [],
  );

  const totalSessions = allSchedules.length;
  const firstSchedule = allSchedules[0];
  const lastSchedule = allSchedules[allSchedules.length - 1];
  const totalAmount = currentRoadmap?.totalAmount ?? 0;

  // Lọc ra các thứ tập trong tuần (Unique days)
  const uniqueDaysOfWeek = [...new Set(allSchedules.map((s: any) => s.dayOfWeek))];

  // 4. Hàm xử lý Xác nhận thanh toán & Kích hoạt lộ trình
  const handleConfirmApproval = async () => {
    try {
      setSaving(true);
      const roadmapId = getRoadmapId(currentRoadmap);

      // Tìm thông tin yêu cầu của coach tương ứng để lấy khung giờ làm việc (startTime)
      const coachRequest = coachRequests.find(
        (req: any) => req.coachId === currentRoadmap?.coachId,
      );
      const trainingDaySchedules = coachRequest?.trainingDaySchedules ?? [];

      // Khởi tạo danh sách các slot đặt lịch (booking slots) cho từng buổi học
      const bookingSlots = currentStages.flatMap((st: any) =>
        st.schedules?.map((scheduleWrapper: any) => {
          const schedule = scheduleWrapper.schedule ?? scheduleWrapper;
          const scheduledDate = new Date(schedule.scheduledDate);

          const year = scheduledDate.getUTCFullYear();
          const month = String(scheduledDate.getUTCMonth() + 1).padStart(2, '0');
          const day = String(scheduledDate.getUTCDate()).padStart(2, '0');

          const dayOfWeekMap: any = {
            'THỨ HAI': 'MONDAY',
            'THỨ BA': 'TUESDAY',
            'THỨ TƯ': 'WEDNESDAY',
            'THỨ NĂM': 'THURSDAY',
            'THỨ SÁU': 'FRIDAY',
            'THỨ BẢY': 'SATURDAY',
            'CHỦ NHẬT': 'SUNDAY',
          };

          const dayOfWeekEng = dayOfWeekMap[schedule.dayOfWeek] || 'MONDAY';
          const trainingSchedule = trainingDaySchedules.find(
            (tds: any) => tds.dayOfWeek === dayOfWeekEng,
          );

          // Lấy giờ bắt đầu của huấn luyện viên, mặc định là 08:00 nếu không tìm thấy
          const startTimeStr = trainingSchedule?.startTime ?? '08:00';
          const [hours, minutes] = startTimeStr.split(':');

          const startDateTime =
            `${year}-${month}-${day}T${String(hours).padStart(2, '0')}:` +
            `${String(minutes).padStart(2, '0')}:00Z`;

          const startDateTimeObj = new Date(startDateTime);
          
          // Trừ đi 7 tiếng lệch múi giờ để đồng bộ với UTC lưu database
          const start = new Date(startDateTimeObj.getTime() - 7 * 60 * 60 * 1000);
          const durationMs = 60 * 60 * 1000; // Mặc định thời lượng 1 tiếng (60 phút)
          const end = new Date(start.getTime() + durationMs);

          return {
            startTime: start.toISOString(),
            endTime: end.toISOString(),
          };
        }) ?? [],
      );

      // Build payload tạo lịch đồng loạt
      const payloadBatch = {
        coachId: currentRoadmap?.coachId,
        bookingSlots,
        bookingType: 'PERSONAL_TRAINING_PACKAGE',
        recurringGroupId: roadmapId,
      };

      // Gọi API tạo lịch và API phê duyệt lộ trình
      await RoadmapApi.createBatch(payloadBatch);
      await RoadmapApi.approveRoadmap(roadmapId);

      setShowConfirmModal(false);
      onSuccess();
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message ?? 'Không thể phê duyệt lộ trình này';
      onError(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  return {
    showConfirmModal,
    setShowConfirmModal,
    saving,
    totalSessions,
    totalAmount,
    firstScheduleDate: firstSchedule?.scheduledDate ? formatDate(firstSchedule.scheduledDate) : null,
    lastScheduleDate: lastSchedule?.scheduledDate ? formatDate(lastSchedule.scheduledDate) : null,
    daysOfWeekDisplay: uniqueDaysOfWeek.join(', '),
    handleConfirmApproval,
  };
};