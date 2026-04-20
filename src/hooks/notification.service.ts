import { ApiResponse } from '../utils/ApiResType';
import api from './axiosInstance';
export interface NotificationItem {
  notificationId: string;
  recipientId: string;
  type: string;
  title: string;
  message: string;
  referenceId: string | null;
  referenceType: string | null;
  read: boolean;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  content: T[];
  pageable: any;
  last: boolean;
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  numberOfElements: number;
  empty: boolean;
}
export const MessageService = {
    getAll: async (): Promise<PaginatedResponse<NotificationItem>> => {
        const res = await api.get<ApiResponse<PaginatedResponse<NotificationItem>>>(`/notifications?page=0&size=20`);

        if (!res.data.success) {
            throw {
                type: 'BUSINESS_ERROR',
                message: res.data.message,
                errorCode: res.data.errorCode,
            };
        }

        return res.data.data;
    },

    read: async (id: string): Promise<[]> => {
        const res = await api.patch<ApiResponse<[]>>(`/notifications/${id}/read`);

        if (!res.data.success) {
            throw {
                type: 'BUSINESS_ERROR',
                message: res.data.message,
                errorCode: res.data.errorCode,
            };
        }

        return res.data.data;
    },

    readAll: async (): Promise<[]> => {
        const res = await api.patch<ApiResponse<[]>>(`/notifications/read-all`);

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
