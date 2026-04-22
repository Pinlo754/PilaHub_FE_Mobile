import React, { useEffect, useState, useRef } from 'react'
import GenderUI from './steps/gender/Gender.ui'
import { useOnboardingStore } from '../../store/onboarding.store'
import { loadOnboarding, saveOnboarding, clearOnboarding } from '../../utils/storage'
import { SafeAreaView } from 'react-native-safe-area-context'
import AgeUI from './steps/age/Age.ui'
import WeightUI from './steps/weight/Weight.ui'
import HeightUI from './steps/height/Height.ui'
import WorkoutUI from './steps/workout/Workout.ui'
import { useNavigation } from '@react-navigation/native';
import InjuryUI from './steps/injury/Injury.ui'
import InformationUI from './steps/infor/Information.ui'
import { submitTraineeProfile } from '../../services/profile';
import LoadingOverlay from '../../components/LoadingOverlay';
import { Alert } from 'react-native';
const STEPS = [
  GenderUI,
  AgeUI,
  WeightUI,
  HeightUI,
  InformationUI,
  WorkoutUI,
  InjuryUI,
  // Target step removed — goal selection moved to CreateRoadmap
]

const OnboardingScreen = () => {
  const {step, data, setStep, setData, reset} = useOnboardingStore();
  const navigation = useNavigation<any>();
  const StepComponent = STEPS[step];

  const [creatingTrainee, setCreatingTrainee] = useState(false);
  const prevStepRef = useRef<number>(step);
  const INJURY_STEP = STEPS.indexOf(InjuryUI);

  useEffect(() => {
    loadOnboarding().then((saved) => {
      if (saved) {
        setData(saved.data);
        setStep(saved.step ?? 0);
      }
    });
  }, [setData,setStep]);

  useEffect(() => {
    // if step index is out of range (e.g. user advanced past last step), finish onboarding
    if (step >= STEPS.length) {
      // ensure persisted onboarding cleared so next time a new user starts fresh
      try { clearOnboarding(); } catch {}
      // navigate into BodyGram flow (InputBody) after finishing onboarding
      navigation.replace('InputBody' as any);
      return;
    }
    saveOnboarding({step, data});
  }, [step, data, navigation]);

  useEffect(() => {
    // if this component mounts and there's no step saved, ensure we start at step 0
    if (step == null) {
      reset();
    }
  }, [reset, step]);

  // When user advances into the Injury step, ensure a trainee profile exists on the server.
  // If creation fails, revert to previous step and show an error alert. This enforces the sequence:
  // create trainee profile -> save injuries -> body-scan/input
  useEffect(() => {
    const prev = prevStepRef.current ?? 0;
    // detect forward navigation into Injury step
    if (step > prev && step === INJURY_STEP) {
      (async () => {
        try {
          // BEFORE calling API: client-side required-field check
          const missingFields: string[] = [];
          try {
            if (!((data as any)?.gender)) missingFields.push('gender');
            if (((data as any)?.age == null)) missingFields.push('age');
            if (!((data as any)?.fullName)) missingFields.push('fullName');
            if (!((data as any)?.workoutLevel)) missingFields.push('workoutLevel');
            if (!((data as any)?.workoutFrequency)) missingFields.push('workoutFrequency');
          } catch {}

          if (missingFields.length > 0) {
            // build user-friendly messages and navigate to first missing step
            const labels: Record<string, string> = { gender: 'Giới tính', age: 'Tuổi', fullName: 'Họ và tên', workoutLevel: 'Mức độ tập luyện', workoutFrequency: 'Tần suất tập luyện' };
            const msgs = missingFields.map((f) => `${labels[f] ?? f} bị thiếu`).join('\n');
            try { Alert.alert('Thiếu thông tin bắt buộc', msgs, [{ text: 'OK' }]); } catch {}
            const first = missingFields[0];
            const targetStep = FIELD_TO_STEP[first] ?? 0;
            try { setStep(targetStep); } catch {}
            return;
          }

          setCreatingTrainee(true);
          const res = await submitTraineeProfile(data as any);
          if (res.ok) {
            // persist trainee id into onboarding store if returned
            const id = res.data?.id ?? (res.data && res.data.profileId) ?? res.data?.traineeId ?? null;
            if (id) setData({ traineeId: id });

            // nicer success popup
            try {
              Alert.alert('Tạo hồ sơ thành công', 'Hồ sơ cá nhân đã được lưu. Mời bạn tiếp tục chọn chấn thương.', [{ text: 'Tiếp tục' }]);
            } catch {}
          } else {
            // parse validation details first
            const details = parseValidationDetails(res.error);
            if (details.length > 0) {
              const first = details[0];
              try { Alert.alert('Lỗi xác thực', `${first.field}: ${first.message}`, [{ text: 'OK' }]); } catch {}
              const targetStep = FIELD_TO_STEP[first.field] ?? prev;
              try { setStep(targetStep); } catch {}
            } else {
              const friendly = extractApiErrorMessage(res.error);
              const low = (friendly || '').toLowerCase();

              // treat "already exists" as non-blocking: show friendly notice and allow continue
              if (low.includes('already exist') || low.includes('already exists') || low.includes('exists')) {
                try { Alert.alert('Hồ sơ đã tồn tại', 'Hồ sơ cá nhân đã tồn tại cho tài khoản này. Bạn có thể tiếp tục.', [{ text: 'Tiếp tục' }]); } catch {}
              } else {
                try { Alert.alert('Lỗi khi tạo hồ sơ', friendly, [{ text: 'OK' }]); } catch {}
                try { setStep(prev); } catch {}
              }
            }
          }
        } catch (err: any) {
          const details = parseValidationDetails(err);
          if (details.length > 0) {
            const first = details[0];
            try { Alert.alert('Lỗi xác thực', `${first.field}: ${first.message}`, [{ text: 'OK' }]); } catch {}
            const targetStep = FIELD_TO_STEP[first.field] ?? prev;
            try { setStep(targetStep); } catch {}
          } else {
            const friendly = extractApiErrorMessage(err);
            try { Alert.alert('Lỗi', `Không thể tạo hồ sơ: ${friendly}`, [{ text: 'OK' }]); } catch {}
            try { setStep(prev); } catch {}
          }
        } finally {
          setCreatingTrainee(false);
        }
      })();
    }
    prevStepRef.current = step;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, data]);

  if (!StepComponent) {
    // avoid rendering undefined component
    return null;
  }

  return (
  <SafeAreaView className='flex-1 bg-background justify-center items-center px-6'>
    <StepComponent />
    {creatingTrainee ? <LoadingOverlay /> : null}
  </SafeAreaView>
  )
}

// map field names to onboarding step indexes so we can navigate user to fix
const FIELD_TO_STEP: Record<string, number> = {
  gender: 0,
  age: 1,
  fullName: 4, // InformationUI
  workoutLevel: 5,
  workoutFrequency: 5,
};

function parseValidationDetails(err: any): Array<{ field: string; message: string }> {
  const out: Array<{ field: string; message: string }> = [];
  if (!err) return out;
  // case: server returns object with validation messages at top-level (e.g., { age: 'Age must not be null' })
  if (typeof err === 'object') {
    // some APIs wrap in .data or .errors
    const candidate = err.data ?? err.errors ?? err;
    if (candidate && typeof candidate === 'object') {
      Object.keys(candidate).forEach((k) => {
        const v = candidate[k];
        if (typeof v === 'string') out.push({ field: k, message: v });
        else if (Array.isArray(v) && v.length > 0) out.push({ field: k, message: String(v[0]) });
        else if (v && typeof v === 'object' && v.message) out.push({ field: k, message: String(v.message) });
      });
    }
  }
  return out;
}

// helper: extract friendly message text from various API error shapes
function extractApiErrorMessage(err: any): string {
  if (!err) return 'Lỗi không xác định';
  try {
    if (typeof err === 'string') {
      // try parse JSON string
      try {
        const p = JSON.parse(err);
        if (p && (p.message || p.msg || p.error || p.message)) return String(p.message ?? p.msg ?? p.error ?? JSON.stringify(p));
      } catch {
        // not JSON
        return err;
      }
    }
    if (typeof err === 'object') {
      if (err.message) return String(err.message);
      if (err.error) return String(err.error);
      if (err.data && typeof err.data === 'string') {
        try { const p = JSON.parse(err.data); if (p.message) return String(p.message); } catch {}
        return String(err.data);
      }
      if (err.response && err.response.data) {
        const d = err.response.data;
        if (typeof d === 'string') {
          try { const p = JSON.parse(d); if (p.message) return String(p.message); } catch {}
          return d;
        }
        if (d.message) return String(d.message);
        if (d.error) return String(d.error);
      }
    }
  } catch (e) {
    // fallback
  }
  try { return String(JSON.stringify(err)); } catch { return 'Lỗi không xác định'; }
}

export default OnboardingScreen