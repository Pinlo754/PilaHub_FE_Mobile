import AsyncStorage from '@react-native-async-storage/async-storage';

import { getProfile } from '../services/auth';

import {
  fetchMyHealthProfiles,
  fetchTraineeProfile,
} from '../services/profile';

import { setOnboardingCompletedFor } from './storage';

import { getBodySavedFor } from './bodyCache';

import useAuthStore from '../store/auth.store';

import { useOnboardingStore } from '../store/onboarding.store';

export async function handlePostLogin(
  loginPayload: any,
  navigation: any,
) {
  /**
   * =========================
   * LOGIN PAYLOAD
   * =========================
   */

  const authResponse =
    loginPayload?.authResponse ?? loginPayload;

  const account =
    authResponse?.account ??
    loginPayload?.account ??
    loginPayload ??
    {};

  let role: string | null =
    account?.role ?? null;

  /**
   * =========================
   * CHECK SAVED COACH
   * =========================
   */

  try {
    const savedIsCoach =
      await AsyncStorage.getItem(
        'account:isCoach',
      );

    if (savedIsCoach === '1') {
      try {
        useAuthStore
          .getState()
          .setRole('COACH');
      } catch {}

      navigation.replace('CoachScreen');

      return;
    }
  } catch {}

  /**
   * =========================
   * GET USER ID
   * =========================
   */

  let userId: string | null =
    account?.accountId ??
    account?.id ??
    null;

  /**
   * =========================
   * FETCH PROFILE
   * =========================
   */

  if (!userId || !role) {
    try {
      const me = await getProfile();

      if (me.ok) {
        const d: any = me.data;

        userId =
          userId ??
          d?.id ??
          d?.accountId ??
          d?.memberId ??
          null;

        role =
          role ??
          d?.role ??
          d?.account?.role ??
          null;

        if (role) {
          try {
            await AsyncStorage.setItem(
              'account:role',
              String(role),
            );

            await AsyncStorage.setItem(
              'account:isCoach',
              String(role).toUpperCase() ===
                'COACH'
                ? '1'
                : '0',
            );

            try {
              useAuthStore
                .getState()
                .setRole(String(role));
            } catch {}
          } catch {}
        }
      }
    } catch {}
  }

  /**
   * =========================
   * COACH
   * =========================
   */

  if (
    role &&
    String(role).toUpperCase() ===
      'COACH'
  ) {
    navigation.replace('CoachScreen');

    return;
  }

  /**
   * =========================
   * CHECK TRAINEE PROFILE
   * =========================
   */

  let traineeProfile: any = null;

  try {
    const tRes =
      await fetchTraineeProfile();

    if (tRes.ok) {
      traineeProfile =
        tRes.data?.data ??
        tRes.data ??
        null;
    }
  } catch {}

  /**
   * =========================
   * NO TRAINEE PROFILE
   * =========================
   */

  if (!traineeProfile) {
    try {
      useOnboardingStore
        .getState()
        .reset();
    } catch {}

    navigation.replace('Onboarding');

    return;
  }

  /**
   * =========================
   * SAVE TRAINEE TO STORE
   * =========================
   */

  try {
    useOnboardingStore
      .getState()
      .setData({
        traineeId:
          traineeProfile?.traineeId ??
          traineeProfile?.id,

        fullName:
          traineeProfile?.fullName,

        age: traineeProfile?.age,

        gender:
          String(
            traineeProfile?.gender ??
              '',
          ).toLowerCase() ===
          'female'
            ? 'female'
            : 'male',
      });
  } catch {}

  /**
   * =========================
   * CHECK HEALTH PROFILE
   * =========================
   */

  let hasHealth = false;

  try {
    const hRes =
      await fetchMyHealthProfiles();

    if (hRes.ok) {
      const payload =
        hRes.data?.data ??
        hRes.data ??
        [];

      hasHealth =
        Array.isArray(payload) &&
        payload.length > 0;
    }
  } catch {}

  /**
   * =========================
   * LOCAL FALLBACK
   * =========================
   */

  if (!hasHealth) {
    try {
      if (userId) {
        const saved =
          await getBodySavedFor(
            userId,
          );

        hasHealth = !!saved;
      }
    } catch {}
  }

  /**
   * =========================
   * NO HEALTH PROFILE
   * =========================
   */

  if (!hasHealth) {
    try {
      useOnboardingStore
        .getState()
        .setStep(5);
    } catch {}

    navigation.replace('Onboarding');

    return;
  }

  /**
   * =========================
   * COMPLETE
   * =========================
   */

  if (userId) {
    try {
      await setOnboardingCompletedFor(
        userId,
      );
    } catch {}
  }

  navigation.replace('MainTabs');
}