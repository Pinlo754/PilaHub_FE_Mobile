import { CoachType, GenderType } from './CoachType';
import { LevelType } from './CourseType';

export type BookingType = 'SINGLE' | 'PERSONAL_TRAINING_PACKAGE';

export type BookingStatus =
  | 'SCHEDULED'
  | 'CANCELLED_BY_COACH'
  | 'CANCELLED_BY_TRAINEE'
  | 'READY'
  | 'IN_PROGRESS'
  | 'NO_SHOW_BY_COACH'
  | 'NO_SHOW_BY_TRAINEE'
  | 'REFUNDED'
  | 'COMPLETED';

export type WorkoutFrequency =
  | 'SEDENTARY'
  | 'LIGHT'
  | 'MODERATE'
  | 'ACTIVE'
  | 'ATHLETE';

export type SignleBookingReq = {
  coachId: string;
  startTime: string;
  endTime: string;
  bookingType: BookingType;
};

export type BookingSlot = {
  date: Date;
  startTime: string;
  endTime: string;
};

export type CoachBookingType = {
  id: string;
  coach: CoachType;
  trainee: {
    traineeId: string;
    fullName: string;
    age: number;
    gender: GenderType;
    avatarUrl: string | null;
    workoutLevel: LevelType;
    workoutFrequency: WorkoutFrequency;
  };
  startTime: string;
  endTime: string;
  pricePerHour: number;
  totalAmount: number;
  status: BookingStatus;
  bookingType: BookingType;
  recurringGroupId: string | null;
  personalSchedule: {
    personalScheduleId: string;
    personalStageId: string;
    scheduleName: string;
    description: string;
    dayOfWeek: string;
    scheduledDate: string;
    durationMinutes: number;
    completed: boolean;
    completedAt: string;
  } | null;
};
