import { ApiResponse } from '../utils/ApiResType';
import {
  CourseLessonProgressType,
  CreateScheduleReq,
} from '../utils/CourseLessonProgressType';
import api from './axiosInstance';

export const courseLessonProgressService = {
  // GET PROGRESS OF TRAINEECOURSE
  getProgressOfTraineeCourse: async (
    traineeCourseId: string,
  ): Promise<CourseLessonProgressType[]> => {
    const res = await api.get<ApiResponse<CourseLessonProgressType[]>>(
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
  startLesson: async (proressId: string): Promise<CourseLessonProgressType> => {
    const res = await api.put<ApiResponse<CourseLessonProgressType>>(
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
  completeLesson: async (
    proressId: string,
  ): Promise<CourseLessonProgressType> => {
    const res = await api.put<ApiResponse<CourseLessonProgressType>>(
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

  // CREATE SCHEDULE
  createSchedule: async (
    payload: CreateScheduleReq,
  ): Promise<CourseLessonProgressType> => {
    const res = await api.post<ApiResponse<CourseLessonProgressType>>(
      `/course-lesson-progress/schedule`,
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

  // GET PROGRESS OF COURSE LESSON
  getProgressOfCourseLesson: async (
    traineeCourseId: string,
    courseLessonId: string,
  ): Promise<CourseLessonProgressType> => {
    const res = await api.get<ApiResponse<CourseLessonProgressType>>(
      `/course-lesson-progress/trainee-course/${traineeCourseId}/course-lesson/${courseLessonId}`,
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

  // GET COMPLETED LESSON
  getCompletedLesson: async (
    traineeCourseId: string,
  ): Promise<CourseLessonProgressType[]> => {
    const res = await api.get<ApiResponse<CourseLessonProgressType[]>>(
      `/course-lesson-progress/trainee-course/${traineeCourseId}/completed`,
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
