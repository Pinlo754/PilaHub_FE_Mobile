import { create } from 'zustand';

export type GenderType = 'male' | 'female';

export type WeightUnitType = 'kg' | 'lb';

export type HeightUnitType = 'cm';

export type WorkoutFrequencyType =
  | 'SEDENTARY'
  | 'LIGHT'
  | 'MODERATE'
  | 'ACTIVE'
  | 'ATHLETE';

export type WorkoutLevelType =
  | 'BEGINNER'
  | 'INTERMEDIATE'
  | 'ADVANCED';

export type OnboardingData = {
  // =========================
  // BASIC PROFILE
  // =========================
  fullName?: string;
  email?: string;
  phone?: string;
  avatar?: string;
  avatarUrl?: string;

  gender?: GenderType;
  age?: number;

  // =========================
  // BODY INFO
  // =========================
  height?: number;
  heightUnit?: HeightUnitType;

  weight?: number;
  weightUnit?: WeightUnitType;

  // =========================
  // BODYGRAM
  // =========================
  frontPhotoUri?: string;
  sidePhotoUri?: string;

  // =========================
  // BODY MEASUREMENTS
  // =========================
  shoulder?: number;
  waist?: number;
  bust?: number;
  hip?: number;
  thigh?: number;
  bicep?: number;
  calf?: number;

  // =========================
  // HEALTH STATS
  // =========================
  bodyFatPercent?: number;
  muscleMass?: number;
  bmi?: number;

  // =========================
  // WORKOUT
  // =========================
  workoutFrequency?: WorkoutFrequencyType;
  workoutLevel?: WorkoutLevelType;

  // =========================
  // SERVER
  // =========================
  traineeId?: string;

  // =========================
  // INTERNAL FLOW FLAGS
  // =========================
  traineeProfileCompleted?: boolean;
  healthProfileCompleted?: boolean;

  notes?: string;
};

type OnboardingState = {
  step: number;

  data: OnboardingData;

  setStep: (step: number) => void;

  nextStep: () => void;

  prevStep: () => void;

  setData: (
    data: Partial<OnboardingData>,
  ) => void;

  reset: () => void;

  hydrateFromTraineeProfile: (
    profile: any,
  ) => void;
};

const initialData: OnboardingData = {
  heightUnit: 'cm',
  weightUnit: 'kg',
  traineeProfileCompleted: false,
  healthProfileCompleted: false,
};

export const useOnboardingStore =
  create<OnboardingState>((set, get) => ({
    step: 0,

    data: initialData,

    // =========================
    // STEP
    // =========================
    setStep: (step) => {
      set({
        step,
      });
    },

    nextStep: () => {
      const current = get().step;

      set({
        step: current + 1,
      });
    },

    prevStep: () => {
      const current = get().step;

      set({
        step:
          current > 0 ? current - 1 : 0,
      });
    },

    // =========================
    // DATA
    // =========================
    setData: (newData) => {
      set((state) => ({
        data: {
          ...state.data,
          ...newData,
        },
      }));
    },

    // =========================
    // RESET
    // =========================
    reset: () => {
      set({
        step: 0,
        data: initialData,
      });
    },

    // =========================
    // HYDRATE FROM TRAINEE
    // =========================
    hydrateFromTraineeProfile: (
      profile: any,
    ) => {
      if (!profile) return;

      const genderRaw = String(
        profile?.gender ?? '',
      ).toUpperCase();

      const gender:
        | GenderType
        | undefined =
        genderRaw === 'MALE'
          ? 'male'
          : genderRaw === 'FEMALE'
          ? 'female'
          : undefined;

      set((state) => ({
        data: {
          ...state.data,

          traineeId:
            profile?.traineeId ??
            profile?.id ??
            state.data.traineeId,

          fullName:
            profile?.fullName ??
            state.data.fullName,

          avatarUrl:
            profile?.avatarUrl ??
            state.data.avatarUrl,

          gender:
            gender ??
            state.data.gender,

          age:
            profile?.age ??
            state.data.age,

          workoutLevel:
            profile?.workoutLevel ??
            state.data.workoutLevel,

          workoutFrequency:
            profile?.workoutFrequency ??
            state.data.workoutFrequency,

          traineeProfileCompleted: true,
        },
      }));
    },
  }));