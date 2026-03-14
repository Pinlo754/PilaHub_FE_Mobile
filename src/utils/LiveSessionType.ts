import { CoachBookingType } from './CoachBookingType';

export type LiveSessionStatus =
  | 'PENDING'
  | 'ACTIVE'
  | 'COMPLETED'
  | 'NO_SHOW'
  | 'FAILED';

export type AgoraTokenRes = {
  channelName: string;
  uid: number;
  token: string;
  expirationSeconds: number;
};

export type SessionData = {
  channelName: string;
  uid: number;
  token: string;
};

export type LiveSessionType = {
  liveSessionId: string;
  coachBooking: CoachBookingType;
  channelName: string;
  coachUid: number;
  traineeUid: number;
  coachToken: string | null;
  traineeToken: string | null;
  tokenGeneratedAt: string | null;
  tokenExpiresAt: string | null;
  status: LiveSessionStatus;
  coachJoinedAt: string | null;
  traineeJoinedAt: string | null;
  sessionEndedAt: string | null;
  recordingEnabled: boolean;
  agoraResourceId: string | null;
  agoraRecordingSid: string | null;
  recordingUrl: string | null;
  recordingExpiresAt: string | null;
  ratingByTrainee: number | null;
  commentByCoach: string | null;
  errorMessage: string | null;
};
