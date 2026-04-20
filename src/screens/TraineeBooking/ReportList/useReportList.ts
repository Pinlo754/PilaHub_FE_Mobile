import { useEffect, useState } from 'react';
import { LiveSessionReportType } from '../../../utils/LiveSessionReportType';
import { LiveSessionType } from '../../../utils/LiveSessionType';
import { ReportTab } from '../../../constants/reportTab';
import { liveSessionReportService } from '../../../hooks/liveSessionReport.service';
import LiveSessionService from '../../../hooks/liveSession.service';

const isResolved = (report: LiveSessionReportType) =>
  report.resolvedAt !== null ||
  report.resolvedBy !== null ||
  report.internalNote !== null;

export type ReportWithSession = {
  report: LiveSessionReportType;
  liveSession: LiveSessionType | null;
};

export const useReportList = () => {
  const [activeTab, setActiveTab] = useState<ReportTab>(ReportTab.Pending);
  const [allItems, setAllItems] = useState<ReportWithSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<ReportWithSession | null>(
    null,
  );
  const [showDetailModal, setShowDetailModal] = useState(false);

  const fetchReports = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const reports = await liveSessionReportService.getAllCreated();

      const items = await Promise.all(
        reports.map(async (report): Promise<ReportWithSession> => {
          try {
            const liveSession = await LiveSessionService.getById(
              report.liveSessionId,
            );
            return { report, liveSession };
          } catch {
            return { report, liveSession: null };
          }
        }),
      );

      setAllItems(items);
    } catch (err: any) {
      setError(err?.message || 'Không thể tải danh sách report!');
    } finally {
      setIsLoading(false);
    }
  };

  const pendingItems = allItems.filter(i => !isResolved(i.report));
  const resolvedItems = allItems.filter(i => isResolved(i.report));
  const currentData =
    activeTab === ReportTab.Pending ? pendingItems : resolvedItems;

  const openDetail = (item: ReportWithSession) => {
    setSelectedItem(item);
    setShowDetailModal(true);
  };

  const closeDetail = () => {
    setShowDetailModal(false);
    setSelectedItem(null);
  };

  useEffect(() => {
    fetchReports();
  }, []);

  return {
    activeTab,
    setActiveTab,
    currentData,
    pendingCount: pendingItems.length,
    resolvedCount: resolvedItems.length,
    isLoading,
    error,
    selectedItem,
    showDetailModal,
    openDetail,
    closeDetail,
  };
};
