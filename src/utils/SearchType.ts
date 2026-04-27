import { SearchTab } from '../constants/searchTab';
import { CoachType } from './CoachType';
import { CourseWithEnroll } from './CourseType';
import { ExerciseType } from './ExerciseType';

export type TabTypeMap = {
  [SearchTab.Exercise]: ExerciseType;
  [SearchTab.Course]: CourseWithEnroll;
  [SearchTab.Coach]: CoachType;
};
