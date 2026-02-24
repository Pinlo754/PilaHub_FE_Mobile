import { ProgramType } from '../utils/RoadmapType';

export const programMock: ProgramType[] = [
  {
    roadmap_id: 'rd_001',
    name: 'Beginner Full Body',
    goal: 'Tăng sức bền và làm quen với luyện tập',
    target_trainee: 'Người mới bắt đầu',
    image_url:
      'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b',
    number_of_programs: 12,
    progress: 45,
    personalStage: [
      {
        stage_id: 'stage_001',
        isCompleted: false,
        personalSchedule: [
          {
            schedule_id: 'schedule_001',
            dateTime: '2026-02-08T07:00:00Z',
            isCompleted: false,
            personalExercise: [
              {
                exercise_id: 'push_up',
                sets: 3,
                reps: 12,
                rest_time: 60,
                isCompleted: false,
              },
              {
                exercise_id: 'squat',
                sets: 3,
                reps: 15,
                rest_time: 60,
                isCompleted: false,
              },
            ],
          },
          {
            schedule_id: 'schedule_002',
            dateTime: '2026-02-10T07:00:00Z',
            isCompleted: false,
            personalExercise: [
              {
                exercise_id: 'plank',
                sets: 3,
                reps: 30,
                rest_time: 45,
                isCompleted: false,
              },
            ],
          },
        ],
      },
    ],
  },
  {
    roadmap_id: 'rd_002',
    name: 'Fat Loss Program',
    goal: 'Đốt mỡ và cải thiện vóc dáng',
    target_trainee: 'Người muốn giảm cân',
    image_url:
      'https://images.unsplash.com/photo-1599058917212-d750089bc07c',
    number_of_programs: 10,
    progress: 70,
    personalStage: [
      {
        stage_id: 'stage_002',
        isCompleted: false,
        personalSchedule: [
          {
            schedule_id: 'schedule_003',
            dateTime: '2026-02-09T06:30:00Z',
            isCompleted: true,
            personalExercise: [
              {
                exercise_id: 'jumping_jack',
                sets: 4,
                reps: 20,
                rest_time: 30,
                isCompleted: true,
              },
              {
                exercise_id: 'burpee',
                sets: 3,
                reps: 10,
                rest_time: 60,
                isCompleted: false,
              },
            ],
          },
        ],
      },
    ],
  },
  {
    roadmap_id: 'rd_003',
    name: 'Muscle Building',
    goal: 'Tăng cơ và sức mạnh',
    target_trainee: 'Người tập trung cấp',
    image_url:
      'https://images.unsplash.com/photo-1605296867304-46d5465a13f1',
    number_of_programs: 16,
    progress: 30,
    personalStage: [
      {
        stage_id: 'stage_003',
        isCompleted: false,
        personalSchedule: [
          {
            schedule_id: 'schedule_004',
            dateTime: '2026-02-11T17:00:00Z',
            isCompleted: false,
            personalExercise: [
              {
                exercise_id: 'bench_press',
                sets: 4,
                reps: 8,
                rest_time: 90,
                isCompleted: false,
              },
              {
                exercise_id: 'deadlift',
                sets: 4,
                reps: 6,
                rest_time: 120,
                isCompleted: false,
              },
            ],
          },
        ],
      },
    ],
  },
  {
    roadmap_id: 'rd_004',
    name: 'Home Workout',
    goal: 'Tập luyện tại nhà không cần dụng cụ',
    target_trainee: 'Người bận rộn',
    image_url:
      'https://images.unsplash.com/photo-1594737625785-c6152b7c3b9d',
    number_of_programs: 8,
    progress: 55,
    personalStage: [
      {
        stage_id: 'stage_004',
        isCompleted: true,
        personalSchedule: [
          {
            schedule_id: 'schedule_005',
            dateTime: '2026-02-07T19:00:00Z',
            isCompleted: true,
            personalExercise: [
              {
                exercise_id: 'mountain_climber',
                sets: 3,
                reps: 20,
                rest_time: 30,
                isCompleted: true,
              },
            ],
          },
        ],
      },
    ],
  },
  {
    roadmap_id: 'rd_005',
    name: 'Advanced Strength',
    goal: 'Tối ưu sức mạnh và hiệu suất',
    target_trainee: 'Người tập nâng cao',
    image_url:
      'https://images.unsplash.com/photo-1517836357463-d25dfeac3438',
    number_of_programs: 20,
    progress: 15,
    personalStage: [
      {
        stage_id: 'stage_005',
        isCompleted: false,
        personalSchedule: [
          {
            schedule_id: 'schedule_006',
            dateTime: '2026-02-12T18:00:00Z',
            isCompleted: false,
            personalExercise: [
              {
                exercise_id: 'squat_heavy',
                sets: 5,
                reps: 5,
                rest_time: 180,
                isCompleted: false,
              },
              {
                exercise_id: 'pull_up',
                sets: 4,
                reps: 8,
                rest_time: 120,
                isCompleted: false,
              },
            ],
          },
        ],
      },
    ],
  },
];
