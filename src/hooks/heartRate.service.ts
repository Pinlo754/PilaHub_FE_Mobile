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
};
