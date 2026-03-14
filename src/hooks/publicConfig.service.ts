import { ApiResponse } from '../utils/ApiResType';
import api from './axiosInstance';
import { AgoraConfig } from '../utils/PublicConfigType';

export const PublicConfigService = {
  // GET AGORA CONFIG
  getAgoraConfig: async (): Promise<AgoraConfig> => {
    const res = await api.get<ApiResponse<AgoraConfig>>(`/public/config/agora`);

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
