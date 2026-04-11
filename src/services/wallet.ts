import api from '../hooks/axiosInstance';

type ServiceResult<T = any> = { ok: true; data: T } | { ok: false; error: any };

export async function fetchMyWallet(): Promise<ServiceResult> {
  try {
    const res = await api.get('/wallet/my-wallet');
    const data = res.data?.data ?? res.data ?? res;
    return { ok: true, data };
  } catch (e: any) {
    const error = e.response?.data ?? { message: e.message ?? e, status: e.response?.status };
    return { ok: false, error };
  }
}

export async function createWallet(): Promise<ServiceResult> {
  try {
    // create wallet endpoint — best-effort guess using /wallet
    const res = await api.post('/wallet');
    const data = res.data?.data ?? res.data ?? res;
    return { ok: true, data };
  } catch (e: any) {
    const error = e.response?.data ?? { message: e.message ?? e, status: e.response?.status };
    return { ok: false, error };
  }
}

/**
 * Create a VNPay payment URL to deposit funds into the user's wallet.
 * Minimum amount: 10,000 VND.
 * POST /wallet/deposit/create
 */
export async function createWalletDeposit(amount: number, description = 'Nạp tiền vào ví') : Promise<ServiceResult<{ paymentUrl: string; transactionId: string; orderCode: string }>> {
  try {
    const min = 10000;
    if (typeof amount !== 'number' || isNaN(amount) || amount < min) {
      return { ok: false, error: { message: `Số tiền nạp tối thiểu là ${min} VND`, code: 'INVALID_AMOUNT' } };
    }

    const body = { amount, description };
    const res = await api.post('/wallet/deposit/create', body);
    const data = res.data?.data ?? res.data ?? res;

    // Expected data: { paymentUrl, transactionId, orderCode }
    return { ok: true, data };
  } catch (e: any) {
    const error = e.response?.data ?? { message: e.message ?? e, status: e.response?.status };
    return { ok: false, error };
  }
}

/**
 * Create a MoMo payment request by calling backend `/wallet/momo/deposit/create`.
 */
export async function createWalletMomoDeposit(amount: number, description = 'Nạp tiền vào ví') : Promise<ServiceResult<{ paymentUrl: string; transactionId: string; orderCode: string }>> {
  try {
    const min = 10000;
    if (typeof amount !== 'number' || isNaN(amount) || amount < min) {
      return { ok: false, error: { message: `Số tiền nạp tối thiểu là ${min} VND`, code: 'INVALID_AMOUNT' } };
    }

    const body = { amount, description };
    const res = await api.post('/wallet/momo/deposit/create', body);
    const data = res.data?.data ?? res.data ?? res;

    return { ok: true, data };
  } catch (err: any) {
    const error = err.response?.data ?? { message: err.message ?? err, status: err.response?.status };
    return { ok: false, error };
  }
}

/**
 * Get list of banks supported for wallet withdrawals (VietQR)
 * GET /wallet-withdrawals/banks
 */
export async function fetchWithdrawalBanks(): Promise<ServiceResult<Array<{ bankCode: string; bankName: string; bankLogo?: string }>>> {
  try {
    const res = await api.get('/wallet-withdrawals/banks');
    const data = res.data?.data ?? res.data ?? res;
    return { ok: true, data };
  } catch (e: any) {
    const error = e.response?.data ?? { message: e.message ?? e, status: e.response?.status };
    return { ok: false, error };
  }
}

/**
 * Create a withdrawal request
 * POST /wallet-withdrawals
 */
export async function createWalletWithdrawal(payload: {
  recipientName: string;
  bankAccountNumber: string;
  bankCode: string;
  bankName: string;
  bankLogo?: string;
  amount: number;
  note?: string;
}): Promise<ServiceResult<any>> {
  try {
    const res = await api.post('/wallet-withdrawals', payload);
    const data = res.data?.data ?? res.data ?? res;
    return { ok: true, data };
  } catch (e: any) {
    const error = e.response?.data ?? { message: e.message ?? e, status: e.response?.status };
    return { ok: false, error };
  }
}

/**
 * Get current user's withdrawal requests
 * GET /wallet-withdrawals/my-withdrawals
 */
export async function getMyWithdrawals(): Promise<ServiceResult<any[]>> {
  try {
    const res = await api.get('/wallet-withdrawals/my-withdrawals');
    const data = res.data?.data ?? res.data ?? res;
    return { ok: true, data };
  } catch (e: any) {
    const error = e.response?.data ?? { message: e.message ?? e, status: e.response?.status };
    return { ok: false, error };
  }
}

/**
 * Get a single withdrawal by id
 * GET /wallet-withdrawals/my-withdrawals/{withdrawalId}
 */
export async function getMyWithdrawalById(withdrawalId: string): Promise<ServiceResult<any>> {
  try {
    const res = await api.get(`/wallet-withdrawals/my-withdrawals/${withdrawalId}`);
    const data = res.data?.data ?? res.data ?? res;
    return { ok: true, data };
  } catch (e: any) {
    const error = e.response?.data ?? { message: e.message ?? e, status: e.response?.status };
    return { ok: false, error };
  }
}

/**
 * Update a pending withdrawal
 * PUT /wallet-withdrawals/my-withdrawals/{withdrawalId}
 */
export async function updateMyWithdrawal(withdrawalId: string, payload: Partial<any>): Promise<ServiceResult<any>> {
  try {
    const res = await api.put(`/wallet-withdrawals/my-withdrawals/${withdrawalId}`, payload);
    const data = res.data?.data ?? res.data ?? res;
    return { ok: true, data };
  } catch (e: any) {
    const error = e.response?.data ?? { message: e.message ?? e, status: e.response?.status };
    return { ok: false, error };
  }
}

/**
 * Cancel a pending withdrawal
 * PATCH /wallet-withdrawals/my-withdrawals/{withdrawalId}/cancel
 */
export async function cancelMyWithdrawal(withdrawalId: string): Promise<ServiceResult<any>> {
  try {
    const res = await api.patch(`/wallet-withdrawals/my-withdrawals/${withdrawalId}/cancel`);
    const data = res.data?.data ?? res.data ?? res;
    return { ok: true, data };
  } catch (e: any) {
    const error = e.response?.data ?? { message: e.message ?? e, status: e.response?.status };
    return { ok: false, error };
  }
}
