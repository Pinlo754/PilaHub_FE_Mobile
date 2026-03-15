import { ApiResponse } from '../utils/ApiResType';
import { CourseProgressType } from '../utils/CourseProgress';
import api from './axiosInstance';

export const courseProgressService = {
  // GET PROGRESS OF TRAINEECOURSE
  getProgressOfTraineeCourse: async (
    traineeCourseId: string,
  ): Promise<CourseProgressType> => {
    const res = await api.get<ApiResponse<CourseProgressType>>(
      `/course-lesson-progress/trainee-course/${traineeCourseId}`,
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

  // START LESSON
  startLesson: async (proressId: string): Promise<CourseProgressType> => {
    const res = await api.put<ApiResponse<CourseProgressType>>(
      `/course-lesson-progress/${proressId}/start`,
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

  // COMPLETE LESSON
  completeLesson: async (proressId: string): Promise<CourseProgressType> => {
    const res = await api.put<ApiResponse<CourseProgressType>>(
      `/course-lesson-progress/${proressId}/complete`,
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
