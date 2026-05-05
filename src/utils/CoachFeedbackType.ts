export type CoachFeedbackType = {
  feedbackId: string;
  coachId: string;
  coachFullName: string;
  traineeId: string;
  traineeFullName: string;
  traineeAvatarUrl: string;
  liveSessionId: string;
  rating: number;
  comment: string;
  createdAt: string;
};

export type CreateCoachFeedbackReq = {
  coachId: string;
  liveSessionId: string;
  rating: number;
  comment: string;
};
