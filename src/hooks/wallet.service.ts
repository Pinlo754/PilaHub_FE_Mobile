import { ApiResponse } from '../utils/ApiResType';
import { WalletType } from '../utils/WalletType';
import api from './axiosInstance';

export const WalletService = {
  // GET MY WALLET
  getMyWallet: async (): Promise<WalletType> => {
    const res = await api.get<ApiResponse<WalletType>>(`/wallet/my-wallet`);

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
