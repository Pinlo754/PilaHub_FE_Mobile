import { useRef, useState } from 'react';
import { ScrollView } from 'react-native';

export const useHomeScreen = () => {
  const scrollRef = useRef<ScrollView>(null);
  const [loading, setLoading] = useState(false);

  const refreshData = async () => {
    setLoading(true);
    try {
      // Gọi các API của bạn ở đây
      // await Promise.all([fetchRoadmap(), fetchTasks()]);
      console.log("Data Refreshed!");
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return {
    scrollRef,
    loading,
    refreshData
  };
};