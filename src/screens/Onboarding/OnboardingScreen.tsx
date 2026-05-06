import React, { useEffect, useState, useRef } from 'react';
import GenderUI from './steps/gender/Gender.ui';
import { useOnboardingStore } from '../../store/onboarding.store';
import {
  loadOnboarding,
  saveOnboarding,
  clearOnboarding,
} from '../../utils/storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import AgeUI from './steps/age/Age.ui';
import WeightUI from './steps/weight/Weight.ui';
import HeightUI from './steps/height/Height.ui';
import WorkoutUI from './steps/workout/Workout.ui';
import { useNavigation } from '@react-navigation/native';
import InjuryUI from './steps/injury/Injury.ui';
import InformationUI from './steps/infor/Information.ui';
import { submitTraineeProfile } from '../../services/profile';
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
  WeightUI,
  HeightUI,
  InformationUI,
  WorkoutUI,
  InjuryUI,
];

const FIELD_TO_STEP: Record<string, number> = {
  gender: 0,
  age: 1,
  weight: 2,
  height: 3,
  fullName: 4,
  workoutLevel: 5,
  workoutFrequency: 5,
};

const FIELD_LABELS: Record<string, string> = {
  gender: 'Giới tính',
  age: 'Tuổi',
  weight: 'Cân nặng',
  height: 'Chiều cao',
  fullName: 'Họ và tên',
  workoutLevel: 'Mức độ tập luyện',
  workoutFrequency: 'Tần suất tập luyện',
};

const OnboardingScreen = () => {
  const { step, data, setStep, setData, reset } = useOnboardingStore();
  const navigation = useNavigation<any>();
  const StepComponent = STEPS[step];

  const [creatingTrainee, setCreatingTrainee] = useState(false);
  const prevStepRef = useRef<number>(step);
  const INJURY_STEP = STEPS.indexOf(InjuryUI);

  const [modalState, setModalState] = useState<ModalState>({
    visible: false,
    mode: 'noti',
    message: '',
  });

  const [toastVisible, setToastVisible] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>(
    'success',
  );

  useEffect(() => {
    loadOnboarding().then(saved => {
      if (saved) {
        setData(saved.data);
        setStep(saved.step ?? 0);
      }
    });
  }, [setData, setStep]);

  useEffect(() => {
    if (step >= STEPS.length) {
      try {
        clearOnboarding();
      } catch {}

      navigation.replace('InputBody' as any);
      return;
    }

    saveOnboarding({ step, data });
  }, [step, data, navigation]);

  useEffect(() => {
    if (step == null) {
      reset();
    }
  }, [reset, step]);

  useEffect(() => {
    const prev = prevStepRef.current ?? 0;

    if (step > prev && step === INJURY_STEP) {
      (async () => {
        try {
          const missingFields: string[] = [];

          try {
            if (!(data as any)?.gender) missingFields.push('gender');
            if ((data as any)?.age == null) missingFields.push('age');
            if (!(data as any)?.fullName) missingFields.push('fullName');
            if (!(data as any)?.workoutLevel)
              missingFields.push('workoutLevel');
            if (!(data as any)?.workoutFrequency)
              missingFields.push('workoutFrequency');
          } catch {}

          if (missingFields.length > 0) {
            const msgs = missingFields
              .map(field => `${FIELD_LABELS[field] ?? field} bị thiếu`)
              .join('\n');

            const first = missingFields[0];
            const targetStep = FIELD_TO_STEP[first] ?? 0;

            try {
              setStep(targetStep);
            } catch {}

            setModalState({
              visible: true,
              mode: 'noti',
              title: 'Thiếu thông tin bắt buộc',
              message: msgs,
              iconName: 'warning',
              iconBgColor: 'yellow',
            });

            return;
          }

          setCreatingTrainee(true);

          const res = await submitTraineeProfile(data as any);

          if (res.ok) {
            const id =
              res.data?.id ??
              res.data?.profileId ??
              res.data?.traineeId ??
              null;

            if (id) {
              setData({ traineeId: id });
            }

            try {
              setToastMsg('Đã lưu hồ sơ');
              setToastType('success');
              setToastVisible(true);
            } catch {}
          } else {
            const details = parseValidationDetails(res.error);

            if (details.length > 0) {
              const first = details[0];
              const targetStep = FIELD_TO_STEP[first.field] ?? prev;

              try {
                setStep(targetStep);
              } catch {}

              setModalState({
                visible: true,
                mode: 'noti',
                title: 'Lỗi xác thực',
                message: formatValidationMessage(first),
                iconName: 'alert-circle',
                iconBgColor: 'red',
              });
            } else {
              const rawMessage = extractApiErrorMessage(res.error);
              const friendly = translateApiMessage(rawMessage);
              const low = rawMessage.toLowerCase();

              if (
                low.includes('already exist') ||
                low.includes('already exists') ||
                low.includes('exists')
              ) {
                setModalState({
                  visible: true,
                  mode: 'noti',
                  title: 'Hồ sơ đã tồn tại',
                  message:
                    'Hồ sơ cá nhân đã tồn tại cho tài khoản này. Bạn có thể tiếp tục.',
                  iconName: 'information-circle',
                  iconBgColor: 'grey',
                });
              } else {
                setModalState({
                  visible: true,
                  mode: 'noti',
                  title: 'Lỗi khi tạo hồ sơ',
                  message: friendly,
                  iconName: 'alert-circle',
                  iconBgColor: 'red',
                });

                try {
                  setStep(prev);
                } catch {}
              }
            }
          }
        } catch (err: any) {
          const details = parseValidationDetails(err);

          if (details.length > 0) {
            const first = details[0];
            const targetStep = FIELD_TO_STEP[first.field] ?? prev;

            try {
              setStep(targetStep);
            } catch {}

            setModalState({
              visible: true,
              mode: 'noti',
              title: 'Lỗi xác thực',
              message: formatValidationMessage(first),
              iconName: 'alert-circle',
              iconBgColor: 'red',
            });
          } else {
            const rawMessage = extractApiErrorMessage(err);
            const friendly = translateApiMessage(rawMessage);

            setModalState({
              visible: true,
              mode: 'noti',
              title: 'Lỗi',
              message: `Không thể tạo hồ sơ: ${friendly}`,
              iconName: 'alert-circle',
              iconBgColor: 'red',
            });

            try {
              setStep(prev);
            } catch {}
          }
        } finally {
          setCreatingTrainee(false);
        }
      })();
    }

    prevStepRef.current = step;

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, data]);

  const closeModal = () => {
    setModalState((s: ModalState) => ({
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

      {creatingTrainee ? <LoadingOverlay /> : null}

      <ModalPopup
        {...(modalState as any)}
        titleText={modalState.title}
        contentText={modalState.message}
        onClose={closeModal}
      />

      <Toast
        visible={toastVisible}
        message={toastMsg}
        type={toastType}
        onHidden={() => setToastVisible(false)}
      />
    </SafeAreaView>
  );
};

function parseValidationDetails(
  err: any,
): Array<{ field: string; message: string }> {
  const out: Array<{ field: string; message: string }> = [];

  if (!err) return out;

  if (typeof err === 'object') {
    const candidate =
      err.data ??
      err.errors ??
      err.response?.data?.data ??
      err.response?.data?.errors ??
      err.response?.data ??
      err;

    if (candidate && typeof candidate === 'object') {
      Object.keys(candidate).forEach(k => {
        const v = candidate[k];

        if (typeof v === 'string') {
          out.push({
            field: k,
            message: v,
          });
        } else if (Array.isArray(v) && v.length > 0) {
          out.push({
            field: k,
            message: String(v[0]),
          });
        } else if (v && typeof v === 'object' && v.message) {
          out.push({
            field: k,
            message: String(v.message),
          });
        }
      });
    }
  }

  return out;
}

function extractApiErrorMessage(err: any): string {
  if (!err) return 'Lỗi không xác định';

  try {
    if (typeof err === 'string') {
      try {
        const p = JSON.parse(err);

        if (p && (p.message || p.msg || p.error)) {
          return String(p.message ?? p.msg ?? p.error);
        }
      } catch {
        return err;
      }
    }

    if (typeof err === 'object') {
      if (err.message) return String(err.message);
      if (err.error) return String(err.error);

      if (err.data && typeof err.data === 'string') {
        try {
          const p = JSON.parse(err.data);
          if (p.message) return String(p.message);
        } catch {}

        return String(err.data);
      }

      if (err.response && err.response.data) {
        const d = err.response.data;

        if (typeof d === 'string') {
          try {
            const p = JSON.parse(d);
            if (p.message) return String(p.message);
          } catch {}

          return d;
        }

        if (d.message) return String(d.message);
        if (d.error) return String(d.error);
      }
    }
  } catch {}

  try {
    return String(JSON.stringify(err));
  } catch {
    return 'Lỗi không xác định';
  }
}

function formatValidationMessage(detail: {
  field: string;
  message: string;
}): string {
  return translateApiMessage(detail.message);
}

function translateApiMessage(message: string): string {
  if (!message) return 'Đã xảy ra lỗi. Vui lòng thử lại.';

  const text = message.toLowerCase();

  if (
    text.includes('trainee profile') &&
    (text.includes('already exist') ||
      text.includes('already exists') ||
      text.includes('exists'))
  ) {
    return 'Hồ sơ cá nhân đã tồn tại cho tài khoản này.';
  }

  if (
    text.includes('profile already exist') ||
    text.includes('profile already exists')
  ) {
    return 'Hồ sơ cá nhân đã tồn tại.';
  }

  if (text.includes('trainee profile not found')) {
    return 'Không tìm thấy hồ sơ cá nhân.';
  }

  if (text.includes('trainee profile')) {
    return 'Hồ sơ cá nhân không hợp lệ.';
  }

  if (text.includes('age must not be null')) {
    return 'Tuổi không được để trống.';
  }

  if (text.includes('age')) {
    if (text.includes('must not be null') || text.includes('required')) {
      return 'Tuổi không được để trống.';
    }

    if (text.includes('invalid')) {
      return 'Tuổi không hợp lệ.';
    }
  }

  if (text.includes('gender')) {
    if (text.includes('must not be null') || text.includes('required')) {
      return 'Giới tính không được để trống.';
    }

    if (text.includes('invalid')) {
      return 'Giới tính không hợp lệ.';
    }
  }

  if (text.includes('full name') || text.includes('fullname')) {
    if (text.includes('must not be null') || text.includes('required')) {
      return 'Họ và tên không được để trống.';
    }

    if (text.includes('invalid')) {
      return 'Họ và tên không hợp lệ.';
    }
  }

  if (text.includes('workout level')) {
    return 'Mức độ tập luyện không hợp lệ hoặc đang bị thiếu.';
  }

  if (text.includes('workout frequency')) {
    return 'Tần suất tập luyện không hợp lệ hoặc đang bị thiếu.';
  }

  if (text.includes('must not be null')) {
    return 'Thông tin bắt buộc không được để trống.';
  }

  if (text.includes('required')) {
    return 'Vui lòng nhập đầy đủ thông tin bắt buộc.';
  }

  if (text.includes('unauthorized') || text.includes('401')) {
    return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
  }

  if (text.includes('forbidden') || text.includes('403')) {
    return 'Bạn không có quyền thực hiện thao tác này.';
  }

  if (text.includes('not found') || text.includes('404')) {
    return 'Không tìm thấy dữ liệu phù hợp.';
  }

  if (text.includes('network')) {
    return 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra mạng.';
  }

  if (text.includes('timeout')) {
    return 'Kết nối quá lâu. Vui lòng thử lại.';
  }

  return message;
}

export default OnboardingScreen;