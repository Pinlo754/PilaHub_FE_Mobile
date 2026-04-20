export type WorkoutFeedbackType = {
  workoutFeedbackId: string;
  workoutSessionId: string;
  totalMistakes: number;
  formScore: number;
  enduranceScore: number;
  overallScore: number;
  strengths: string;
  weaknesses: string;
  recommendations: string;
  aiModel: string;
  generatedAt: string;
};
