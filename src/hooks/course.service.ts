import { ApiResponse } from '../utils/ApiResType';
import { CourseDetailType, CourseType } from '../utils/CourseType';
import api from './axiosInstance';

export const courseService = {
  // GET ALL ACTIVE COURSES
  getAll: async (): Promise<CourseType[]> => {
    const res = await api.get<ApiResponse<CourseType[]>>(`/courses/active`);

    console.log('COURSE_GET_ALL_RAW:', JSON.stringify(res.data, null, 2));

    if (!res.data.success) {
      throw {
        type: 'BUSINESS_ERROR',
        message: res.data.message,
        errorCode: res.data.errorCode,
      };
    }

    const data = Array.isArray(res.data.data) ? res.data.data : [];

    console.log('COURSE_GET_ALL_DATA_COUNT:', data.length);

    // Tạm thời không filter để tránh mất hết data
    return data;

    // Sau khi chắc chắn field đúng, muốn filter thì dùng lại:
    // return data.filter(course => Number(course.totalLesson ?? 0) > 0);
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

    return Array.isArray(res.data.data) ? res.data.data : [];
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

    return Array.isArray(res.data.data) ? res.data.data : [];
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