import { ApiResponse } from '../utils/ApiResType';
import { TutorialType } from '../utils/ExerciseType';
import api from './axiosInstance';

export const tutorialService = {
  // GET BY ID
  getById: async (exerciseId: string): Promise<TutorialType> => {
    const res = await api.get<ApiResponse<TutorialType>>(
      `/tutorials/exercise/${exerciseId}`,
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
