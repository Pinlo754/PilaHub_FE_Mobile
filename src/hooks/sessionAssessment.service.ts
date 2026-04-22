import { ApiResponse } from '../utils/ApiResType';
import {
  CreateSessionAsssessmentReq,
  SessionAssessmentType,
} from '../utils/SessionAssessmentType';
import api from './axiosInstance';

export const SessionAssessmentService = {
  // GET BY ID
  getById: async (liveSessionId: string): Promise<SessionAssessmentType> => {
    const res = await api.get<ApiResponse<SessionAssessmentType>>(
      `/live-sessions/${liveSessionId}/assessment`,
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

  // CREATE SESSION ASSESSMENT
  createSessionAssessment: async (
    liveSessionId: string,
    payload: CreateSessionAsssessmentReq,
  ): Promise<SessionAssessmentType> => {
    const res = await api.post<ApiResponse<SessionAssessmentType>>(
      `/live-sessions/${liveSessionId}/assessment`,
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
};
