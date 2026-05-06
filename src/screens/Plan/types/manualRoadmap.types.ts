export type ManualExerciseItem = {
  exerciseId: string;
  exerciseName: string;
  imageUrl?: string | null;
  sets: string;
  reps: string;
  durationSeconds: string;
  restSeconds: string;
  notes: string;
};

export type ManualScheduleItem = {
  id: string;
  scheduleName: string;
  description: string;
  dayOfWeek: string;
  exercises: ManualExerciseItem[];
};

export type ManualStageItem = {
  id: string;
  stageName: string;
  description: string;
  stageOrder: number;
  durationWeeks: string;
  schedules: ManualScheduleItem[];
};