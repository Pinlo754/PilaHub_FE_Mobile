export type LiveSessionReportType = {
  liveSessionId: string;
  reporterId: string;
  reportedUserId: string;
  reason: string;
  reasonName: string;
  description: string | null;
  createdAt: string;
  resolvedAt: string | null;
  resolvedBy: string | null;
  internalNote: string | null;
};
