import { ReportReason } from "../constants/reportOption";

export type LiveSessionReportType = {
  liveSessionId: string;
  reporterId: string;
  reportedUserId: string;
  reason: ReportReason;
  description: string | null;
  createdAt: string;
  resolvedAt: string | null;
  resolvedBy: string | null;
  internalNote: string | null;
};
