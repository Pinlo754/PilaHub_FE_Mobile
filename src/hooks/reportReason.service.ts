import { ApiResponse } from '../utils/ApiResType';
import api from './axiosInstance';
import { ReportReasonType } from '../utils/ReportReasonType';

export const ReportReasonService = {
  // GET ALL
  getAll: async (): Promise<ReportReasonType[]> => {
    const res = await api.get<ApiResponse<ReportReasonType[]>>(
      `/report-reasons/active`,
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
