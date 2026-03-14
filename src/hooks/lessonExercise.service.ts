import { ApiResponse } from '../utils/ApiResType';
import { LessonExerciseType } from '../utils/LessonExerciseType';
import api from './axiosInstance';

export const lessonExerciseService = {
  // GET LESSON EXERCISE BY ID
  getLessonExerciseById: async (
    lessonId: string,
  ): Promise<LessonExerciseType[]> => {
    const res = await api.get<ApiResponse<LessonExerciseType[]>>(
      `/lesson-exercises/lesson/${lessonId}`,
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
