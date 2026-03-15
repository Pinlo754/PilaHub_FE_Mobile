import { useEffect, useState } from 'react';
import { ListTab } from '../../constants/listTab';
import { TabTypeMap } from '../../utils/ListType';
import { exerciseService } from '../../hooks/exercise.service';
import { traineeCourseService } from '../../hooks/traineeCourse.service';

type DataByTab = {
  [K in ListTab]: TabTypeMap[K][];
};

type StatusByTab = {
  [K in ListTab]: {
    loading: boolean;
    error: string | null;
  };
};

export const useListScreen = () => {
  // STATE
  const [activeTab, setActiveTab] = useState<ListTab>(ListTab.Course);
  const [dataByTab, setDataByTab] = useState<DataByTab>({
    [ListTab.Exercise]: [],
    [ListTab.Course]: [],
  });

  const [statusByTab, setStatusByTab] = useState<StatusByTab>({
    [ListTab.Exercise]: { loading: false, error: null },
    [ListTab.Course]: { loading: false, error: null },
  });

  const fetchListData = async (tab: ListTab) => {
    // tránh fetch lại
    if (dataByTab[tab].length > 0) return;

    try {
      setStatusByTab(prev => ({
        ...prev,
        [tab]: { loading: true, error: null },
      }));

      let result: any[] = [];

      switch (tab) {
        case ListTab.Exercise:
          result = await exerciseService.getAll();
          break;

        case ListTab.Course:
          result = await traineeCourseService.getAll(
            'e764ce59-c100-46d9-a17e-146082eae166',
          );
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
        [tab]: {
          ...prev[tab],
          loading: false,
        },
      }));
    }
  };

  // USE EFFECT
  useEffect(() => {
    fetchListData(activeTab);
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
