export type GenderType = 'FEMALE' | ' MALE' | 'OTHER';

export type CoachType = {
  coachId: string;
  fullName: string;
  age: number;
  gender: GenderType;
  avatarUrl: string;
  rating_avg: number;
  yearsOfExperience: number;
  bio: string;
  specialization: string[];
  certifications: string[];
  active: boolean;
};

export type FeedbackType = {
  feedbackId: string;
  coachId: string;
  coachFullName: string;
  traineeId: string;
  traineeFullName: string;
  img_url: string;
  rating: number;
  comment: string;
  createdAt: string;
};
