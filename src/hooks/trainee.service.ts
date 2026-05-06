import { get } from 'react-native/Libraries/NativeComponent/NativeComponentRegistry';
import { ApiResponse } from '../utils/ApiResType';
import { HealthProfileType, TraineeType } from '../utils/CoachBookingType';
import api from './axiosInstance';


export const TraineeService = {
  getById: async (traineeId: string): Promise<TraineeType> => {
    try {
      const res = await api.get<ApiResponse<TraineeType>>(`/trainees/${traineeId}`);
      
      // Log để kiểm tra thực tế dữ liệu trả về từ server
      console.log("[TraineeService] Response:", res.data);

      if (!res.data || res.data.success === false) {
        throw new Error(res.data?.message || "Lỗi lấy thông tin học viên");
      }

      // Đảm bảo trả về đúng Object chứa thông tin
      return res.data.data; 
    } catch (error: any) {
      console.error("[TraineeService] Error:", error.response?.data || error.message);
      throw error;
    }
  },

  getAllTrainees: async (): Promise<TraineeType[]> => {
    try {
      const res = await api.get<ApiResponse<TraineeType[]>>(`/trainees`);
      if (!res.data || res.data.success === false) {
        throw new Error(res.data?.message || "Lỗi lấy danh sách học viên");
      }
      return res.data.data;
    } catch (error: any) {
      console.error("[TraineeService] Error:", error.response?.data || error.message);
      throw error;
    }
  },

  getTraineesByCoach: async (coachId: string | null): Promise<TraineeType[]> => {
    if (!coachId) {
      throw new Error("Không tìm thấy ID huấn luyện viên");
    }
    try {
      const res = await api.get<ApiResponse<TraineeType[]>>(`/trainees`);
      if (!res.data || res.data.success === false) {
        throw new Error(res.data?.message || "Lỗi lấy danh sách học viên");
      }
      return res.data.data;
    } catch (error: any) {
      console.error("[TraineeService] Error:", error.response?.data || error.message);
      throw error;
    }
  },

  getHealthProfile: async (traineeId: string) => {
    try {
      const res = await api.get<ApiResponse<HealthProfileType>>(`/health-profiles/trainee/${traineeId}`);
      if (!res.data || res.data.success === false) {
        throw new Error(res.data?.message || "Lỗi lấy thông tin sức khỏe");
      }
      return res.data.data;
    } catch (error: any) {
      console.error("[TraineeService] Error:", error.response?.data || error.message);
      throw error;
    }
    },
};
