import axios from './axiosInstance';

export type AiGenerateRoadmapPayload = {
  primaryGoalId: string;
  secondaryGoalIds: string[];
  workoutLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  startDate: string;
  trainingDays: string[];
  durationWeeks: number;
};

export type ManualRoadmapExercisePayload = {
  exerciseId: string;
  exerciseOrder: number;
  sets: number;
  reps: number;
  durationSeconds: number;
  restSeconds: number;
  notes?: string;
};

export type ManualRoadmapSchedulePayload = {
  scheduleName: string;
  description: string;
  scheduledDate: string;
  durationMinutes: number;
  exercises: ManualRoadmapExercisePayload[];
};

export type ManualRoadmapStagePayload = {
  stageName: string;
  description: string;
  stageOrder: number;
  startDate: string;
  endDate: string;
  schedules: ManualRoadmapSchedulePayload[];
};

export type CreateManualRoadmapPayload = {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  source: string;
  traineeId?: string;
  primaryGoalId: string;
  secondaryGoalIds: string[];
  stages: ManualRoadmapStagePayload[];
};

export const RoadmapApi = {
  getNewest: async (): Promise<any> => {
    const res = await axios.get('/roadmaps/newest');
    return res.data?.data ?? res.data ?? res;
  },

  getMyRoadmaps: async (params?: {
    title?: string;
    status?: string;
    source?: string;
    startDateFrom?: string;
    startDateTo?: string;
    endDateFrom?: string;
    endDateTo?: string;
    page?: number;
    size?: number;
  }): Promise<any> => {
    const res = await axios.get('/roadmaps/my', {
      params: {
        page: params?.page ?? 0,
        size: params?.size ?? 20,
        title: params?.title,
        status: params?.status,
        source: params?.source,
        startDateFrom: params?.startDateFrom,
        startDateTo: params?.startDateTo,
        endDateFrom: params?.endDateFrom,
        endDateTo: params?.endDateTo,
      },
    });

    return res.data?.data ?? res.data ?? res;
  },

  getRoadmapDetail: async (roadmapId: string): Promise<any> => {
    const res = await axios.get(`/roadmaps/${roadmapId}/with-details`);
    return res.data?.data ?? res.data ?? res;
  },

  
  generateAiRoadmap: async (
    payload: AiGenerateRoadmapPayload,
  ): Promise<any> => {
    const res = await axios.post('/roadmaps/ai-generate', payload);
    return res.data?.data ?? res.data ?? res;
  },

  createWithDetails: async (
    payload: CreateManualRoadmapPayload,
  ): Promise<any> => {
    const res = await axios.post('/roadmaps/with-details', payload);
    return res.data?.data ?? res.data ?? res;
  },

  getEquipment: async (roadmapId: string): Promise<any> => {
    const res = await axios.get(`/equipment/roadmap/${roadmapId}`);
    return res.data?.data ?? res.data ?? res;
  },

  getSupplements: async (roadmapId: string): Promise<any[]> => {
    const res = await axios.get(
      `/personal-stage-supplements/roadmap/${roadmapId}`,
    );
    const data = res.data?.data ?? res.data ?? [];
    return Array.isArray(data) ? data : [];
  },

  getProductEquipments: async (roadmapId: string): Promise<any[]> => {
    const res = await axios.get(`/products/roadmaps/${roadmapId}/equipments`);
    const apiResp = res.data ?? {};
    const pageObj = apiResp.data ?? apiResp;
    const items = pageObj?.content ?? pageObj?.items ?? [];
    return Array.isArray(items) ? items : [];
  },

  getProductSupplements: async (roadmapId: string): Promise<any[]> => {
    const res = await axios.get(`/products/roadmaps/${roadmapId}/supplements`);
    const apiResp = res.data ?? {};
    const pageObj = apiResp.data ?? apiResp;
    const items = pageObj?.content ?? pageObj?.items ?? [];
    return Array.isArray(items) ? items : [];
  },

  getPending: async (): Promise<any> => {
    const res = await axios.get('/roadmaps/my-pending');
    return res.data?.data ?? res.data ?? res;
  },

  getMyCoachRequests: async (): Promise<any> => {
    const res = await axios.get('/coach-roadmap-requests/my-sent');
    return res.data?.data ?? res.data ?? res;
  },

  createBatch: async (payload: any): Promise<any> => {
    const res = await axios.post('/coach-bookings/batch', payload);
    return res.data ?? res;
  },

  approveRoadmap: async (roadmapId: string): Promise<any> => {
    const res = await axios.patch(`/roadmaps/${roadmapId}/approve`);
    return res.data ?? res;
  },

  updateProgress: async (
    roadmapId: string,
    progressPercent: number,
  ): Promise<any> => {
    const res = await axios.patch(`/roadmaps/${roadmapId}/progress`, {
      progressPercent,
    });

    return res.data?.data ?? res.data ?? res;
  },

  updateFinalHealthProfile: async (
    roadmapId: string,
    finalHealthProfileId: string,
  ): Promise<any> => {
    const res = await axios.patch(
      `/roadmaps/${roadmapId}/final-health-profile`,
      {
        finalHealthProfileId,
      },
    );

    return res.data?.data ?? res.data ?? res;
  },

  getRoadmapReview: async (roadmapId: string): Promise<any> => {
  const res = await axios.get(`/roadmap-reviews/roadmap/${roadmapId}`);
  return res.data?.data ?? res.data ?? res;
},

generateRoadmapReview: async (roadmapId: string): Promise<any> => {
  const res = await axios.post(`/roadmap-reviews/generate/${roadmapId}`);
  return res.data?.data ?? res.data ?? res;
},

getMyRoadmap: async (): Promise<any> => {
  const res = await axios.get('/roadmaps/my?page=0&size=1');
  return res.data?.data ?? res.data ?? res;
},

cancelCoachRequest: async (requestId: string): Promise<any> => {
  const res = await axios.delete(`/coach-roadmap-requests/${requestId}/cancel`);
  return res.data ?? res;
},

};

export default RoadmapApi;