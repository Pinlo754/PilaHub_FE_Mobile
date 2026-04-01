import React, { useEffect } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { isOnboardingCompleted, isOnboardingCompletedFor, setOnboardingCompletedFor, loadOnboarding } from '../utils/storage';
import { useOnboardingStore } from '../store/onboarding.store';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { getProfile } from '../services/auth';
import { getBodySavedFor, setBodySavedFor } from '../utils/bodyCache';
import { fetchTraineeProfile, fetchMyHealthProfiles } from '../services/profile';

type Props = NativeStackScreenProps<RootStackParamList, 'Startup'>;

export default function StartupScreen({ navigation }: Props) {
  const { reset: resetOnboarding, setData, setStep } = useOnboardingStore();
  useEffect(() => {
    (async () => {
      try {
        // hydrate onboarding store from AsyncStorage if available so other screens can use it on cold start
        try {
          const savedOnboarding = await loadOnboarding();
          if (savedOnboarding && savedOnboarding.data) {
            setData(savedOnboarding.data);
            setStep(savedOnboarding.step ?? 0);
            console.log('Hydrated onboarding store from AsyncStorage');
          }
        } catch (e) {
          console.log('Failed to hydrate onboarding store', e);
        }

        // try to resolve current user id from auth/me
        let userId: string | null = null;
        const me = await getProfile();
        const isAuthenticated = me.ok;
        if (!isAuthenticated) {
          // not logged in -> go to Login
          navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
          return;
        }
        const d: any = me.data;
        userId = d?.id ?? d?.accountId ?? d?.memberId ?? null;

        // check server-side trainee profile first for authenticated users
        let traineeExists = false;
        try {
          const tRes = await fetchTraineeProfile();
          if (tRes.ok) {
            traineeExists = true;
            // mark per-user onboarding completed for safety
            if (userId) await setOnboardingCompletedFor(userId);
          } else {
            const err = tRes.error || {};
            const code = err?.errorCode ?? err?.code ?? err?.status;
            const msg = String(err?.message ?? err ?? '').toLowerCase();
            if (code === 404 || msg.includes('not found') || code === 'TRAINEE_NOT_FOUND') {
              traineeExists = false;
            }
          }
        } catch {
          traineeExists = false;
        }

        // if trainee exists on server, treat onboarding as completed; otherwise fall back to local per-user flag
        const onboarded = traineeExists ? true : (userId ? await isOnboardingCompletedFor(userId) : await isOnboardingCompleted());

        // check server-side health profiles for authenticated users first
        let hasSaved = false;
        if (userId) {
          try {
            const hRes = await fetchMyHealthProfiles();
            if (hRes.ok) {
              const arr = (hRes.data && (hRes.data.data ?? hRes.data)) ?? hRes.data;
              if (Array.isArray(arr) && arr.length > 0) {
                hasSaved = true;
                // persist per-user cache for faster startup next time
                try {
                  await setBodySavedFor(userId, { profileId: arr[0]?.id ?? arr[0]?.profileId ?? null, savedAt: Date.now(), summary: {} });
                } catch {}
              }
            }
          } catch {
            // server health check failed -> fallback to local cache below
          }

          if (!hasSaved) {
            const saved = await getBodySavedFor(userId);
            hasSaved = !!saved;
          }
        } else {
          const savedRaw = await AsyncStorage.getItem('bodygram:savedMeasurements');
          hasSaved = !!savedRaw;
        }

        if (!onboarded) {
          // ensure onboarding store cleared so user starts from first step
          try { resetOnboarding(); } catch {}
          navigation.reset({ index: 0, routes: [{ name: 'Onboarding' }] });
          return;
        }

        // onboarding done; if no saved body measurements, go to Onboarding
        if (!hasSaved) {
          navigation.reset({ index: 0, routes: [{ name: 'Onboarding' }] });
          return;
        }

        // both done -> main app
        navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
      } catch (e) {
        console.warn('Startup check failed', e);
        // fallback to main tabs
        navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
      }
    })();
  }, [navigation, resetOnboarding, setData, setStep]);

  return (
    <SafeAreaView className="flex-1 bg-background items-center justify-center">
      <View className="items-center">
        <ActivityIndicator size="large" color="#b5651d" />
        <Text className="mt-4 text-secondaryText">Đang chuẩn bị ứng dụng...</Text>
      </View>
    </SafeAreaView>
  );
}
