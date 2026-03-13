import { ApiResponse } from '../utils/ApiResType';
import { RoadmapRequestGenerate } from '../utils/RoadmapType';
import api from './axiosInstance';

export const RoadmapServices = {
    generateRoadmap: async (
        payload: RoadmapRequestGenerate,
    ): Promise<[]> => {
        const res = await api.post<ApiResponse<[]>>(
            `/roadmaps/ai-generate`,
            payload,
        );

        if (!res.data.success) {
            throw {
                type: 'BUSINESS_ERROR',
                message: res.data.message,
                errorCode: res.data.errorCode,
            };
        }

        return res.data.data;
    },

    saveRoadmap: async (
        payload: any,
    ): Promise<any> => {
        const res = await api.post<ApiResponse<any>>(
            `/roadmaps/ai-generated/accept`,
            payload,
        );

        if (!res.data.success) {
            throw {
                type: 'BUSINESS_ERROR',
                message: res.data.message,
                errorCode: res.data.errorCode,
            };
        }
        return res.data.data;
    },
};
