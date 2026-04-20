import { ApiResponse } from '../utils/ApiResType';
import { TraineeType } from '../utils/CoachBookingType';
import api from './axiosInstance';

export type VendorItem = {
  vendorId: string;
  businessName?: string;
  name?: string;
  description?: string;
  logoUrl?: string;
  city?: string;
  rating?: number;
  verified?: boolean;
  raw?: any;
};

export const VendorService = {
  getById: async (vendorId: string): Promise<VendorItem> => {
    try {
      const res = await api.get<ApiResponse<VendorItem>>(`/vendors/${vendorId}`);
      
      console.log("[VendorService] Response:", res.data);

      if (!res.data || res.data.success === false) {
        throw new Error(res.data?.message || "Lỗi lấy thông tin nhà cung cấp");
      }

      return res.data.data; 
    } catch (error: any) {
      console.error("[VendorService] Error:", error.response?.data || error.message);
      throw error;
    }
  },
};
