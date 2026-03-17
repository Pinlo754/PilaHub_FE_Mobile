import { useEffect, useState } from 'react';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { RouteProp } from '@react-navigation/native';
import { courseService } from '../../hooks/course.service';
import { CourseDetailType } from '../../utils/CourseType';
import { traineeCourseService } from '../../hooks/traineeCourse.service';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { courseLessonProgressService } from '../../hooks/courseLessonProgress.service';
import {
  CreateScheduleReq,
  TrainingDay,
} from '../../utils/CourseLessonProgressType';

type Props = {
  route: RouteProp<RootStackParamList, 'ProgramDetail'>;
  navigation: NativeStackNavigationProp<RootStackParamList, 'ProgramDetail'>;
};

export const useProgramDetail = ({ route, navigation }: Props) => {
  // PARAM
  const { program_id, traineeCourseId } = route.params;

  // CONSTANT
  const TIMEOUT = 3010;

  // STATE
  const [programFullDetail, setProgramFullDetail] =
    useState<CourseDetailType>();
  const [isEnrolled, setIsEnrolled] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, openErrorModalMsg] = useState<string | null>(null);
  const [showErrorModal, setShowErrorModal] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
  const [confirmMsg, setConfirmMsg] = useState<string>('');
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [showSchedule, setShowSchedule] = useState<boolean>(false);
  const [sessionPerWeek, setSessionPerWeek] = useState<number | null>(null);
  const [selectedDays, setSelectedDays] = useState<TrainingDay[]>([]);

  // FETCH
  const fetchById = async () => {
    if (!program_id) return;

    setIsLoading(true);
    try {
      const [programDetail, enrolled] = await Promise.all([
        courseService.getFullDetail(program_id),
        traineeCourseService.checkEnrollment(
          'e764ce59-c100-46d9-a17e-146082eae166',
          program_id,
        ),
      ]);

      setProgramFullDetail(programDetail);
      setIsEnrolled(enrolled);
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

  const enrollCourse = async () => {
    if (!program_id || selectedDays.length === 0) return;

    setIsLoading(true);
    try {
      const resEnroll = await traineeCourseService.enrollCourse(
        'e764ce59-c100-46d9-a17e-146082eae166',
        program_id,
      );

      const payload: CreateScheduleReq = {
        traineeCourseId: resEnroll.traineeCourseId,
        trainingDays: selectedDays,
      };

      await courseLessonProgressService.createSchedule(payload);

      openSuccessModal('Đăng ký khóa học thành công!');

      setTimeout(() => {
        navigation.navigate('MainTabs', {
          screen: 'List',
        });
      }, TIMEOUT);
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

  const getProgressOfCourseLesson = async (courseLessonId: string) => {
    if (!traineeCourseId) return;

    setIsLoading(true);
    try {
      const res = await courseLessonProgressService.getProgressOfCourseLesson(
        traineeCourseId,
        courseLessonId,
      );

      return res.progressId;
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

  // HANDLERS
  const onPress = () => {
    setShowSchedule(true);
  };
  const openSuccessModal = (msg: string) => {
    setSuccessMsg(msg);
    setShowSuccessModal(true);
  };

  const closeSuccessModal = () => {
    setSuccessMsg('');
    setShowSuccessModal(false);
  };

  const openErrorModal = (msg: string) => {
    openErrorModalMsg(msg);
    setShowErrorModal(true);
  };

  const closeErrorModal = () => {
    openErrorModalMsg('');
    setShowErrorModal(false);
  };

  const openConfirmModal = (msg: string) => {
    setConfirmMsg(msg);
    setShowConfirmModal(true);
  };

  const closeConfirmModal = () => {
    setConfirmMsg('');
    setShowConfirmModal(false);
  };

  const onConfirmModal = () => {
    closeConfirmModal();
    closeSchedule();
    enrollCourse();
  };

  const closeSchedule = () => {
    setShowSchedule(false);
    setSessionPerWeek(null);
    setSelectedDays([]);
  };

  const handleSelectSession = (value: number) => {
    setSessionPerWeek(value);
    setSelectedDays([]);
  };

  const handleSelectDay = (day: TrainingDay) => {
    if (!sessionPerWeek) return;

    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter(d => d !== day));
      return;
    }

    if (selectedDays.length >= sessionPerWeek) return;

    setSelectedDays([...selectedDays, day]);
  };

  const onPressRegister = () => {
    openConfirmModal('Bạn có chắc muốn đăng ký lịch học này không?');
  };

  // USE EFFECT
  useEffect(() => {
    if (!program_id) return;

    fetchById();
  }, [program_id]);

  return {
    programFullDetail,
    programDetail: programFullDetail?.course,
    lessons: programFullDetail?.lessons ?? [],
    isLoading,
    isEnrolled,
    closeConfirmModal,
    closeErrorModal,
    closeSuccessModal,
    confirmMsg,
    errorMsg,
    successMsg,
    onConfirmModal,
    showConfirmModal,
    showErrorModal,
    showSuccessModal,
    onPress,
    showSchedule,
    closeSchedule,
    handleSelectDay,
    handleSelectSession,
    sessionPerWeek,
    selectedDays,
    onPressRegister,
    getProgressOfCourseLesson,
  };
};
