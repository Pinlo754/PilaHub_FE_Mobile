import { ApiResponse } from '../utils/ApiResType';
import { ExerciseType } from '../utils/ExerciseType';
import api from './axiosInstance';

export const exerciseService = {
  // GET ALL
  getAll: async (): Promise<ExerciseType[]> => {
    const res = await api.get<ApiResponse<ExerciseType[]>>(`/exercises/active`);

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
  getById: async (exerciseId: string): Promise<ExerciseType> => {
    const res = await api.get<ApiResponse<ExerciseType>>(`/exercises/${exerciseId}`);

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
