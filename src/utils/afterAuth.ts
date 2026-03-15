import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchTraineeProfile, fetchMyHealthProfiles } from '../services/profile';
import { getProfile } from '../services/auth';
import { getBodySavedFor } from './bodyCache';
import { setOnboardingCompletedFor } from './storage';
import { useOnboardingStore } from '../store/onboarding.store';

// navigation is a React Navigation object; use any to avoid tight typing here
export async function postLoginRouting(navigation: any, loginData?: any) {
  try {
    // if app previously detected coach role, prefer that on reload to avoid onboarding loop
    try {
      const savedIsCoach = await AsyncStorage.getItem('account:isCoach');
      if (savedIsCoach === '1') {
        navigation.replace('CoachScreen');
        return;
      }
    } catch {}

    const roleFromLogin = String(loginData?.account?.role ?? '').toUpperCase();
    if (roleFromLogin === 'COACH') {
      navigation.replace('CoachScreen');
      return;
    }

    // fetch profile
    const me = await getProfile();
    let userId: string | null = null;
    if (me.ok) {
      const d: any = me.data;
      userId = d?.id ?? d?.accountId ?? d?.memberId ?? null;
    }

    const profileRole = (me.ok ? String((me as any).data?.account?.role ?? (me as any).data?.role ?? '') : '').toUpperCase();
    if (!roleFromLogin && profileRole === 'COACH') {
      navigation.replace('CoachScreen');
      return;
    }

    // check trainee existence
    let traineeExists = false;
    try {
      const tRes = await fetchTraineeProfile();
      if (tRes.ok) {
        traineeExists = true;
      } else {
        const err = tRes.error || {};
        const msg = String(err?.message ?? err ?? '').toLowerCase();
        const code = err?.errorCode ?? err?.code ?? err?.status;
        if (code === 404 || msg.includes('not found') || code === 'TRAINEE_NOT_FOUND') {
          traineeExists = false;
        } else {
          traineeExists = false;
        }
      }
    } catch {
      traineeExists = false;
    }

    if (!traineeExists) {
      // reset onboarding store so user starts at first step (gender)
      try {
        const s: any = useOnboardingStore as any;
        if (s && typeof s.getState === 'function') {
          const st = s.getState();
          if (st && typeof st.reset === 'function') st.reset();
        }
      } catch {}

      navigation.replace('Onboarding');
      return;
    }

    if (userId) {
      try {
        await setOnboardingCompletedFor(userId);
      } catch {}
    }

    // check health profiles
    let hasHealth = false;
    try {
      const hRes = await fetchMyHealthProfiles();
      if (hRes.ok) {
        const data = (hRes.data && (hRes.data.data ?? hRes.data)) ?? hRes.data;
        if (Array.isArray(data)) hasHealth = data.length > 0;
        else if (Array.isArray(hRes.data)) hasHealth = hRes.data.length > 0;
      }
    } catch {
      hasHealth = false;
    }

    if (!hasHealth) {
      if (userId) {
        const saved = await getBodySavedFor(userId);
        hasHealth = !!saved;
      } else {
        const savedRaw = await AsyncStorage.getItem('bodygram:savedMeasurements');
        hasHealth = !!savedRaw;
      }
    }

    if (!hasHealth) {
      navigation.replace('Onboarding');
      return;
    }

    navigation.replace('MainTabs');
  } catch (e) {
    // fallback to main tabs on unexpected errors
    try { navigation.replace('MainTabs'); } catch {};
  }
}
