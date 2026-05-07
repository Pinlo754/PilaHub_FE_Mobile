import { CourseLessonType } from './CourseLessonType';
import { ExerciseType } from './ExerciseType';
import { TraineeCourseType } from './TraineeCourseType';

export type TrainingDay = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type CourseLessonProgressType = {
  progressId: string;
  traineeCourse: TraineeCourseType;
  courseLesson: CourseLessonType;
  startedAt: string | null;
  completedAt: string | null;
  completed: boolean;
};

export type CreateScheduleReq = {
  traineeCourseId: string;
  startDate: string;
  trainingDays: TrainingDay[];
};

export type PracticePayload = {
  isEnrolled: boolean;
  progressId: string;
  lessonExerciseIds: string[];
  exerciseIds: ExerciseType['exerciseId'][];
  durations: number[];
  lessonDurations: number[];
  sets: number[];
  restSeconds: number[];
  programId: string;
  traineeCourseId: string | null;
};
