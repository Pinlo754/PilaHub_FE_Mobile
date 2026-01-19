import { useState } from 'react';
import { ExerciseTab } from '../../constants/exerciseTab';

export const useExerciseDetail = () => {
  // STATE
  const [activeTab, setActiveTab] = useState<ExerciseTab>(ExerciseTab.Theory);

  // HANDLERS
  const onChangeTab = (tabId: ExerciseTab) => {
    setActiveTab(tabId);
  };
  return {
    activeTab,
    onChangeTab,
  };
};
