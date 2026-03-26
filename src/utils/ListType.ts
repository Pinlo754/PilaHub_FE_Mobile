import { ListTab } from '../constants/listTab';
import { ExerciseType } from './ExerciseType';
import { TraineeCourseType } from './TraineeCourseType';

export type TabTypeMap = {
  [ListTab.Exercise]: ExerciseType;
  [ListTab.Course]: TraineeCourseType;
};
