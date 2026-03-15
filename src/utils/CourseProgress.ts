import { CourseLessonType } from './CourseLessonType';
import { TraineeCourseType } from './TraineeCourseType';

export type CourseProgressType = {
  progressId: string;
  traineeCourse: TraineeCourseType;
  courseLesson: CourseLessonType;
  startedAt: string | null;
  completedAt: string | null;
  completed: boolean;
};
