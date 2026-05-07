import { LevelType } from './CourseType';

export enum PackageType {
  MEMBER = 'MEMBER',
  VIP_MEMBER = 'VIP_MEMBER',
}

export const EXERCISE_TYPE = {
  CORE_STRENGTHENING: 'CORE_STRENGTHENING',
  PELVIC_FLOOR_ENGAGEMENT: 'PELVIC_FLOOR_ENGAGEMENT',
  SPINAL_ARTICULATION: 'SPINAL_ARTICULATION',
  SPINAL_FLEXION: 'SPINAL_FLEXION',
  SPINAL_EXTENSION: 'SPINAL_EXTENSION',
  SPINAL_ROTATION_TWIST: 'SPINAL_ROTATION_TWIST',
  LATERAL_FLEXION: 'LATERAL_FLEXION',
  HIP_WORK: 'HIP_WORK',
  LEG_STRENGTHENING: 'LEG_STRENGTHENING',
  SHOULDER_STABILIZATION: 'SHOULDER_STABILIZATION',
  ARM_STRENGTHENING: 'ARM_STRENGTHENING',
  BALANCE_STABILITY: 'BALANCE_STABILITY',
  FLEXIBILITY_STRETCHING: 'FLEXIBILITY_STRETCHING',
  BREATHING_RELAXATION: 'BREATHING_RELAXATION',
  FULL_BODY_INTEGRATION: 'FULL_BODY_INTEGRATION',
} as const;

export type ExerciseTypeEnum =
  (typeof EXERCISE_TYPE)[keyof typeof EXERCISE_TYPE];

export const BREATHING_RULE = {
  INHALE_ON_EFFORT: 'INHALE_ON_EFFORT',
  EXHALE_ON_EFFORT: 'EXHALE_ON_EFFORT',
  NASAL_BREATHING: 'NASAL_BREATHING',
  MOUTH_BREATHING: 'MOUTH_BREATHING',
  BOX_BREATHING: 'BOX_BREATHING',
  DIAPHRAGMATIC: 'DIAPHRAGMATIC',
  RHYTHMIC: 'RHYTHMIC',
  HOLD_BREATH: 'HOLD_BREATH',
  FREE_BREATHING: 'FREE_BREATHING',
} as const;

export type BreathingRuleType =
  (typeof BREATHING_RULE)[keyof typeof BREATHING_RULE];

  export const BODY_PART = {
  Head: "Head",
  Neck: "Neck",
  CervicalSpine: "Cervical Spine",
  ThoracicSpine: "Thoracic Spine",
  LumbarSpine: "Lumbar Spine",
  Core: "Core",
  Shoulders: "Shoulders",
  UpperBack: "Upper Back",
  LowerBack: "Lower Back",
  Chest: "Chest",
  UpperArms: "Upper Arms",
  Elbows: "Elbows",
  Forearms: "Forearms",
  Wrists: "Wrists",
  Hands: "Hands",
  Hips: "Hips",
  Glutes: "Glutes",
  Thighs: "Thighs",
  Knees: "Knees",
  Calves: "Calves",
  Ankles: "Ankles",
  Feet: "Feet",
} as const;

export type BodyPartNameType =
  (typeof BODY_PART)[keyof typeof BODY_PART];

export type BodyPartType = {
  bodyPartId: string;
  name: string;
  description: string | null;
};

export type ExerciseType = {
  exerciseId: string;
  name: string;
  imageUrl: string;
  description: string;
  exerciseType: ExerciseTypeEnum;
  difficultyLevel: LevelType;
  bodyParts: BodyPartType[] | null;
  equipmentRequired: boolean;
  benefits: string;
  prerequisites: string | null;
  contraindications: string | null;
  active: boolean;
  duration: number;
  haveAIsupported: boolean;
  nameInModelAI: string | null;
  havePracticed: boolean;
  breathingRule: BreathingRuleType;
};

export type TutorialType = {
  tutorialId: string;
  exerciseId: string;
  practiceVideoUrl: string;
  theoryVideoUrl: string;
  commonMistakes: string;
  guidelines: string;
  breathingTechnique: string;
  published: boolean;
};
