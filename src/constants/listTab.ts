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
  getParams: (item: TabTypeMap[K], extra?: { traineeId?: string }) => object;
  idKey: string;
  emptyTitle: string;
  emptySubtitle: string;
  emptyIcon: string;
};

export const LIST_CONFIG: { [K in ListTab]: TabConfigItem<K> } = {
  [ListTab.Exercise]: {
    Card: CardExercise,
    screen: 'ExerciseDetail',
    idKey: 'exerciseId',
    getParams: item => ({
      exercise_id: item.exerciseId,
    }),
    emptyTitle: 'Chưa có bài tập nào',
    emptySubtitle: 'Hãy khám phá và bắt đầu luyện tập ngay!',
    emptyIcon: 'barbell-outline',
  },

  [ListTab.Course]: {
    Card: CardCourse,
    screen: 'ProgramDetail',
    idKey: 'traineeCourseId',
    getParams: (item, extra) => ({
      traineeCourseId: item.traineeCourseId,
      program_id: item.course.courseId,
      traineeId: extra?.traineeId,
      source: 'List',
    }),
    emptyTitle: 'Chưa có khóa học nào',
    emptySubtitle: 'Mua khóa học để bắt đầu hành trình luyện tập ngay!',
    emptyIcon: 'book-outline',
  },
};
