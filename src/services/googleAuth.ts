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

    if (data?.accessToken) {
      await AsyncStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken);
    }
    if (data?.refreshToken) {
      await AsyncStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
    }

    return { ok: true, data };
  } catch (e: any) {
    const error = e.response?.data ?? e.message ?? e;
    return { ok: false, error };
  }
}
