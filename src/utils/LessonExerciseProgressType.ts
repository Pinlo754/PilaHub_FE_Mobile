export type LessonExerciseProgressType = {
  lessonExerciseProgressId: string;
  courseLessonProgressId: string;
  lessonExerciseId: string;
  exerciseId: string;
  exerciseName: string;
  startedAt: string;
  completedAt: string | null;
  completed: boolean;
  createdAt: string;
};
