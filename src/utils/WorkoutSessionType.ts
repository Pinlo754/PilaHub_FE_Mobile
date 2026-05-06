export type WorkoutSessionType = {
  workoutSessionId: string;
  traineeId: string;
  personalExerciseId: string | null;
  lessonExerciseProgressId: string | null;
  exerciseId: string;
  exerciseName: string;
  haveAITracking: boolean;
  haveIOTDeviceTracking: boolean;
  startTime: string;
  endTime: string | null;
  durationSeconds: number | null;
  recordUrl: string;
  recordAvailable: boolean;
  completed: boolean;
};

export type WorkoutExerciseReq = {
  exerciseId: string;
  haveAITracking: boolean;
  haveIOTDeviceTracking: boolean;
};

export type WorkoutPersonalExerciseReq = {
  personalExerciseId: string;
  haveAITracking: boolean;
  haveIOTDeviceTracking: boolean;
};

export type WorkoutLessonExerciseReq = {
  courseLessonProgressId: string;
  lessonExerciseId: string;
  haveAITracking: boolean;
  haveIOTDeviceTracking: boolean;
};

export type GetByExerciseIdParams = {
  lessonExerciseProgressId?: string;
  personalExerciseId?: string;
};
