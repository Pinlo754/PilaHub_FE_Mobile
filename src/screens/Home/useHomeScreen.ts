import { useState } from 'react';
import { courseMock, exerciseMock, productMock } from '../../mocks/searchData';

export const useHomeScreen = () => {
  // STATE
  const [dailyTasks, setDailyTasks] = useState(courseMock);
  const [recommendCourses, setRecommendCourses] = useState(courseMock);
  const [newExercises, setNewExercises] = useState(exerciseMock);
  const [newProducts, setNewProducts] = useState(productMock);
  return {
    dailyTasks,
    recommendCourses,
    newExercises,
    newProducts,
  };
};
