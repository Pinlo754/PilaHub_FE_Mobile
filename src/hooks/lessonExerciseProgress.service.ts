import { ApiResponse } from '../utils/ApiResType';
import { LessonExerciseProgressType } from '../utils/LessonExerciseProgressType';
import api from './axiosInstance';

export const lessonExerciseProgressService = {
  // GET BY COURSE LESSON PROGRESS ID
  getByCourseLessonProgressId: async (
    courseLessonProgressId: string,
  ): Promise<LessonExerciseProgressType[]> => {
    const res = await api.get<ApiResponse<LessonExerciseProgressType[]>>(
      `/lesson-exercise-progress/course-lesson-progress/${courseLessonProgressId}`,
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
