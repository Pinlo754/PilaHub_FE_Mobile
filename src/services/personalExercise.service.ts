import api from '../hooks/axiosInstance';

export const markPersonalExerciseCompleted = async (id: string) => {
  const res = await api.patch(`/personal-exercises/${id}/complete`);
  return res.data?.data;
};

export const getPersonalExercisesBySchedule = async (scheduleId: string) => {
  const res = await api.get(`/personal-exercises/schedule/${scheduleId}`);
  // normalize response shape - prefer data.data but fall back to data or empty array
  const payload = res?.data?.data ?? res?.data ?? res;
  return Array.isArray(payload) ? payload : (Array.isArray(payload?.data) ? payload.data : []);
};
