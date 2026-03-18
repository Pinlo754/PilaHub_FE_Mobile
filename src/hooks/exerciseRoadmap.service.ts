import api from './axiosInstance';
import { ApiResponse } from '../utils/ApiResType';

export const exerciseRoadmapService = {
  completePersonalExercise: async (personalExerciseId: string) => {
    const res = await api.patch<ApiResponse<any>>(`/personal-exercises/${personalExerciseId}/complete`);
    if (!res.data.success) throw { type: 'BUSINESS_ERROR', message: res.data.message };
    return res.data.data;
  },

  getExercisesBySchedule: async (personalScheduleId: string) => {
    const res = await api.get<ApiResponse<any[]>>(`/personal-exercises/schedule/${personalScheduleId}`);
    if (!res.data.success) throw { type: 'BUSINESS_ERROR', message: res.data.message };
    return res.data.data;
  },

  completePersonalSchedule: async (personalScheduleId: string) => {
    const res = await api.patch<ApiResponse<any>>(`/personal-schedules/${personalScheduleId}/complete`);
    if (!res.data.success) throw { type: 'BUSINESS_ERROR', message: res.data.message };
    return res.data.data;
  },
};
