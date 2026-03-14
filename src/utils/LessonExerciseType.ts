export type LessonExerciseType = {
  lessonExerciseId: string;
  lessonId: string;
  lessonName: string;
  exerciseId: string;
  exerciseName: string;
  displayOrder: number | null;
  sets: number | null;
  reps: number | null;
  durationSeconds: number | null;
  restSeconds: number | null;
  notes: string | null;
};
