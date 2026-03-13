import { useEffect, useState } from 'react';
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
  };
  return {
    activeTab,
    onChangeTab: setActiveTab,
    dataByTab,
  };
};
