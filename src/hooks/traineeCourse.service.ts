import { ApiResponse } from '../utils/ApiResType';
import { TraineeCourseType } from '../utils/TraineeCourseType';
import api from './axiosInstance';

export const traineeCourseService = {
  // GET ALL
  getAll: async (traineeId: string): Promise<TraineeCourseType[]> => {
    const res = await api.get<ApiResponse<TraineeCourseType[]>>(
      `/trainee-courses/trainee/${traineeId}`,
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

  // ENROLL COURSE
  enrollCourse: async (
    traineeId: string,
    courseId: string,
  ): Promise<TraineeCourseType> => {
    const res = await api.post<ApiResponse<TraineeCourseType>>(
      `/trainee-courses/enroll`,
      { traineeId, courseId },
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

  // CHECK ENROLLMENT
  checkEnrollment: async (
    traineeId: string,
    courseId: string,
  ): Promise<boolean> => {
    const res = await api.get<ApiResponse<boolean>>(
      `/trainee-courses/check-enrollment`,
      { params: { traineeId, courseId } },
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
  getById: async (traineeCourseId: string): Promise<TraineeCourseType> => {
    const res = await api.get<ApiResponse<TraineeCourseType>>(
      `/trainee-courses/${traineeCourseId}`,
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
