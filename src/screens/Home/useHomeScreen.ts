import { useState } from 'react';
import { courseMock } from '../../mocks/searchData';

export const useHomeScreen = () => {
  // STATE
  const [dailyTasks, setDailyTasks] = useState(courseMock);
  return {
    dailyTasks,
  };
};
