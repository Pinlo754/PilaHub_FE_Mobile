import { ApiResponse } from '../utils/ApiResType';
import { CoachBookingType, SignleBookingReq } from '../utils/CoachBookingType';
import api from './axiosInstance';

export const coachBookingService = {
  // CREATE SingleBooking
  createSingleBooking: async (payload: SignleBookingReq): Promise<any> => {
    const res = await api.post<ApiResponse<any>>(
      `/coach-bookings/single`,
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

  // GET ALL BOOKING OF TRAINEE
  getAllBookingOfTrainee: async (): Promise<CoachBookingType[]> => {
    const res = await api.get<ApiResponse<CoachBookingType[]>>(
      `/coach-bookings/my-bookings`,
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
