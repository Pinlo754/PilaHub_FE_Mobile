import { CoachType } from './CoachType';

export type CoachTimeOffType = {
  id: string;
  coach: CoachType;
  startTime: string;
  endTime: string;
  reason: string;
};
