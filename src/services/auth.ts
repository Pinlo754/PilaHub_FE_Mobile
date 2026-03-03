import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../hooks/axiosInstance';

type LoginPayload = { email: string; password: string };

export type AuthResult<T = any> =
  | { ok: true; data: T }
  | { ok: false, error: any };

const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';

export async function login(payload: LoginPayload): Promise<AuthResult> {
  try {
    const res = await api.post('/auth/login', payload);

    // server may wrap response in { data: { accessToken, refreshToken, ... } }
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

export async function logout(): Promise<void> {
  try {
    // optionally inform server
    await api.post('/auth/logout');
  } catch {
    // ignore errors from logout call
  }
  await AsyncStorage.removeItem(ACCESS_TOKEN_KEY);
  await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
}

export async function getTokens(): Promise<{ accessToken?: string | null; refreshToken?: string | null }> {
  const accessToken = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
  const refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
  return { accessToken, refreshToken };
}

export async function getProfile(): Promise<AuthResult> {
  try {
    const res = await api.get('/auth/me');
    const data = res.data?.data ?? res.data ?? res;
    return { ok: true, data };
  } catch (e: any) {
    const error = e.response?.data ?? e.message ?? e;
    return { ok: false, error };
  }
}

export async function register(payload: { email: string; password: string; phonenumber?: string; phoneNumber?: string }) : Promise<AuthResult> {
  try {
    const res = await api.post('/auth/register', payload);
    const data = res.data?.data ?? res.data ?? res;
    return { ok: true, data };
  } catch (e: any) {
    const error = e.response?.data ?? e.message ?? e;
    return { ok: false, error };
  }
}

export async function verifyEmail(email: string, otpCode: string): Promise<AuthResult> {
  try {
    const res = await api.post('/auth/verify-email', { email, otpCode });
    const data = res.data?.data ?? res.data ?? res;
    return { ok: true, data };
  } catch (e: any) {
    const error = e.response?.data ?? e.message ?? e;
    return { ok: false, error };
  }
}

export async function resendOtp(email: string): Promise<AuthResult> {
  try {
    const res = await api.post('/auth/resend-otp', { email });
    const data = res.data?.data ?? res.data ?? res;
    return { ok: true, data };
  } catch (e: any) {
    const error = e.response?.data ?? e.message ?? e;
    return { ok: false, error };
  }
}
