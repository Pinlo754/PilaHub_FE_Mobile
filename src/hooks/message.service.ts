import { ApiResponse } from '../utils/ApiResType';
import api from './axiosInstance';

export const MessageService = {
    send: async (
        payload: any,
    ): Promise<[]> => {
        const res = await api.post<ApiResponse<[]>>(
            `/messages`,
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

    getConversationByUser: async (userId: string): Promise<[]> => {
        const res = await api.get<ApiResponse<[]>>(
            `/conversations`,
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

    getMessages: async (conversationId: string): Promise<[]> => {
        const res = await api.get<ApiResponse<[]>>(
            `/conversations/${conversationId}/messages`,
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

    markAsRead: async (conversationId: string): Promise<void> => {
        const res = await api.put<ApiResponse<void>>(
            `/conversations/${conversationId}/read`,
        );
        if (!res.data.success) {
            throw {
                type: 'BUSINESS_ERROR',
                message: res.data.message,
                errorCode: res.data.errorCode,
            };
        }
    },
};
