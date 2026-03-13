import api from '../hooks/axiosInstance';
import { ApiResponse } from '../utils/ApiResType';
import AsyncStorage from '@react-native-async-storage/async-storage';
export const CoachService = {
  
  getAll : async () => {
    const res = await api.get<ApiResponse<[]>>(`/coaches`);
    if (!res.data.success) {
      throw {
        type: 'BUSINESS_ERROR',
        message: res.data.message,
        errorCode: res.data.errorCode,
      };
    }
    return res.data.data;
  },

  getSchedules: async () => {
    const id = await AsyncStorage.getItem('id').then((val) => val?.replace(/"/g, ''));
    const res = await api.get<ApiResponse<[]>>(`/coach-time-offs/coach/${id}`);
    
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
