import { ApiResponse } from '../utils/ApiResType';
import api from './axiosInstance';

interface ReactSummary {
  reactionCount: number;
  reactedByMe: boolean;
}

export const PostService = {
  // CREATE POST
  createPost: async (
        payload: any,
    ): Promise<[]> => {
        const res = await api.post<ApiResponse<[]>>(
            `/posts`,
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

    // GET MY POSTS
    getMyPosts: async (): Promise<[]> => {
        const res = await api.get<ApiResponse<[]>>(
            `/posts/my-posts`,
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

    // GET COACH POSTS
    getCoachPosts: async (coachId: string): Promise<[]> => {
        const res = await api.get<ApiResponse<[]>>(`/posts/coach/${coachId}`);

        if (!res.data.success) {
            throw {
                type: 'BUSINESS_ERROR',
                message: res.data.message,
                errorCode: res.data.errorCode,
            };
        }

        return res.data.data;
    },

    getComment: async (postId: string): Promise<[]> => {
        const res = await api.get<ApiResponse<[]>>(
            `/post-comments/post/${postId}`,
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

    getReact: async (postId: string): Promise<ReactSummary> => {
        const res = await api.get<ApiResponse<ReactSummary>>(
            `/post-reactions/post/${postId}/summary`,
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

    sendComment: async (id:string, payload: any): Promise<ReactSummary> => {
        const res = await api.post<ApiResponse<ReactSummary>>(
            `/post-comments/post/${id}`,
            payload
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

    react: async (id:string): Promise<ReactSummary> => {
        const res = await api.post<ApiResponse<ReactSummary>>(
            `/post-reactions/post/${id}`);
        if (!res.data.success) {
            throw {
                type: 'BUSINESS_ERROR',
                message: res.data.message,
                errorCode: res.data.errorCode,
            };
        }

        return res.data.data;
    }, 

    removeReact: async (id:string): Promise<ReactSummary> => {
        const res = await api.delete<ApiResponse<ReactSummary>>(
            `/post-reactions/post/${id}`);
        if (!res.data.success) {
            throw {
                type: 'BUSINESS_ERROR',
                message: res.data.message,
                errorCode: res.data.errorCode,
            };
        }

        return res.data.data;
    }, 
    deletePost: async (id:string): Promise<void> => {
        const res = await api.delete<ApiResponse<void>>(
            `/posts/${id}`);
        if (!res.data.success) {
            throw {
                type: 'BUSINESS_ERROR',
                message: res.data.message,
                errorCode: res.data.errorCode,
            };
        }
    }
};
