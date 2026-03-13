import { ApiResponse } from '../utils/ApiResType';
import { CoachType } from '../utils/CoachType';
import api from './axiosInstance';

export const coachService = {
  // GET ALL
  getAll: async (): Promise<CoachType[]> => {
    const res = await api.get<ApiResponse<CoachType[]>>(`/coaches/active`);

    if (!res.data.success) {
      throw {
        type: 'BUSINESS_ERROR',
        message: res.data.message,
        errorCode: res.data.errorCode,
      };
    }

    return res.data.data;
  },

  // GET BY ID
  getById: async (coachId: string): Promise<CoachType> => {
    const res = await api.get<ApiResponse<CoachType>>(`/coaches/${coachId}`);

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
