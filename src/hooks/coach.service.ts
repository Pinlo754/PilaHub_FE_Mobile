import { ApiResponse } from '../utils/ApiResType';
import api from './axiosInstance';
import { CoachType } from '../utils/CoachType';
import { get } from 'react-native/Libraries/NativeComponent/NativeComponentRegistry';

export const CoachService = {
  getAll: async () => {
    const res = await api.get<ApiResponse<[]>>(`/coaches/active`);

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
    const res = await api.get<ApiResponse<[]>>(
      `/coach-roadmap-requests/my-received`,
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

  timeOff: async (payload: any) => {
    const res = await api.post<ApiResponse<[]>>(`/coach-time-offs`, payload);

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

  acceptRequestRoadmap: async (id: string) => {
    const res = await api.patch<ApiResponse<[]>>(
      `/coach-roadmap-requests/${id}/accept`,
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

  // GET BY ID
  getById: async (coachId: string) => {
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

  getTimeOffById: async (id: string) => {
    const res = await api.get<ApiResponse<[]>>(`/coach-time-offs/coach/${id}`);

    if (!res.data.success) {
      throw {
        type: 'BUSINESS_ERROR',
        message: res.data.message,
        errorCode: res.data.errorCode,
      };
    }

    return res.data.data;
  },

  // GET BY NAME
  getByName: async (q: string): Promise<CoachType[]> => {
    const res = await api.get<ApiResponse<CoachType[]>>(`/coaches/search`, {
      params: {
        q,
      },
    });

    if (!res.data.success) {
      throw {
        type: 'BUSINESS_ERROR',
        message: res.data.message,
        errorCode: res.data.errorCode,
      };
    }

    return res.data.data;
  },

  updateProfile: async (id: string, payload: any) => {
    const res = await api.put<ApiResponse<[]>>(`/coaches/${id}`, payload);

    if (!res.data.success) {
      throw {
        type: 'BUSINESS_ERROR',
        message: res.data.message,
        errorCode: res.data.errorCode,
      };
    }

    return res.data.data;
  },

  getMyRoadmap: async () => {
    const res = await api.get<ApiResponse<[]>>(`/roadmaps/my`);

    if (!res.data.success) {
      throw {
        type: 'BUSINESS_ERROR',
        message: res.data.message,
        errorCode: res.data.errorCode,
      };
    }

    return res.data.data;
  },

  getBusyTime: async (coachId: string, payload: any) => {
    const res = await api.get<ApiResponse<[]>>(
      `/coach-time-offs/coach/${coachId}/busy-schedule`
    );

    if (!res.data.success) {
      throw {
        type: 'BUSINESS_ERROR',
        message: res.data.message,
        errorCode: res.data.errorCode,
      };
    }

    return res.data.data;
  }
};
