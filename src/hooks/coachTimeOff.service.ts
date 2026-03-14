import { ApiResponse } from '../utils/ApiResType';
import { CoachTimeOffType } from '../utils/CoachTimeOffType';
import api from './axiosInstance';

export const coachTimeOffService = {
  // GET BY ID
  getById: async (coachId: string): Promise<CoachTimeOffType[]> => {
    const res = await api.get<ApiResponse<CoachTimeOffType[]>>(
      `/coach-time-offs/coach/${coachId}`,
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

  // GET BY TIME RANGE
  getByTimeRange: async (
    coachId: string,
    startTime: string,
    endTime: string,
  ): Promise<CoachTimeOffType[]> => {
    const res = await api.get<ApiResponse<CoachTimeOffType[]>>(
      `/coach-time-offs/coach/${coachId}/time-range`,
      {
        params: {
          startTime,
          endTime,
        },
      },
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
