export type MistakeLogType = {
  mistakeLogId: string;
  workoutSessionId: string;
  bodyPartId: string;
  bodyPartName: string;
  details: string;
  imageUrl: string;
  recordedAtSecond: number;
};

export type MistakeLogReq = Omit<
  MistakeLogType,
  'mistakeLogId' | 'workoutSessionId' | 'bodyPartName'
>;

export type CreateMistakeReq = {
  workoutSessionId: string;
  mistakeLogs: MistakeLogReq[];
};
