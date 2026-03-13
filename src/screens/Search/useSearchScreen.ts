import { useEffect, useState } from 'react';
import { SearchTab } from '../../constants/searchTab';
import { TabTypeMap } from '../../utils/SearchType';
import { exerciseService } from '../../hooks/exercise.service';
import { courseService } from '../../hooks/course.service';
import { CoachService } from '../../services/coach';

type DataByTab = {
  [K in SearchTab]: TabTypeMap[K][];
};

type StatusByTab = {
  [K in SearchTab]: {
    loading: boolean;
    error: string | null;
  };
};

export const useSearchScreen = () => {
  // STATE
  const [activeTab, setActiveTab] = useState<SearchTab>(SearchTab.Exercise);
  const [dataByTab, setDataByTab] = useState<DataByTab>({
    [SearchTab.Exercise]: [],
    [SearchTab.Course]: [],
    [SearchTab.Coach]: [],
  });
  const [statusByTab, setStatusByTab] = useState<StatusByTab>({
    [SearchTab.Exercise]: { loading: false, error: null },
    [SearchTab.Course]: { loading: false, error: null },
    [SearchTab.Coach]: { loading: false, error: null },
  });

  // FETCH
  const fetchSearchData = async (tab: SearchTab) => {
    // Nếu đã có data thì không fetch lại
    if (dataByTab[tab].length > 0) return;

    try {
      setStatusByTab(prev => ({
        ...prev,
        [tab]: { loading: true, error: null },
      }));

      let result: any[] = [];

      switch (tab) {
        case SearchTab.Exercise:
          result = await exerciseService.getAll();
          break;

        case SearchTab.Course:
          result = await courseService.getAll();
          break;

        case SearchTab.Coach:
          result = await CoachService.getAll();
          break;
      }

      setDataByTab(prev => ({
        ...prev,
        [tab]: result,
      }));
    } catch (err: any) {
      setStatusByTab(prev => ({
        ...prev,
        [tab]: {
          loading: false,
          error:
            err?.type === 'BUSINESS_ERROR'
              ? err.message
              : 'Không thể lấy dữ liệu!',
        },
      }));
      return;
    } finally {
      setStatusByTab(prev => ({
        ...prev,
        [tab]: { loading: false, error: null },
      }));
    }
  };

  // USE EFFECT
  useEffect(() => {
    fetchSearchData(activeTab);
  }, [activeTab]);

  return {
    activeTab,
    onChangeTab: setActiveTab,
    dataByTab,
    data: dataByTab[activeTab],
    loading: statusByTab[activeTab].loading,
    error: statusByTab[activeTab].error,
  };
};
