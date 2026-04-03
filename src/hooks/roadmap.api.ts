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
    const res = await axios.get(`/personal-stage-supplements/roadmap/${roadmapId}`);
    const data = res.data?.data ?? res.data ?? [];
    return Array.isArray(data) ? data : [];
  },

  // New: product endpoints for shop-ready ProductDto lists (paginated)
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
};

export default RoadmapApi;
