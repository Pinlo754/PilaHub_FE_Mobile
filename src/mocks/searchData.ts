import { SearchTab } from '../constants/searchTab';
import { TabTypeMap } from '../utils/SearchType';

export const exerciseMock: TabTypeMap[SearchTab.Exercise][] = [
  {
    exercise_id: '1',
    name: 'Mat Cơ Bản',
    description:
      'Hướng dẫn thực hành các động tác Pilates cơ bản, tập trung vào tư thế đúng, nhịp thở và kiểm soát chuyển động, giúp người tập làm quen và thực hiện bài tập một cách an toàn, hiệu quả.',
    default_duration_sec: 318,
    image_url: 'https://cdn.mos.cms.futurecdn.net/RSRmmWZGBcNnLLynabFD2Z.jpg',
  },
];

export const courseMock: TabTypeMap[SearchTab.Course][] = [
  {
    course_id: '1',
    course_name: 'Yoga Cơ Bản',
    thumbnail_url:
      'https://cdn.mos.cms.futurecdn.net/RSRmmWZGBcNnLLynabFD2Z.jpg',
    total_lessons: 10,
  },
];

export const coachMock: TabTypeMap[SearchTab.Coach][] = [
  {
    coach_id: '1',
    full_name: 'Amanda Gilbert',
    avatar: 'https://cdn.mos.cms.futurecdn.net/RSRmmWZGBcNnLLynabFD2Z.jpg',
    rating_avg: 4.8,
    experience_years: 1,
  },
];
