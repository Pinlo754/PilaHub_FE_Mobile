import { useEffect, useState } from 'react';
import { SearchTab } from '../../constants/searchTab';
import { TabTypeMap } from '../../utils/SearchType';
import { exerciseService } from '../../hooks/exercise.service';
import { courseService } from '../../hooks/course.service';
import { CoachService } from '../../hooks/coach.service';
import { LevelType } from '../../utils/CourseType';
import { fetchTraineeProfile } from '../../services/profile';
import { traineeCourseService } from '../../hooks/traineeCourse.service';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type DataByTab = {
  [K in SearchTab]: TabTypeMap[K][];
};

type StatusByTab = {
  [K in SearchTab]: {
    loading: boolean;
    error: string | null;
  };
};

export type FilterOptions = {
  level: LevelType | null;
};

type Props = {
  route: RouteProp<RootStackParamList, 'Search'>;
  navigation: NativeStackNavigationProp<RootStackParamList, 'Search'>;
};

export const useSearchScreen = ({ navigation, route }: Props) => {
  // PARAM
  const isNavigateHome = route.params?.navigateHome ?? null;

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
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<FilterOptions>({ level: null });
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [traineeId, setTraineeId] = useState<string | null>(null);
  const [errorMsg, openErrorModalMsg] = useState<string | null>(null);
  const [showErrorModal, setShowErrorModal] = useState<boolean>(false);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<Set<string>>(
    new Set(),
  );

  // FETCH
  const fetchTrainee = async () => {
    setIsLoading(true);
    try {
      const resTrainee = await fetchTraineeProfile();

      if (resTrainee.ok) {
        setTraineeId(resTrainee.data.traineeId);

        const resTraineeCourse = await traineeCourseService.getAll(
          resTrainee.data.traineeId,
        );

        const ids = new Set(resTraineeCourse.map(item => item.course.courseId));
        setEnrolledCourseIds(ids);
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
  };

  const fetchAllData = async (tab: SearchTab) => {
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
          const courses = await courseService.getAll();

          result = courses.map(course => ({
            ...course,
            isEnrolled: enrolledCourseIds.has(course.courseId),
          }));
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

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    const q = query.trim();

    if (!q) {
      // Reset về data gốc (xóa cache để fetch lại)
      setIsSearching(false);
      setDataByTab(prev => ({ ...prev, [activeTab]: [] }));
      setFilter({ level: null });
      return;
    }

    setIsSearching(true);
    try {
      setStatusByTab(prev => ({
        ...prev,
        [activeTab]: { loading: true, error: null },
      }));

      let result: any[] = [];
      switch (activeTab) {
        case SearchTab.Exercise:
          result = await exerciseService.getByName(q);
          break;
        case SearchTab.Course:
          const courses = await courseService.getByName(q);

          result = courses.map(course => ({
            ...course,
            isEnrolled: enrolledCourseIds.has(course.courseId),
          }));
          break;
        case SearchTab.Coach:
          result = await CoachService.getByName(q);
          break;
      }

      setDataByTab(prev => ({ ...prev, [activeTab]: result }));
    } catch (err: any) {
      setStatusByTab(prev => ({
        ...prev,
        [activeTab]: {
          loading: false,
          error:
            err?.type === 'BUSINESS_ERROR'
              ? err.message
              : 'Không thể tìm kiếm!',
        },
      }));
      return;
    } finally {
      setStatusByTab(prev => ({
        ...prev,
        [activeTab]: { loading: false, error: null },
      }));
    }
  };

  const handleFilter = async (options: FilterOptions) => {
    setFilter(options);
    setIsFilterVisible(false);

    if (!options.level) {
      setIsSearching(false);
      setDataByTab(prev => ({ ...prev, [activeTab]: [] }));
      return;
    }

    setIsSearching(true);
    try {
      setStatusByTab(prev => ({
        ...prev,
        [activeTab]: { loading: true, error: null },
      }));

      let result: any[] = [];
      switch (activeTab) {
        case SearchTab.Exercise:
          result = await exerciseService.getByLevel(options.level);
          break;
        case SearchTab.Course:
          const courses = await courseService.getByLevel(options.level);

          result = courses.map(course => ({
            ...course,
            isEnrolled: enrolledCourseIds.has(course.courseId),
          }));
          break;
        case SearchTab.Coach:
          // Coach không có filter
          break;
      }

      setDataByTab(prev => ({ ...prev, [activeTab]: result }));
    } catch (err: any) {
      setStatusByTab(prev => ({
        ...prev,
        [activeTab]: {
          loading: false,
          error:
            err?.type === 'BUSINESS_ERROR'
              ? err.message
              : 'Không thể lọc dữ liệu!',
        },
      }));
      return;
    } finally {
      setStatusByTab(prev => ({
        ...prev,
        [activeTab]: { loading: false, error: null },
      }));
    }
  };

  const onPressBack = () => {
    if (isNavigateHome === true) {
      navigation.navigate('MainTabs', { screen: 'Home' });
    } else if (isNavigateHome === false) {
      navigation.navigate('MainTabs', { screen: 'List' });
    } else {
      navigation.goBack();
    }
  };

  const onChangeTab = (tab: SearchTab) => {
    if (isSearching) {
      setDataByTab(prev => ({ ...prev, [activeTab]: [] }));
    }
    setActiveTab(tab);
    setSearchQuery('');
    setFilter({ level: null });
    setIsSearching(false);
  };

  const clearFilter = () => {
    setFilter({ level: null });
    setIsSearching(false);
    setDataByTab(prev => ({ ...prev, [activeTab]: [] }));
  };

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
    if (isSearching) return;
    fetchAllData(activeTab);
  }, [
    activeTab,
    dataByTab[activeTab].length,
    isSearching,
    traineeId,
    enrolledCourseIds,
  ]);

  return {
    activeTab,
    onChangeTab,
    dataByTab,
    data: dataByTab[activeTab],
    loading: statusByTab[activeTab].loading,
    error: statusByTab[activeTab].error,
    searchQuery,
    setSearchQuery,
    handleSearch,
    filter,
    handleFilter,
    clearFilter,
    isFilterVisible,
    setIsFilterVisible,
    isSearching,
    onPressBack,
  };
};
