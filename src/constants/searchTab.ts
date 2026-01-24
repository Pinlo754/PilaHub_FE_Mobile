import { RootStackParamList } from '../navigation/AppNavigator';
import CardCoach from '../screens/Search/components/CardCoach';
import CardCourse from '../screens/Search/components/CardCourse';
import CardExercise from '../screens/Search/components/CardExercise';
import { TabTypeMap } from '../utils/SearchType';

export enum SearchTab {
  Exercise = 1,
  Course = 2,
  Coach = 3,
}

type TabConfigItem<K extends SearchTab> = {
  Card: React.FC<{
    item: TabTypeMap[K];
    isLast: boolean;
    onPress?: () => void;
  }>;
  screen: keyof RootStackParamList;
  paramKey: string;
  idKey: string;
};

export const SEARCH_CONFIG: { [K in SearchTab]: TabConfigItem<K> } = {
  [SearchTab.Exercise]: {
    Card: CardExercise,
    screen: 'ExerciseDetail',
    paramKey: 'exercise_id',
    idKey: 'exercise_id',
  },
  [SearchTab.Course]: {
    Card: CardCourse,
    screen: 'ExerciseDetail',
    paramKey: 'exercise_id',
    idKey: 'exercise_id',
  },
  [SearchTab.Coach]: {
    Card: CardCoach,
    screen: 'ExerciseDetail',
    paramKey: 'exercise_id',
    idKey: 'exercise_id',
  },
};
