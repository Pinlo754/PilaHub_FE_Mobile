import { useEffect, useState } from 'react';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { RouteProp } from '@react-navigation/native';
import { courseService } from '../../hooks/course.service';
import { CourseDetailType } from '../../utils/CourseType';
import { traineeCourseService } from '../../hooks/traineeCourse.service';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

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
    if (!program_id) return;

    setIsLoading(true);
    try {
      const res = await traineeCourseService.enrollCourse(
        'e764ce59-c100-46d9-a17e-146082eae166',
        program_id,
      );

      if (res) {
        openSuccessModal('Đăng ký khóa học thành công!');

        setTimeout(() => {
          navigation.navigate('MainTabs', {
            screen: 'List',
          });
        }, TIMEOUT);
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

  // HANDLERS
  const onPress = () => {
    openConfirmModal('Bạn có chắc muốn đăng ký khóa học này không?');
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
    enrollCourse();
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
  };
};
