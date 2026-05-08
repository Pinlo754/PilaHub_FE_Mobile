import React, {
  useEffect,
  useRef,
  useState,
} from 'react';

import { SafeAreaView } from 'react-native-safe-area-context';

import { useNavigation } from '@react-navigation/native';

import GenderUI from './steps/gender/Gender.ui';
import AgeUI from './steps/age/Age.ui';
import InformationUI from './steps/infor/Information.ui';
import WorkoutUI from './steps/workout/Workout.ui';
import InjuryUI from './steps/injury/Injury.ui';
import HeightUI from './steps/height/Height.ui';
import WeightUI from './steps/weight/Weight.ui';

import {
  loadOnboarding,
  saveOnboarding,
  clearOnboarding,
} from '../../utils/storage';

import { useOnboardingStore } from '../../store/onboarding.store';

import {
  submitTraineeProfile,
} from '../../services/profile';

import LoadingOverlay from '../../components/LoadingOverlay';

import ModalPopup from '../../components/ModalPopup';

import Toast from '../../components/Toast';

type ModalState = {
  visible: boolean;

  mode: 'noti' | 'toast' | 'confirm';

  title?: string;

  message: string;

  iconName?: string;

  iconBgColor?: any;
};

const STEPS = [
  GenderUI,
  AgeUI,
  InformationUI,
  WorkoutUI,
  InjuryUI,
  HeightUI,
  WeightUI,
];

const FIELD_TO_STEP: Record<
  string,
  number
> = {
  gender: 0,

  age: 1,

  fullName: 2,

  workoutLevel: 3,

  workoutFrequency: 3,

  height: 5,

  weight: 6,
};

const FIELD_LABELS: Record<
  string,
  string
> = {
  gender: 'Giới tính',

  age: 'Tuổi',

  fullName: 'Họ và tên',

  workoutLevel:
    'Mức độ tập luyện',

  workoutFrequency:
    'Tần suất tập luyện',

  height: 'Chiều cao',

  weight: 'Cân nặng',
};

const OnboardingScreen = () => {
  const {
    step,
    data,
    setStep,
    setData,
    reset,
  } = useOnboardingStore();

  const navigation =
    useNavigation<any>();

  const StepComponent =
    STEPS[step];

  const [
    creatingTrainee,
    setCreatingTrainee,
  ] = useState(false);

  const prevStepRef =
    useRef<number>(step);

  const WORKOUT_STEP =
    STEPS.indexOf(WorkoutUI);

  const [
    modalState,
    setModalState,
  ] = useState<ModalState>({
    visible: false,
    mode: 'noti',
    message: '',
  });

  const [
    toastVisible,
    setToastVisible,
  ] = useState(false);

  const [toastMsg, setToastMsg] =
    useState('');

  const [toastType, setToastType] =
    useState<
      'success' | 'error' | 'info'
    >('success');

  /**
   * =========================
   * LOAD SAVED
   * =========================
   */

  useEffect(() => {
    loadOnboarding().then(
      (saved) => {
        if (saved) {
          setData(saved.data);

          setStep(
            saved.step ?? 0,
          );
        }
      },
    );
  }, [setData, setStep]);

  /**
   * =========================
   * SAVE
   * =========================
   */

  useEffect(() => {
    if (step >= STEPS.length) {
      try {
        clearOnboarding();
      } catch {}

      navigation.replace(
        'InputBody' as any,
      );

      return;
    }

    saveOnboarding({
      step,
      data,
    });
  }, [
    step,
    data,
    navigation,
  ]);

  /**
   * =========================
   * RESET
   * =========================
   */

  useEffect(() => {
    if (step == null) {
      reset();
    }
  }, [reset, step]);

  /**
   * =========================
   * SUBMIT TRAINEE PROFILE
   * after workout
   * =========================
   */

  useEffect(() => {
  const prev =
    prevStepRef.current ?? 0;

  /**
   * after workout
   * -> entering injury
   */

  if (
    step > prev &&
    step === WORKOUT_STEP + 1 &&
    !data?.traineeId
  ) {
    (async () => {
      try {
        const missingFields: string[] =
          [];

        if (!(data as any)?.gender)
          missingFields.push(
            'gender',
          );

        if (
          (data as any)?.age ==
          null
        )
          missingFields.push(
            'age',
          );

        if (
          !(data as any)
            ?.fullName
        )
          missingFields.push(
            'fullName',
          );

        if (
          !(data as any)
            ?.workoutLevel
        )
          missingFields.push(
            'workoutLevel',
          );

        if (
          !(data as any)
            ?.workoutFrequency
        )
          missingFields.push(
            'workoutFrequency',
          );

        /**
         * validation fail
         */

        if (
          missingFields.length > 0
        ) {
          const msgs =
            missingFields
              .map(
                (field) =>
                  `${
                    FIELD_LABELS[
                      field
                    ] ?? field
                  } bị thiếu`,
              )
              .join('\n');

          const first =
            missingFields[0];

          const targetStep =
            FIELD_TO_STEP[
              first
            ] ?? 0;

          setStep(targetStep);

          setModalState({
            visible: true,

            mode: 'noti',

            title:
              'Thiếu thông tin bắt buộc',

            message: msgs,

            iconName:
              'warning',

            iconBgColor:
              'yellow',
          });

          return;
        }

        /**
         * submit
         */

        setCreatingTrainee(
          true,
        );

        const res =
          await submitTraineeProfile(
            data as any,
          );

        const rawMessage =
          extractApiErrorMessage(
            res.error,
          );

        const friendly =
          translateApiMessage(
            rawMessage,
          );

        /**
         * SUCCESS
         * OR PROFILE ALREADY EXISTS
         */

        if (
          res.ok ||
          friendly ===
            'Hồ sơ đã tồn tại'
        ) {
          const id =
            res.data?.id ??
            res.data
              ?.profileId ??
            res.data
              ?.traineeId ??
            null;

          if (id) {
            setData({
              traineeId: id,
            });
          }

          setToastMsg(
            res.ok
              ? 'Đã tạo hồ sơ cá nhân'
              : 'Hồ sơ đã tồn tại',
          );

          setToastType(
            res.ok
              ? 'success'
              : 'info',
          );

          setToastVisible(
            true,
          );

          return;
        }

        /**
         * OTHER ERRORS
         */

        setModalState({
          visible: true,

          mode: 'noti',

          title:
            'Lỗi tạo hồ sơ',

          message:
            friendly,

          iconName:
            'alert-circle',

          iconBgColor:
            'red',
        });
      } catch (err: any) {
        const rawMessage =
          extractApiErrorMessage(
            err,
          );

        const friendly =
          translateApiMessage(
            rawMessage,
          );

        /**
         * PROFILE EXISTS
         * => STILL ALLOW NEXT STEP
         */

        if (
          friendly ===
          'Hồ sơ đã tồn tại'
        ) {
          setToastMsg(
            'Hồ sơ đã tồn tại',
          );

          setToastType(
            'info',
          );

          setToastVisible(
            true,
          );

          return;
        }

        /**
         * REAL ERROR
         */

        setModalState({
          visible: true,

          mode: 'noti',

          title: 'Lỗi',

          message: friendly,

          iconName:
            'alert-circle',

          iconBgColor:
            'red',
        });
      } finally {
        setCreatingTrainee(
          false,
        );
      }
    })();
  }

  prevStepRef.current = step;
}, [step, data]);

  const closeModal = () => {
    setModalState((s) => ({
      ...s,
      visible: false,
    }));
  };

  if (!StepComponent) {
    return null;
  }

  return (
    <SafeAreaView className="flex-1 bg-background justify-center items-center px-6">
      <StepComponent />

      {creatingTrainee ? (
        <LoadingOverlay />
      ) : null}

      <ModalPopup
        {...(modalState as any)}
        titleText={
          modalState.title
        }
        contentText={
          modalState.message
        }
        onClose={closeModal}
      />

      <Toast
        visible={toastVisible}
        message={toastMsg}
        type={toastType}
        onHidden={() =>
          setToastVisible(false)
        }
      />
    </SafeAreaView>
  );
};

function extractApiErrorMessage(
  err: any,
): string {
  if (!err)
    return 'Lỗi không xác định';

  try {
    if (
      typeof err === 'string'
    ) {
      return err;
    }

    if (
      typeof err === 'object'
    ) {
      if (err.message)
        return String(
          err.message,
        );

      if (err.error)
        return String(
          err.error,
        );

      if (
        err.response?.data
          ?.message
      ) {
        return String(
          err.response.data
            .message,
        );
      }
    }
  } catch {}

  return 'Đã xảy ra lỗi';
}

function translateApiMessage(
  message: string,
): string {
  if (!message)
    return 'Đã xảy ra lỗi';

  const text =
    message.toLowerCase();

  if (
    text.includes(
      'already exist',
    ) ||
    text.includes(
      'already exists',
    )
  ) {
    return 'Hồ sơ đã tồn tại';
  }

  if (
    text.includes(
      'unauthorized',
    )
  ) {
    return 'Phiên đăng nhập đã hết hạn';
  }

  if (
    text.includes('network')
  ) {
    return 'Không thể kết nối máy chủ';
  }

  return message;
}

export default OnboardingScreen;