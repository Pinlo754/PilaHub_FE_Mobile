import { ExerciseType } from "./ExerciseType";

export type LevelType = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';

export type CourseType = {
  courseId: string;
  name: string;
  description: string;
  imageUrl: string;
  difficultyLevel: LevelType;
  price: number;
  active: boolean;
  totalLesson: number;
};

export type CourseDetailType = {
  course: CourseType;
  lessons: CourseLessonDetailType[];
};

export type CourseLessonDetailType = {
  courseLessonId: string;
  displayOrder: number;
  notes: string | null;
  lesson: LessonType;
  exercises: LessonExerciseDetailType[];
};

export type LessonType = {
  lessonId: string;
  name: string;
  description: string;
  active: boolean;
};

export type LessonExerciseDetailType = {
  lessonExerciseId: string;
  displayOrder: number | null;
  sets: number | null;
  reps: number | null;
  durationSeconds: number | null;
  restSeconds: number | null;
  notes: string | null;
  exercise: ExerciseType;
};

