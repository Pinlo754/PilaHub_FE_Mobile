import { useState } from 'react';
import { courseMock, exerciseMock } from '../../mocks/searchData';
import { ListTab } from '../../constants/listTab';
import { TabTypeMap } from '../../utils/ListType';

export const useListScreen = () => {
  // STATE
  const [activeTab, setActiveTab] = useState<ListTab>(ListTab.Exercise);

  // DATA
  const dataByTab: {
    [K in ListTab]: TabTypeMap[K][];
  } = {
    [ListTab.Exercise]: exerciseMock,
    [ListTab.Course]: courseMock,
  };
  return {
    activeTab,
    onChangeTab: setActiveTab,
    dataByTab,
  };
};
