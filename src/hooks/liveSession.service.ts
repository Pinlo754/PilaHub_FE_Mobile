import { AgoraTokenRes, LiveSessionType } from '../utils/LiveSessionType';
import { ApiResponse } from '../utils/ApiResType';
import api from './axiosInstance';

const LiveSessionService = {
  // GET BY ID
  getById: async (liveSessionId: string): Promise<LiveSessionType> => {
    const res = await api.get<ApiResponse<LiveSessionType>>(
      `/live-sessions/${liveSessionId}`,
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

  // GET BY BOOKING_ID
  getByBookingId: async (bookingId: string): Promise<LiveSessionType> => {
    const res = await api.get<ApiResponse<LiveSessionType>>(
      `/live-sessions/booking/${bookingId}`,
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

  // GET AGORA TOKEN
  getAgoraToken: async (liveSessionId: string): Promise<AgoraTokenRes> => {
    const res = await api.get<ApiResponse<AgoraTokenRes>>(
      `/live-sessions/${liveSessionId}/token`,
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

  // MARK JOINED
  markJoined: async (liveSessionId: string): Promise<LiveSessionType> => {
    const res = await api.post<ApiResponse<LiveSessionType>>(
      `/live-sessions/${liveSessionId}/join`,
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

  // MARK LEFT
  markLeft: async (liveSessionId: string): Promise<LiveSessionType> => {
    const res = await api.post<ApiResponse<LiveSessionType>>(
      `/live-sessions/${liveSessionId}/leave`,
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

  // FEEDBACK FOR COACH
  feedbackForCoach: async (
    liveSessionId: string,
    rating: number,
  ): Promise<LiveSessionType> => {
    const res = await api.post<ApiResponse<LiveSessionType>>(
      `/live-sessions/${liveSessionId}/rating`,
      { rating },
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

  // FEEDBACK FOR TRAINEE
  feedbackForTrainee: async (
    liveSessionId: string,
    comment: string,
  ): Promise<LiveSessionType> => {
    const res = await api.post<ApiResponse<LiveSessionType>>(
      `/live-sessions/${liveSessionId}/comment`,
      { comment },
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

  // GET RECORD URL
  getRecordUrl: async (bookingId: string): Promise<string> => {
    const res = await api.get<ApiResponse<string>>(
      `/live-sessions/${bookingId}/recording-url`,
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

  // CANCEL LIVE SESSION
  cancel: async (bookingId: string): Promise<string> => {
    const res = await api.delete<ApiResponse<string>>(
      `/coach-bookings/${bookingId}/cancel`,
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

export default LiveSessionService;
