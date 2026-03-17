import AsyncStorage from '@react-native-async-storage/async-storage';
import { getProfile } from '../services/auth';
import { fetchMyHealthProfiles, fetchTraineeProfile } from '../services/profile';
import { setOnboardingCompletedFor } from './storage';
import { getBodySavedFor } from './bodyCache';
import useAuthStore from '../store/auth.store';

export async function handlePostLogin(loginPayload: any, navigation: any) {
  const account = loginPayload?.account ?? loginPayload ?? {};
  let role: string | null = account?.role ?? null;

  // try to read persisted role if payload missing it
  if (!role) {
    try {
      const savedRole = await AsyncStorage.getItem('account:role');
      role = savedRole ?? role;
    } catch {
      // ignore
    }
  }

  // read persisted isCoach flag to avoid extra profile calls on reload
  try {
    const savedIsCoach = await AsyncStorage.getItem('account:isCoach');
    if (savedIsCoach === '1') {
      // Ensure role reflects this state
      role = role ?? 'COACH';
      // persist to zustand auth store
      try { useAuthStore.getState().setRole('COACH'); } catch {}
      navigation.replace('CoachScreen');
      return;
    }
  } catch {
    // ignore
  }

  // derive userId from login payload if available
  let userId: string | null = account?.accountId ?? account?.id ?? null;

  // fallback: if we still don't have userId or role, try to fetch profile
  if (!userId || !role) {
    try {
      const me = await getProfile();
      if (me.ok) {
        const d: any = me.data;
        userId = userId ?? (d?.id ?? d?.accountId ?? d?.memberId ?? null);
        // also derive role from fetched profile so COACH accounts are handled immediately
        role = role ?? (d?.role ?? d?.account?.role ?? (Array.isArray(d?.roles) ? d.roles[0] : null) ?? null);
        // persist derived role for future app reloads
        if (role) {
          try {
            await AsyncStorage.setItem('account:role', String(role));
            // persist isCoach flag too
            if (String(role).toUpperCase() === 'COACH') {
              await AsyncStorage.setItem('account:isCoach', '1');
            } else {
              await AsyncStorage.setItem('account:isCoach', '0');
            }
            // persist role to zustand store
            try { useAuthStore.getState().setRole(String(role)); } catch {}
          } catch {
            // ignore
          }
        }
      }
    } catch {
      // ignore
    }
  }

  // If role is COACH -> redirect immediately (also handle case where role arrived from profile)
  if (role && String(role).toUpperCase() === 'COACH') {
    try {
      await AsyncStorage.setItem('account:role', 'COACH');
      await AsyncStorage.setItem('account:isCoach', '1');
      try { useAuthStore.getState().setRole('COACH'); } catch {}
    } catch {
      // ignore
    }
    navigation.replace('CoachScreen');
    return;
  }

  // Primary server-driven checks: trainee profile and health profiles
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

  // if server says no trainee profile -> require onboarding
  if (!traineeExists) {
    navigation.replace('Onboarding');
    return;
  }

  // server has trainee -> mark per-user onboarding completed
  if (userId) {
    try {
      await setOnboardingCompletedFor(userId);
    } catch {
      // ignore
    }
  }

  // check health profiles
  let hasHealth = false;
  try {
    const hRes = await fetchMyHealthProfiles();
    if (hRes.ok) {
      const payload = (hRes.data && (hRes.data.data ?? hRes.data)) ?? hRes.data;
      if (Array.isArray(payload)) hasHealth = payload.length > 0;
      else if (Array.isArray(hRes.data)) hasHealth = hRes.data.length > 0;
    }
  } catch {
    hasHealth = false;
  }

  // fallback to local per-user body cache if server check inconclusive
  if (!hasHealth) {
    try {
      if (userId) {
        const saved = await getBodySavedFor(userId);
        hasHealth = !!saved;
      } else {
        const savedRaw = await AsyncStorage.getItem('bodygram:savedMeasurements');
        hasHealth = !!savedRaw;
      }
    } catch {
      hasHealth = false;
    }
  }

  if (!hasHealth) {
    navigation.replace('Onboarding');
    return;
  }

  // default
  navigation.replace('MainTabs');
}
