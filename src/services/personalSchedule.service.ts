import api from '../hooks/axiosInstance';

export const markPersonalScheduleCompleted = async (id: string) => {
  const res = await api.patch(`/personal-schedules/${id}/complete`);
  return res.data?.data;
};
