export type CoachType = {
  coach_id: string;
  full_name: string;
  avatar: string;
  rating_avg: number;
  experience_years: number;
  description: string;
  specialties: string[];
  certifications: string[];
};

export type FeedbackType = {
  id: string;
  user_name: string;
  img_url: string;
  date: string;
  rating: number;
  comment: string;
};
