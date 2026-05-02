import { LevelType } from './CourseType';

export enum PackageType {
  MEMBER = 'MEMBER',
  VIP_MEMBER = 'VIP_MEMBER',
}

export type ExerciseTypeEnum =
  | 'CORE_STRENGTHENING'
  | 'PELVIC_FLOOR_ENGAGEMENT'
  | 'SPINAL_ARTICULATION'
  | 'SPINAL_FLEXION'
  | 'SPINAL_EXTENSION'
  | 'SPINAL_ROTATION_TWIST'
  | 'LATERAL_FLEXION'
  | 'HIP_WORK'
  | 'LEG_STRENGTHENING'
  | 'SHOULDER_STABILIZATION'
  | 'ARM_STRENGTHENING'
  | 'BALANCE_STABILITY'
  | 'FLEXIBILITY_STRETCHING'
  | 'BREATHING_RELAXATION'
  | 'FULL_BODY_INTEGRATION';

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
  breathingRule: string;
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
