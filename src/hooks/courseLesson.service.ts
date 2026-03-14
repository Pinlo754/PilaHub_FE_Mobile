import { ApiResponse } from '../utils/ApiResType';
import { CourseLessonType } from '../utils/CourseLessonType';
import api from './axiosInstance';

export const courseLessonService = {
  // GET COURSE LESSON BY ID
  getCourseLessonById: async (
    courseId: string,
  ): Promise<CourseLessonType[]> => {
    const res = await api.get<ApiResponse<CourseLessonType[]>>(
      `/course-lessons/course/${courseId}`,
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
