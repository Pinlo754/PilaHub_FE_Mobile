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
