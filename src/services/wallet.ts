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
