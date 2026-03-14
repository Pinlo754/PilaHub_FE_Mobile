import { useEffect, useState } from 'react';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { RouteProp } from '@react-navigation/native';
import { CourseLessonType } from '../../utils/CourseLessonType';
import { courseLessonService } from '../../hooks/courseLesson.service';
import { courseService } from '../../hooks/course.service';
import { CourseType } from '../../utils/CourseType';
import { LessonExerciseType } from '../../utils/LessonExerciseType';
import { lessonExerciseService } from '../../hooks/lessonExercise.service';

type Props = {
  route: RouteProp<RootStackParamList, 'ProgramDetail'>;
};

export const useProgramDetail = ({ route }: Props) => {
  // PARAM
  const { program_id } = route.params;

  // STATE
  const [programDetail, setProgramDetail] = useState<CourseType>();
  const [courseLessons, setCourseLessons] = useState<CourseLessonType[]>();
  const [lessonExercises, setLessonExercises] = useState<
    Record<string, LessonExerciseType[]>
  >({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // FETCH
  const fetchById = async () => {
    if (!program_id) return;

    setIsLoading(true);
    setError(null);
    try {
      // 1. Fetch course + course lesson
      const [resCourse, resCourseLesson] = await Promise.all([
        courseService.getById(program_id),
        courseLessonService.getCourseLessonById(program_id),
      ]);

      setProgramDetail(resCourse);
      setCourseLessons(resCourseLesson);

      // 2. Lấy tất cả lessonId
      const lessonIds = resCourseLesson.map(l => l.lessonId);

      // 3. Fetch lesson exercise
      const resLessonExercise = await Promise.all(
        lessonIds.map(id => lessonExerciseService.getLessonExerciseById(id)),
      );

      // 4. Convert thành object theo lessonId
      const exerciseMap: Record<string, LessonExerciseType[]> = {};

      lessonIds.forEach((id, index) => {
        exerciseMap[id] = resLessonExercise[index];
      });

      setLessonExercises(exerciseMap);
    } catch (err: any) {
      if (err?.type === 'BUSINESS_ERROR') {
        setError(err.message);
      } else {
        setError('Có lỗi xảy ra. Vui lòng thử lại.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // USE EFFECT
  useEffect(() => {
    if (!program_id) return;

    fetchById();
  }, [program_id]);

  return {
    programDetail,
    courseLessons,
    lessonExercises,
    isLoading,
    error,
  };
};
