import { ApiResponse } from '../utils/ApiResType';
import { CourseDetailType, CourseType } from '../utils/CourseType';
import api from './axiosInstance';

export const courseService = {
  // GET ALL
  getAll: async () => {
    const res = await api.get<ApiResponse<CourseType[]>>(`/courses/active`);

    if (!res.data.success) {
      throw {
        type: 'BUSINESS_ERROR',
        message: res.data.message,
        errorCode: res.data.errorCode,
      };
    }

    return res.data.data.filter(course => course.totalLesson > 0);
  },

  // GET BY ID
  getById: async (courseId: string): Promise<CourseType> => {
    const res = await api.get<ApiResponse<CourseType>>(`/courses/${courseId}`);

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
  getByName: async (name: string): Promise<CourseType[]> => {
    const res = await api.get<ApiResponse<CourseType[]>>(`/courses/search`, {
      params: {
        name,
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

  // GET BY DIFFICULTY LEVEL
  getByLevel: async (level: string): Promise<CourseType[]> => {
    const res = await api.get<ApiResponse<CourseType[]>>(
      `/courses/level/${level}/active`,
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

  // GET FULL DETAIL
  getFullDetail: async (courseId: string): Promise<CourseDetailType> => {
    const res = await api.get<ApiResponse<CourseDetailType>>(
      `/courses/${courseId}/details`,
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
