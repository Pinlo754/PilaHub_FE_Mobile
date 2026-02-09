import api from './axiosInstance';

export const courseService = {
  // GET ALL
  getAll: async () => {
    const res = await api.get(`/courses/active`);
  },
};
