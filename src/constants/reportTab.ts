export enum ReportTab {
  Pending = 1,
  Resolved = 2,
}

export const REPORT_TABS = [
  { id: ReportTab.Pending, label: 'Đang xử lý' },
  { id: ReportTab.Resolved, label: 'Đã xử lý' },
];
