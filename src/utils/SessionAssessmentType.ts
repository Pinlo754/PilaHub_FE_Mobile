export type AssessmentResult = {
  criterionId: string;
  criterionName: string;
  displayOrder: number;
  score: number;
};

export type SessionAssessmentType = {
  liveSessionId: string;
  coachId: string;
  traineeId: string;
  submittedAt: string;
  results: AssessmentResult[];
};

export type CreateAssessmentResultReq = Pick<
  AssessmentResult,
  'criterionId' | 'score'
>;

export type CreateSessionAsssessmentReq = {
  results: CreateAssessmentResultReq[];
};
