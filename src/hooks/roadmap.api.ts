import axios from './axiosInstance';

export const RoadmapApi = {
  getNewest: async (): Promise<any> => {
    const res = await axios.get('/roadmaps/newest');
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
};

export default RoadmapApi;