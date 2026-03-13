import { ApiResponse } from '../utils/ApiResType';
import api from './axiosInstance';
import AsyncStorage from '@react-native-async-storage/async-storage';
export const CoachService = {
  
  getAll : async () => {
    const res = await api.get<ApiResponse<[]>>(`/coaches`);
    if (!res.data.success) {
      throw {
        type: 'BUSINESS_ERROR',
        message: res.data.message,
        errorCode: res.data.errorCode,
      };
    }
    return res.data.data;
  },

  getSchedules: async () => {
    const res = await api.get<ApiResponse<[]>>(`/live-sessions/my-sessions`);
    
    if (!res.data.success) {
      throw {
        type: 'BUSINESS_ERROR',
        message: res.data.message,
        errorCode: res.data.errorCode,
      };
    }

    return res.data.data;
  },

  getRequestRoadmap: async () => {
    const res = await api.get<ApiResponse<[]>>(`/coach-roadmap-requests/my-received`);

    if (!res.data.success) {
      throw {
        type: 'BUSINESS_ERROR',
        message: res.data.message,
        errorCode: res.data.errorCode,
      };
    }
    return res.data.data;
  },

  timeOff: async (payload : any) => {
    const res = await api.post<ApiResponse<[]>>(`/coach-time-offs`,
      payload
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

    getTimeOff: async () => {
    const res = await api.get<ApiResponse<[]>>(`/coach-time-offs/my-time-offs`);

    if (!res.data.success) {
      throw {
        type: 'BUSINESS_ERROR',
        message: res.data.message,
        errorCode: res.data.errorCode,
      };
    }
    return res.data.data;
  },

  acceptRequestRoadmap :async (id : string) => {
    const res = await api.patch<ApiResponse<[]>>(`/coach-roadmap-requests/${id}/accept`);

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
