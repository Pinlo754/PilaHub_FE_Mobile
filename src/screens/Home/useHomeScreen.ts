import { useCallback, useRef, useState } from 'react';
import { courseMock, exerciseMock, productMock } from '../../mocks/searchData';
import { PermissionsAndroid, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';


export const useHomeScreen = () => {
  // STATE
  const [dailyTasks, setDailyTasks] = useState(courseMock);
  const [recommendCourses, setRecommendCourses] = useState(courseMock);
  const [newExercises, setNewExercises] = useState(exerciseMock);
  const [newProducts, setNewProducts] = useState(productMock);

  // USE REF
  const scrollRef = useRef<ScrollView>(null);

  // USE FOCUS EFFECT
  useFocusEffect(
    useCallback(() => {
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    }, []),
  );

  return {
    dailyTasks,
    recommendCourses,
    newExercises,
    newProducts,
    scrollRef,
  };
};
