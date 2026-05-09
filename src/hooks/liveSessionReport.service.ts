import { ApiResponse } from '../utils/ApiResType';
import api from './axiosInstance';
import { LiveSessionReportType } from '../utils/LiveSessionReportType';

export const liveSessionReportService = {
  // CREATE REPORT
  createReport: async (
    liveSessionId: string,
    reason: string,
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

  // GET ALL CREATED
  getAllCreated: async (): Promise<LiveSessionReportType[]> => {
    const res = await api.get<ApiResponse<LiveSessionReportType[]>>(
      `/live-session-reports/my-reports/created`,
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

  // GET ALL RECEIVED
  getAllReceived: async (): Promise<LiveSessionReportType[]> => {
    const res = await api.get<ApiResponse<LiveSessionReportType[]>>(
      `/live-session-reports/my-reports/received`,
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
