import React, { useEffect } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { RootStackParamList } from '../navigation/AppNavigator';

import { getProfile } from '../services/auth';

import {
  fetchMyHealthProfiles,
  fetchTraineeProfile,
} from '../services/profile';

import { useOnboardingStore } from '../store/onboarding.store';

type Props = NativeStackScreenProps<
  RootStackParamList,
  'Startup'
>;

/**
 * STEP CONFIG
 */
const HEIGHT_STEP = 6;

export default function StartupScreen({
  navigation,
}: Props) {
  const {
    reset,
    setStep,
    hydrateFromTraineeProfile,
  } = useOnboardingStore();

  useEffect(() => {
    bootstrap();
  }, []);

  const bootstrap = async () => {
    try {
      /**
       * =========================================
       * 1. CHECK LOGIN
       * =========================================
       */
      const me = await getProfile();

      if (!me.ok) {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });

        return;
      }

      const profile: any = me.data ?? {};

      /**
       * =========================================
       * 2. CHECK ROLE
       * =========================================
       */
      const role = String(
        profile?.account?.role ??
          profile?.role ??
          '',
      ).toUpperCase();

      if (role === 'COACH') {
        try {
          await AsyncStorage.setItem(
            'account:isCoach',
            '1',
          );
        } catch {}

        navigation.reset({
          index: 0,
          routes: [{ name: 'CoachScreen' }],
        });

        return;
      }

      /**
       * =========================================
       * 3. FETCH TRAINEE PROFILE
       * =========================================
       */
      const traineeRes =
        await fetchTraineeProfile();

      /**
       * =========================================
       * 4. CHƯA CÓ TRAINEE
       * -> onboarding từ đầu
       * =========================================
       */
      if (!traineeRes.ok) {
        reset();

        setStep(0);

        navigation.reset({
          index: 0,
          routes: [{ name: 'Onboarding' }],
        });

        return;
      }

      const traineeProfile =
        traineeRes.data?.data ??
        traineeRes.data ??
        {};

      /**
       * =========================================
       * 5. HYDRATE TRAINEE -> STORE
       * =========================================
       */
      hydrateFromTraineeProfile(
        traineeProfile,
      );

      /**
       * =========================================
       * 6. CHECK HEALTH PROFILE
       * =========================================
       */
      let hasHealthProfile = false;

      try {
        const healthRes =
          await fetchMyHealthProfiles();

        const healthProfiles =
          healthRes.data?.data ??
          healthRes.data ??
          [];

        hasHealthProfile =
          healthRes.ok &&
          Array.isArray(healthProfiles) &&
          healthProfiles.length > 0;
      } catch {
        hasHealthProfile = false;
      }

      /**
       * =========================================
       * 7. CHƯA CÓ HEALTH PROFILE
       * -> nhảy vào health step
       * =========================================
       */
      if (!hasHealthProfile) {
        setStep(HEIGHT_STEP);

        navigation.reset({
          index: 0,
          routes: [{ name: 'Onboarding' }],
        });

        return;
      }

      /**
       * =========================================
       * 8. DONE
       * =========================================
       */
      navigation.reset({
        index: 0,
        routes: [{ name: 'MainTabs' }],
      });
    } catch (error) {
      console.log(
        'Startup bootstrap error:',
        error,
      );

      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background items-center justify-center">
      <View className="items-center">
        <ActivityIndicator
          size="large"
          color="#b5651d"
        />

        <Text className="mt-4 text-secondaryText">
          Đang chuẩn bị ứng dụng...
        </Text>
      </View>
    </SafeAreaView>
  );
}