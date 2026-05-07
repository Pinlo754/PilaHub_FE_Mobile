import api from '../hooks/axiosInstance';

export const markPersonalScheduleCompleted = async (id: string) => {
  try {
    console.log('[markPersonalScheduleCompleted] 🔄 Calling API to mark schedule', id, 'as completed');
    const res = await api.patch(`/personal-schedules/${id}/complete`);
    console.log('[markPersonalScheduleCompleted] ✅ API Response:', res.data);
    return res.data?.data;
  } catch (err: any) {
    console.error('[markPersonalScheduleCompleted] ❌ API Error:', err.response?.data ?? err.message);
    throw err;
  }
};
