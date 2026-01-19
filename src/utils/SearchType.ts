import { SearchTab } from '../constants/searchTab';
import { CoachType } from './CoachType';
import { CourseType } from './CourseType';
import { ExerciseType } from './ExerciseType';

export type TabDataMap = {
  [SearchTab.Exercise]: ExerciseType;
  [SearchTab.Course]: CourseType;
  [SearchTab.Coach]: CoachType;
};
