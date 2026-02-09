import { ListTab } from '../constants/listTab';
import { CourseType } from './CourseType';
import { ExerciseType } from './ExerciseType';

export type TabTypeMap = {
  [ListTab.Exercise]: ExerciseType;
  [ListTab.Course]: CourseType;
};
