import api from '../hooks/axiosInstance';

export const markPersonalExerciseCompleted = async (id: string) => {
  const res = await api.patch(`/personal-exercises/${id}/complete`);
  return res.data?.data;
};
