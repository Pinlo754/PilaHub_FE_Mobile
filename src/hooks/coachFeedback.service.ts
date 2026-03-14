import { ApiResponse } from '../utils/ApiResType';
import { CoachFeedbackType } from '../utils/CoachFeedbackType';
import api from './axiosInstance';

export const coachFeedbackService = {
  // GET BY ID
  getById: async (coachId: string): Promise<CoachFeedbackType[]> => {
    const res = await api.get<ApiResponse<CoachFeedbackType[]>>(
      `/coach-feedbacks/coach/${coachId}`,
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
