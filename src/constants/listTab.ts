import { RootStackParamList } from '../navigation/AppNavigator';
import CardCourse from '../screens/Search/components/CardCourse';
import CardExercise from '../screens/Search/components/CardExercise';
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
  paramKey: string;
  idKey: string;
};

export const LIST_CONFIG: { [K in ListTab]: TabConfigItem<K> } = {
  [ListTab.Exercise]: {
    Card: CardExercise,
    screen: 'ExerciseDetail',
    paramKey: 'exercise_id',
    idKey: 'exerciseId',
  },
  [ListTab.Course]: {
    Card: CardCourse,
    screen: 'ProgramDetail',
    paramKey: 'program_id',
    idKey: 'courseId',
  },
};
