import { ApiResponse } from '../utils/ApiResType';
import { HeartRateLogType } from '../utils/HeartRateLogType';
import api from './axiosInstance';

export type HeartRateSample = { heartRate: number; recordedAt: number };

export const heartRateService = {
  async sendBatch(workoutSessionId: string, heartRateLogs: HeartRateSample[]) {
    try {
      const payload = { workoutSessionId, heartRateLogs };
      const res = await api.post('/heart-rate-logs/batch', payload);
      return res.data;
    } catch (err) {
      // normalize error and rethrow for callers to handle
      console.warn('heartRateService.sendBatch failed', err);
      throw err;
    }
  },

  // GET BY WORKOUT SESSION ID
  getByWorkoutSessionId: async (
    workoutSessionId: string,
  ): Promise<HeartRateLogType[]> => {
    const res = await api.get<ApiResponse<HeartRateLogType[]>>(
      `/heart-rate-logs/workout-session/${workoutSessionId}`,
    );

    if (!res.data.success) {
      throw {
        type: 'BUSINESS_ERROR',
        message: res.data.message,
        errorCode: res.data.errorCode,
      };
    }

    return res.data.data;
  },
};
