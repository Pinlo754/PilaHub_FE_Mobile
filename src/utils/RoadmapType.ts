export type ProgramType = {
    roadmap_id: string;
    name: string;
    goal: string;
    target_trainee: string;
    image_url: string;
    number_of_programs: number;
    progress: number;
    personalStage: PersonalStageType[];
}

export type PersonalStageType = {
    stage_id: string;
    personalSchedule: personalSchedule[];
    isCompleted: boolean;
}

export type personalSchedule = {
    schedule_id: string;
    dateTime: string;
    personalExercise: personalExercise[];
    isCompleted: boolean;
}

export type personalExercise = {
    exercise_id: string;
    sets: number;
    reps: number;
    rest_time: number;
    isCompleted: boolean;
}