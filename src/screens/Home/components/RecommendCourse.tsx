import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { colors } from '../../../theme/colors';
import { CourseType } from '../../../utils/CourseType';
import Carousel from './Carousel';
import { courseService } from '../../../hooks/course.service';

const RecommendCourse = () => {
  const [courses, setCourses] = useState<CourseType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const shuffleArray = <T,>(input: T[]): T[] => {
    const a = [...input];

    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }

    return a;
  };

  useEffect(() => {
    let mounted = true;

    const fetchCourses = async () => {
      try {
        setLoading(true);
        setErrorMessage('');

        console.log('RecommendCourse: fetching courses...');

        const list = await courseService.getAll();

        console.log(
          'RecommendCourse: fetched count =',
          Array.isArray(list) ? list.length : 0,
        );

        if (!mounted) return;

        const safeList = Array.isArray(list) ? list : [];
        const shuffledList = shuffleArray(safeList);

        setCourses(shuffledList);

        console.log(
          'RecommendCourse: setCourses count =',
          shuffledList.length,
        );
      } catch (err: any) {
        console.log('RECOMMEND_COURSE_FETCH_ERROR:', err);

        if (!mounted) return;

        setErrorMessage(
          err?.message ||
            err?.response?.data?.message ||
            'Không thể tải danh sách khóa học',
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchCourses();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <View className="mx-4 mt-2">
      {/* Header */}
      <Pressable className="flex-row gap-4 items-center mb-2">
        <Text className="text-foreground text-lg font-semibold">
          Đề xuất khóa học
        </Text>

        <Ionicons
          name="settings-outline"
          size={20}
          color={colors.foreground}
        />
      </Pressable>

      {/* Loading */}
      {loading ? (
        <View className="py-6 items-center justify-center">
          <ActivityIndicator size="small" color={colors.foreground} />
          <Text className="text-secondaryText text-sm mt-2">
            Đang tải khóa học...
          </Text>
        </View>
      ) : errorMessage ? (
        <View className="py-6 items-center justify-center">
          <Text className="text-red-500 text-sm text-center">
            {errorMessage}
          </Text>
        </View>
      ) : courses.length === 0 ? (
        <View className="py-6 items-center justify-center">
          <Text className="text-secondaryText text-sm text-center">
            Chưa có khóa học phù hợp
          </Text>
        </View>
      ) : (
        <Carousel data={courses} />
      )}
    </View>
  );
};

export default RecommendCourse;