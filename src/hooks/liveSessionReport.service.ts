import { ApiResponse } from '../utils/ApiResType';
import api from './axiosInstance';
import { ReportReason } from '../constants/reportOption';
import { LiveSessionReportType } from '../utils/LiveSessionReportType';

export const liveSessionReportService = {
  // CREATE REPORT
  createReport: async (
    liveSessionId: string,
    reason: ReportReason,
    description?: string,
  ): Promise<LiveSessionReportType> => {
    const res = await api.post<ApiResponse<LiveSessionReportType>>(
      `/live-session-reports/${liveSessionId}`,
      {
        reason,
        description,
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
