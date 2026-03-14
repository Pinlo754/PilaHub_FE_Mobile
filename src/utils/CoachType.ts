export type GenderType = 'FEMALE' | ' MALE' | 'OTHER';

export type CoachType = {
  coachId: string;
  fullName: string;
  age: number;
  gender: GenderType;
  avatarUrl: string;
  avgRating: number | null;
  yearsOfExperience: number;
  bio: string;
  specialization: string[];
  certificationsUrl: string[];
  pricePerHour: number;
  active: boolean;
};

export type FeedbackType = {
  feedbackId: string;
  coachId: string;
  coachFullName: string;
  traineeId: string;
  traineeFullName: string;
  traineeAvatarUrl: string;
  rating: number;
  comment: string;
  createdAt: string;
};
