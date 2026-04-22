import { ApiResponse } from '../utils/ApiResType';
import { AssessmentCriterionType } from '../utils/AssessmentCriterionType';
import api from './axiosInstance';

export const AssessmentCriterionService = {
  // GET ALL
  getAll: async (): Promise<AssessmentCriterionType[]> => {
    const res = await api.get<ApiResponse<AssessmentCriterionType[]>>(
      `/assessment-criteria/active`,
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
