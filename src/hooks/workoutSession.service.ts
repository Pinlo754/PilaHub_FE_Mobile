import { ApiResponse } from '../utils/ApiResType';
import {
  WorkoutExerciseReq,
  WorkoutLessonExerciseReq,
  WorkoutSessionType,
} from '../utils/WorkoutSessionType';
import api from './axiosInstance';

export const workoutSessionService = {
  getById: async (id: string): Promise<WorkoutSessionType> => {
    const res = await api.get<ApiResponse<WorkoutSessionType>>(
      `/workout-sessions/${id}`,
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

  // START FREE WORKOUT
  startFreeWorkout: async (
    payload: WorkoutExerciseReq,
  ): Promise<WorkoutSessionType> => {
    const res = await api.post<ApiResponse<WorkoutSessionType>>(
      `/workout-sessions/start/free`,
      payload,
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

  // END WORKOUT
  endWorkout: async (
    workoutSessionId: string,
    recordUrl: string,
  ): Promise<any> => {
    const res = await api.put<ApiResponse<any>>(
      `/workout-sessions/${workoutSessionId}/complete`,
      {
        recordUrl,
      },
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

  feedbackWorkout: async (workoutSessionId: string): Promise<any> => {
    const res = await api.post<ApiResponse<any>>(
      `/workout-feedback/generate/${workoutSessionId}`,
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

   // START WORKOUT FOR LESSON EXERCISE
  startWorkoutForLessonExercise: async (
    payload: WorkoutLessonExerciseReq,
  ): Promise<WorkoutSessionType> => {
    const res = await api.post<ApiResponse<WorkoutSessionType>>(
      `/workout-sessions/start/lesson-exercise`,
      payload,
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
