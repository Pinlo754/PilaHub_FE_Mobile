import { RootStackParamList } from '../navigation/AppNavigator';
import CardCourse from '../screens/List/components/CardCourse';
import CardExercise from '../screens/List/components/CardExercise';
import { TabTypeMap } from '../utils/ListType';

export enum ListTab {
  Exercise = 1,
  Course = 2,
}

type TabConfigItem<K extends ListTab> = {
  Card: React.FC<{
    item: TabTypeMap[K];
    onPress?: () => void;
  }>;
  screen: keyof RootStackParamList;
  getParams: (item: TabTypeMap[K]) => object;
  idKey: string;
};

export const LIST_CONFIG: { [K in ListTab]: TabConfigItem<K> } = {
  [ListTab.Exercise]: {
    Card: CardExercise,
    screen: 'ExerciseDetail',
    idKey: 'exercise_id',
    getParams: item => ({
      exercise_id: item.exerciseId,
    }),
  },

  [ListTab.Course]: {
    Card: CardCourse,
    screen: 'ProgramDetail',
    idKey: 'traineeCourseId',
    getParams: item => ({
      traineeCourseId: item.traineeCourseId,
      program_id: item.course.courseId,
    }),
  },
};
