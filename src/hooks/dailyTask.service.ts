import api from '../hooks/axiosInstance';

export type Coach = {
  coachId?: string;
  fullName?: string;
  avatarUrl?: string;
  avgRating?: number;
  pricePerHour?: number;
};

export type Trainee = {
  traineeId?: string;
  fullName?: string;
  avatarUrl?: string;
};

export type RoadmapScheduleTask = {
  personalScheduleId: string;
  personalStageId?: string;
  roadmapId?: string;
  scheduleName?: string;
  description?: string;
  dayOfWeek?: string;
  scheduledDate?: string;
  durationMinutes?: number;
  completed?: boolean;
  completedAt?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type BookingTask = {
  id: string;
  coach?: Coach;
  trainee?: Trainee;
  startTime?: string;
  endTime?: string;
  pricePerHour?: number;
  totalAmount?: number;
  status?: string;
  bookingType?: string;
  recurringGroupId?: string;
  createdAt?: string;
  personalSchedule?: RoadmapScheduleTask;
};

export type Course = {
  courseId?: string;
  name?: string;
  description?: string;
  imageUrl?: string;
  level?: string;
  price?: number;
  active?: boolean;
  totalLesson?: number;
  createdAt?: string;
  updatedAt?: string;
};

export type TraineeCourse = {
  traineeCourseId?: string;
  course?: Course;
  progressPercentage?: number;
  active?: boolean;
};

export type CourseLesson = {
  courseLessonId?: string;
  courseId?: string;
  courseName?: string;
  lessonId?: string;
  lessonName?: string;
  displayOrder?: number;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type CourseScheduleTask = {
  progressId: string;
  traineeCourse?: TraineeCourse;
  courseLesson?: CourseLesson;
  startedAt?: string;
  completedAt?: string;
  completed?: boolean;
};

export type DailyTaskApiData = {
  date: string;
  startOfDay?: string;
  endOfDay?: string;
  bookings?: BookingTask[];
  roadmapSchedules?: RoadmapScheduleTask[];
  courseSchedules?: CourseScheduleTask[];
};

export type DailyTaskItem = {
  id: string;
  type: 'BOOKING' | 'ROADMAP' | 'COURSE';
  title: string;
  subtitle?: string;
  time?: string;
  imageUrl?: string;
  completed: boolean;
  raw: BookingTask | RoadmapScheduleTask | CourseScheduleTask;
};

type DailyTaskResponse = {
  success: boolean;
  message?: string;
  data?: DailyTaskApiData;
  errorCode?: string;
  timestamp?: number;
};

const formatTime = (dateString?: string) => {
  if (!dateString) return '';

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) return '';

  return date.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getBookingStatusLabel = (status?: string) => {
  switch (status) {
    case 'SCHEDULED':
      return 'Đã lên lịch';

    case 'COMPLETED':
      return 'Đã hoàn thành';

    case 'CANCELLED':
      return 'Đã hủy';

    case 'PENDING':
      return 'Đang chờ';

    default:
      return 'Lịch hẹn cá nhân';
  }
};

const mapDailyTasks = (data?: DailyTaskApiData): DailyTaskItem[] => {
  if (!data) return [];

  const bookings: DailyTaskItem[] = (data.bookings ?? []).map(item => {
    const start = formatTime(item.startTime);
    const end = formatTime(item.endTime);

    return {
      id: item.id,
      type: 'BOOKING',
      title: `Lịch hẹn với ${item.coach?.fullName || 'HLV'}`,
      subtitle: getBookingStatusLabel(item.status),
      time: start && end ? `${start} - ${end}` : 'Hôm nay',
      imageUrl: item.coach?.avatarUrl,
      completed: item.status === 'COMPLETED',
      raw: item,
    };
  });

  const roadmaps: DailyTaskItem[] = (
    data.roadmapSchedules ?? []
  ).map(item => ({
    id: item.personalScheduleId,
    type: 'ROADMAP',
    title: item.scheduleName || 'Bài tập hôm nay',
    subtitle: item.description || 'Lộ trình cá nhân',
    time: item.durationMinutes
      ? `${item.durationMinutes} phút`
      : formatTime(item.scheduledDate) || 'Hôm nay',
    completed: Boolean(item.completed),
    raw: item,
  }));

  const courses: DailyTaskItem[] = (
    data.courseSchedules ?? []
  ).map(item => ({
    id: item.progressId,
    type: 'COURSE',
    title:
      item.courseLesson?.lessonName ||
      item.traineeCourse?.course?.name ||
      'Bài học hôm nay',

    subtitle:
      item.traineeCourse?.course?.name ||
      item.courseLesson?.courseName ||
      'Khóa học',

    time: item.courseLesson?.displayOrder
      ? `Bài ${item.courseLesson.displayOrder}`
      : 'Hôm nay',

    imageUrl: item.traineeCourse?.course?.imageUrl,
    completed: Boolean(item.completed),
    raw: item,
  }));

  return [...bookings, ...roadmaps, ...courses]
    .filter(item => item?.id)
    .sort((a, b) => {
      if (a.completed === b.completed) return 0;

      return a.completed ? 1 : -1;
    });
};

export const dailyTaskService = {
  getDailyTasks: async (date?: string): Promise<DailyTaskItem[]> => {
    const res = await api.get<DailyTaskResponse>(
      '/trainees/daily-tasks',
      {
        params: date ? { date } : undefined,
      },
    );

    if (!res.data?.success) {
      throw new Error(
        res.data?.message || 'Không thể tải nhiệm vụ hôm nay',
      );
    }

    return mapDailyTasks(res.data.data);
  },
};