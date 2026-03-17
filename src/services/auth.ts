import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../hooks/axiosInstance';
import { clearOnboarding, clearOnboardingCompleted, clearOnboardingCompletedFor } from '../utils/storage';
import { useOnboardingStore } from '../store/onboarding.store';

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
      await AsyncStorage.setItem('id', JSON.stringify(data.account.accountId));
      await AsyncStorage.setItem('role', data.account.role);
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
  // Client-only sign out: clear local auth tokens and onboarding data
  try {
    await AsyncStorage.removeItem(ACCESS_TOKEN_KEY);
    await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
  } catch {}

  // clear persisted onboarding data and flags
  try {
    await clearOnboarding();
    await clearOnboardingCompleted();
  } catch {}

  // best-effort: clear per-user completed flag if we can derive userId (optional)
  try {
    const meRaw = await AsyncStorage.getItem('me');
    if (meRaw) {
      try {
        const me = JSON.parse(meRaw as string);
        const userId = me?.id ?? me?.accountId ?? me?.memberId ?? null;
        if (userId) await clearOnboardingCompletedFor(userId);
      } catch {}
    }
  } catch {}

  // reset in-memory onboarding store
  try {
    const s: any = useOnboardingStore as any;
    if (s && typeof s.getState === 'function') {
      const st = s.getState();
      if (st && typeof st.reset === 'function') st.reset();
    }
  } catch {}

  // remove cached BodyGram data
  try { await AsyncStorage.removeItem('bodygram:savedMeasurements'); } catch {}
  try { await AsyncStorage.removeItem('bodygram:lastMeasurements'); } catch {}
  try { await AsyncStorage.removeItem('bodygram:lastResponse'); } catch {}
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

// Request password reset OTP to registered email
export async function requestPasswordReset(email: string): Promise<AuthResult> {
  try {
    const res = await api.post('/auth/forgot-password', { email });
    const data = res.data?.data ?? res.data ?? res;
    return { ok: true, data };
  } catch (e: any) {
    const error = e.response?.data ?? e.message ?? e;
    return { ok: false, error };
  }
}

// Confirm password reset with OTP and new password
export async function confirmPasswordReset(email: string, otpCode: string, newPassword: string): Promise<AuthResult> {
  try {
    const res = await api.post('/auth/reset-password', { email, otpCode, newPassword });
    const data = res.data?.data ?? res.data ?? res;
    return { ok: true, data };
  } catch (e: any) {
    const error = e.response?.data ?? e.message ?? e;
    return { ok: false, error };
  }
}