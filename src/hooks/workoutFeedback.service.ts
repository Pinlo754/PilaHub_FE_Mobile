import { ApiResponse } from '../utils/ApiResType';
import { WorkoutFeedbackType } from '../utils/WorkoutFeedbackType';
import api from './axiosInstance';

export const workoutFeedbackService = {
  // GET BY WORKOUT SESSION ID
  getByWorkoutSessionId: async (
    workoutSessionId: string,
  ): Promise<WorkoutFeedbackType> => {
    const res = await api.get<ApiResponse<WorkoutFeedbackType>>(
      `/workout-feedback/session/${workoutSessionId}`,
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
