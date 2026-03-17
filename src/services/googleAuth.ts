import api from '../hooks/axiosInstance';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';

export type AuthResult<T = any> =
  | { ok: true; data: T }
  | { ok: false; error: any };

export async function googleAuth(payload: { email?: string; googleIdToken: string; phoneNumber?: string; password?: string }): Promise<AuthResult> {
  try {
    const res = await api.post('/auth/google-login', payload);
    const data = res.data?.data ?? res.data ?? res;

    // backend may return tokens at top-level or inside data.authResponse
    const authPayload = data?.authResponse ?? data;
    const accessToken = authPayload?.accessToken ?? null;
    const refreshToken = authPayload?.refreshToken ?? null;

    if (accessToken) {
      await AsyncStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    }
    if (refreshToken) {
      await AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }

    return { ok: true, data };
  } catch (e: any) {
    const error = e.response?.data ?? e.message ?? e;
    return { ok: false, error };
  }
}