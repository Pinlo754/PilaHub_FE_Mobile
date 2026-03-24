import { TraineeType } from './CoachBookingType';
import { CourseType } from './CourseType';

export type TraineeCourseType = {
  traineeCourseId: '123e4567-e89b-12d3-a456-426614174000';
  trainee: TraineeType;
  course: CourseType;
  enrolledAt: string;
  progressPercentage: number;
  active: boolean;
};
