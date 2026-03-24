import { useEffect, useState } from 'react';
<<<<<<< HEAD
import { courseMock, exerciseMock } from '../../mocks/searchData';
import { ListTab } from '../../constants/listTab';
import { TabTypeMap } from '../../utils/ListType';
import { exerciseService } from '../../hooks/exercise.service';
import { courseService } from '../../hooks/course.service';

export const useListScreen = () => {
  // STATE
  const [activeTab, setActiveTab] = useState<ListTab>(ListTab.Exercise);
  const [exercises, setExercises] = useState<TabTypeMap[ListTab.Exercise][]>([]);
  const [courses, setCourses] = useState<TabTypeMap[ListTab.Course][]>([]);
  useEffect(() => {
    const fetchExercises = async () => {
      const data = await exerciseService.getAll();
      setExercises(data);
    };

    const fetchCourses = async () => {
      const data = await courseService.getAll();
      setCourses(data);
    }
    fetchExercises();
    fetchCourses();
  }, []);
  
  // DATA
  const dataByTab: {
    [K in ListTab]: TabTypeMap[K][];
  } = {
    [ListTab.Exercise]: exercises,
    [ListTab.Course]: courses,
=======
import { ListTab } from '../../constants/listTab';
import { TabTypeMap } from '../../utils/ListType';
import { exerciseService } from '../../hooks/exercise.service';
import { traineeCourseService } from '../../hooks/traineeCourse.service';
import { fetchTraineeProfile } from '../../services/profile';

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
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [traineeId, setTraineeId] = useState<string | null>(null);
  const [errorMsg, openErrorModalMsg] = useState<string | null>(null);
  const [showErrorModal, setShowErrorModal] = useState<boolean>(false);

  // API
  const fetchTrainee = async () => {
    setIsLoading(true);
    try {
      const resTrainee = await fetchTraineeProfile();

      if (resTrainee.ok) {
        setTraineeId(resTrainee.data.traineeId);
      }
    } catch (err: any) {
      if (err?.type === 'BUSINESS_ERROR') {
        openErrorModal(err.message);
      } else {
        openErrorModal('Có lỗi xảy ra. Vui lòng thử lại.');
      }
    } finally {
      setIsLoading(false);
    }
>>>>>>> 12d4234c81ffd99881bdc36b75b812f7f020e8d4
  };

  const fetchListData = async (tab: ListTab) => {
    // tránh fetch lại
    if (dataByTab[tab].length > 0) return;

    // riêng Course phải có traineeId
    if (tab === ListTab.Course && !traineeId) return;

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
          result = await traineeCourseService.getAll(traineeId!);
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

  // HANDLERS
  const openErrorModal = (msg: string) => {
    openErrorModalMsg(msg);
    setShowErrorModal(true);
  };

  const closeErrorModal = () => {
    openErrorModalMsg('');
    setShowErrorModal(false);
  };

  // USE EFFECT
  useEffect(() => {
    fetchTrainee();
  }, []);

  useEffect(() => {
    if (activeTab === ListTab.Course && !traineeId) return;
    fetchListData(activeTab);
  }, [activeTab, traineeId]);

  return {
    activeTab,
    onChangeTab: setActiveTab,
    dataByTab,
    data: dataByTab[activeTab],
    loading: statusByTab[activeTab].loading,
    error: statusByTab[activeTab].error,
    isLoading,
    traineeId,
  };
};
