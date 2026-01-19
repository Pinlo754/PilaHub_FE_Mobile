import { useState } from 'react';
import { SearchTab } from '../../constants/searchTab';
import { TabDataMap } from '../../utils/SearchType';

export const useSearchScreen = () => {
  // STATE
  const [activeTab, setActiveTab] = useState<SearchTab>(SearchTab.Exercise);

  // DATA
  const dataByTab: {
    [K in SearchTab]: TabDataMap[K][];
  } = {
    [SearchTab.Exercise]: [
      {
        id: '1',
        name: 'Mat Cơ Bản',
        duration: '30p',
        image_url:
          'https://cdn.mos.cms.futurecdn.net/RSRmmWZGBcNnLLynabFD2Z.jpg',
      },
    ],
    [SearchTab.Course]: [
      {
        id: '1',
        name: 'Yoga Cơ Bản',
        img_url: 'https://cdn.mos.cms.futurecdn.net/RSRmmWZGBcNnLLynabFD2Z.jpg',
        lessons: 10,
      },
    ],
    [SearchTab.Coach]: [
      {
        id: '1',
        name: 'Amanda Gilbert',
        avatar: 'https://cdn.mos.cms.futurecdn.net/RSRmmWZGBcNnLLynabFD2Z.jpg',
        rating: 4.8,
        certificate_count: 1,
      },
    ],
  };
  return {
    activeTab,
    onChangeTab: setActiveTab,
    dataByTab,
  };
};
