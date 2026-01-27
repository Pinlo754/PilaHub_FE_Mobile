import { useState } from 'react';
import { SearchTab } from '../../constants/searchTab';
import { TabTypeMap } from '../../utils/SearchType';
import { coachMock, courseMock, exerciseMock } from '../../mocks/searchData';

export const useSearchScreen = () => {
  // STATE
  const [activeTab, setActiveTab] = useState<SearchTab>(SearchTab.Exercise);

  // DATA
  const dataByTab: {
    [K in SearchTab]: TabTypeMap[K][];
  } = {
    [SearchTab.Exercise]: exerciseMock,
    [SearchTab.Course]: courseMock,
    [SearchTab.Coach]: coachMock,
  };
  return {
    activeTab,
    onChangeTab: setActiveTab,
    dataByTab,
  };
};
