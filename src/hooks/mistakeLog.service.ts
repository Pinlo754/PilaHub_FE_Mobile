import { ApiResponse } from '../utils/ApiResType';
import { CreateMistakeReq, MistakeLogType } from '../utils/MistakeLogType';
import api from './axiosInstance';

export const mistakeLogService = {
  // CREATE MISTAKE LOG
  createMistakeLog: async (
    payload: CreateMistakeReq,
  ): Promise<MistakeLogType[]> => {
    const res = await api.post<ApiResponse<MistakeLogType[]>>(
      `/mistake-logs/batch`,
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
