import { ApiResponse } from '../utils/ApiResType';
import { CourseType } from '../utils/CourseType';
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

    return res.data.data;
  },
};
