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
import { fetchTraineeProfile } from '../../services/profile';
import { formatVND } from '../../utils/number';
import { PackageType } from '../../utils/ExerciseType';
import { getProfile } from '../../services/auth';

type Props = {
  route: RouteProp<RootStackParamList, 'ProgramDetail'>;
  navigation: NativeStackNavigationProp<RootStackParamList, 'ProgramDetail'>;
};

export const useProgramDetail = ({ route, navigation }: Props) => {
  // PARAM
  const { program_id } = route.params;
  const traineeCourseId = route.params.traineeCourseId ?? null;

  // CONSTANT
  const TIMEOUT = 3010;

  // STATE
  const [programFullDetail, setProgramFullDetail] =
    useState<CourseDetailType>();
  const [progressOfCourse, setProgressOfCourse] = useState<number>(0);
  const [isEnrolled, setIsEnrolled] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, openErrorModalMsg] = useState<string | null>(null);
  const [showErrorModal, setShowErrorModal] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
  const [confirmMsg, setConfirmMsg] = useState<string>('');
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [showSchedule, setShowSchedule] = useState<boolean>(false);
  const [selectedDays, setSelectedDays] = useState<TrainingDay[]>([]);
  const [traineeId, setTraineeId] = useState<string | null>(null);
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>([]);
  const [selectedStartDate, setSelectedStartDate] = useState<string>('');
  const [activePackage, setActivePackage] = useState<PackageType | null>(null);

  // FETCH
  const fetchInformation = async () => {
    try {
      const res = await getProfile();
      if (!res.ok) return;
      setActivePackage(res.data.activePackageType);
    } catch (err: any) {
      if (err?.type === 'BUSINESS_ERROR') {
        openErrorModal(err.message);
      } else {
        openErrorModal('Có lỗi xảy ra. Vui lòng thử lại.');
      }
    }
  };

  const fetchById = async () => {
    if (!program_id) return;

    try {
      let programDetail;
      let enrolled = false;

      if (traineeCourseId) {
        const [resProgram, resCompletedLesson] = await Promise.all([
          courseService.getFullDetail(program_id),
          courseLessonProgressService.getCompletedLesson(traineeCourseId),
        ]);

        programDetail = resProgram;
        enrolled = true;

        if (resCompletedLesson.length > 0) {
          setProgressOfCourse(
            resCompletedLesson[0].traineeCourse.progressPercentage,
          );

          const completedIds = resCompletedLesson.map(
            item => item.courseLesson.courseLessonId,
          );

          setCompletedLessonIds(completedIds);
        } else {
          setProgressOfCourse(0);
          setCompletedLessonIds([]);
        }
      } else {
        const resTrainee = await fetchTraineeProfile();

        if (!resTrainee.ok) return;

        const currentTraineeId = resTrainee.data.traineeId;
        setTraineeId(currentTraineeId);

        const [resProgram, resEnrolled] = await Promise.all([
          courseService.getFullDetail(program_id),
          traineeCourseService.checkEnrollment(currentTraineeId, program_id),
        ]);

        programDetail = resProgram;
        enrolled = resEnrolled;
      }

      setProgramFullDetail(programDetail);
      setIsEnrolled(enrolled);
    } catch (err: any) {
      if (err?.type === 'BUSINESS_ERROR') {
        openErrorModal(err.message);
      } else {
        openErrorModal('Có lỗi xảy ra. Vui lòng thử lại.');
      }
    }
  };

  const enrollCourse = async () => {
    if (!program_id || selectedDays.length === 0 || !traineeId) return;

    setIsLoading(true);
    try {
      const resEnroll = await traineeCourseService.enrollCourse(
        traineeId,
        program_id,
      );

      const payload: CreateScheduleReq = {
        traineeCourseId: resEnroll.traineeCourseId,
        trainingDays: selectedDays,
        startDate: selectedStartDate,
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
    setSelectedDays([]);
    setSelectedStartDate('');
  };

  const handleSelectDay = (day: TrainingDay) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter(d => d !== day));
      return;
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const onPressRegister = (startDate: string) => {
    if (!programFullDetail) return;
    setSelectedStartDate(startDate);
    openConfirmModal(
      `Bạn có chắc muốn đăng ký khóa học với giá ${formatVND(programFullDetail.course.price)}?`,
    );
  };

  // USE EFFECT
  useEffect(() => {
    if (!program_id) return;

    const fetchAll = async () => {
      setIsLoading(true);
      try {
        await fetchInformation();
        await fetchById();
      } finally {
        setIsLoading(false);
      }
    };

    fetchAll();
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
    selectedDays,
    onPressRegister,
    getProgressOfCourseLesson,
    traineeCourseId,
    progressOfCourse,
    completedLessonIds,
    activePackage,
  };
};
