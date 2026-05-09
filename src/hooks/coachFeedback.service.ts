import { ApiResponse } from '../utils/ApiResType';
import {
  CoachFeedbackType,
  CreateCoachFeedbackReq,
} from '../utils/CoachFeedbackType';
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

  // CREATE COACH FEEDBACK
  createCoachFeedback: async (
    payload: CreateCoachFeedbackReq,
  ): Promise<CoachFeedbackType[]> => {
    const res = await api.post<ApiResponse<CoachFeedbackType[]>>(
      `/coach-feedbacks`,
      payload,
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

   // GET BY LIVESESSION ID
  getByLiveSessionId: async (liveSessionId: string): Promise<CoachFeedbackType> => {
    const res = await api.get<ApiResponse<CoachFeedbackType>>(
      `/coach-feedbacks/live-session/${liveSessionId}`,
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
