import { useState } from 'react';
import { SummaryTab } from '../../constants/summaryTab';

export const useAISummary = () => {
  // CONSTANT
  const PASS = 60;

  // STATE
  const [activeTab, setActiveTab] = useState<SummaryTab>(SummaryTab.Point);

  // CHECK
  const isPointTab = activeTab === SummaryTab.Point;
  const isPass = 70 > PASS;

  return {
    activeTab,
    onChangeTab: setActiveTab,
    isPass,
    isPointTab,
  };
};
