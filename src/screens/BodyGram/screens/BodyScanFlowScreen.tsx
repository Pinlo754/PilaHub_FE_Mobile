import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Image,
  Text,
  Button,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loadOnboarding } from '../../../utils/storage';

import BodyScanCamera from '../components/BodyScanCamera';
import { uploadToBodygram } from '../services/bodygramApi';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import { useOnboardingStore } from '../../../store/onboarding.store';
import { Measurements } from '../types/measurement';
import { normalizeForBodygram } from '../services/normalizeBodygram';

type Props = NativeStackScreenProps<RootStackParamList, 'BodyScanFlow'>;

export default function BodyScanFlowScreen({ navigation }: Props) {
  const [front, setFront] = useState<string | null>(null);
  const [side, setSide] = useState<string | null>(null);
  const [screenStep, setScreenStep] = useState<'front' | 'side' | 'review'>('front');
  const [loading, setLoading] = useState(false);

  const onboardingData = useOnboardingStore((s) => s.data);
  const setData = useOnboardingStore((s) => s.setData);
  const setStep = useOnboardingStore((s) => s.setStep);

  // Debug: subscribe to onboarding store changes to see when/how it's written
  useEffect(() => {
    const unsub = useOnboardingStore.subscribe((s) => {
      console.log('ZUSTAND onboarding store changed:', JSON.stringify(s, null, 2));
    });
    return () => unsub();
  }, []);

  // If store is empty (app started directly to BodyScan), try to load saved onboarding from AsyncStorage
  const hydratedRef = useRef(false);
  useEffect(() => {
    if (hydratedRef.current) return; // ensure we only hydrate once
    if (onboardingData && Object.keys(onboardingData).length > 0) {
      hydratedRef.current = true;
      return;
    }

    (async () => {
      try {
        const saved = await loadOnboarding();
        console.log('Attempted to load onboarding from storage:', saved);
        if (saved && saved.data) {
          setData(saved.data);
          setStep(saved.step ?? 0);
          hydratedRef.current = true;
          console.log('Loaded onboarding into store from AsyncStorage');
        } else {
          // also log the raw key for debugging
          const raw = await AsyncStorage.getItem('ONBOARDING');
          console.log('AsyncStorage ONBOARDING raw (fallback):', raw);
        }
      } catch (err) {
        console.log('Failed to load onboarding from storage', err);
      }
    })();
  }, [onboardingData, setData, setStep]);

  const handleCapture = (path: string) => {
    if (screenStep === 'front') {
      setFront(path);
      setScreenStep('side');
    } else {
      setSide(path);
      setScreenStep('review');
    }
  };

  const handleSendBodygram = async () => {
    if (!front || !side) return;

    let body;
    try {
      // ✅ VALIDATE + NORMALIZE ONBOARDING DATA
      // Prefer store data but FALLBACK to AsyncStorage (legacy flow)
      let source: any = onboardingData && Object.keys(onboardingData).length > 0 ? onboardingData : undefined;
      if (!source) {
        try {
          const raw = await AsyncStorage.getItem('ONBOARDING');
          console.log('FALLBACK: AsyncStorage ONBOARDING raw:', raw);
          if (raw) {
            const parsed = JSON.parse(raw);
            source = parsed?.data;
          }
        } catch (err) {
          console.log('Error reading ONBOARDING from AsyncStorage', err);
        }
      } else {
        console.log('Using onboarding data from zustand store');
      }

      if (!source || Object.keys(source).length === 0) {
        throw new Error('Thiếu thông tin: onboarding trống. Vui lòng hoàn tất onboarding.');
      }

      console.log('DEBUG onboardingData for Bodygram (used source):', JSON.stringify(source, null, 2));
      body = normalizeForBodygram(source);
      console.log('DEBUG normalized body for Bodygram:', JSON.stringify(body, null, 2));
    } catch (err: any) {
      Alert.alert(
        'Thiếu thông tin',
        err.message || 'Vui lòng hoàn tất onboarding trước khi quét.'
      );
      return;
    }

    try {
      setLoading(true);

      // call upload and log full response
      const res: any = await uploadToBodygram(front, side, body);
      console.log('Bodygram full response:', res);

      // ------------------ extract entry and measurements (do NOT store avatar)
      const entry = res.entry ?? res;
      const measurements: Measurements = entry.measurements ?? {};

      // If server didn't return measurements, prompt user to retake photos
      const hasMeasurements = measurements && Object.keys(measurements).length > 0;
      if (!hasMeasurements) {
        console.warn('Bodygram returned no measurements', res);
        Alert.alert('Quét thất bại', 'Không nhận được số đo từ server. Bạn muốn chụp lại ảnh để thử lại?', [
          {
            text: 'Chụp lại',
            onPress: () => {
              // reset photos and go back to capture
              setFront(null);
              setSide(null);
              setScreenStep('front');
            },
          },
          {
            text: 'Đóng',
            style: 'cancel',
          },
        ]);
        return;
      }

      // Persist measurements (small) so result screen / debugging can access them
      try {
        const measKey = 'bodygram:lastMeasurements';
        await AsyncStorage.setItem(measKey, JSON.stringify(measurements));
        console.log('Saved measurements to AsyncStorage:', measKey);
      } catch (err) {
        console.log('Failed to save measurements to AsyncStorage', err);
      }

      // save a sanitized version to AsyncStorage for later debugging / retrieval
      try {
        const saveKey = 'bodygram:lastResponse';
        // clone and truncate large avatar base64 to avoid storing huge strings
        const sanitized: any = JSON.parse(JSON.stringify(res));
        if (sanitized?.entry?.avatar?.data) {
          sanitized.entry.avatar.data = '[BASE64_TRUNCATED]';
        } else if (sanitized?.avatar?.data) {
          sanitized.avatar.data = '[BASE64_TRUNCATED]';
        }
        await AsyncStorage.setItem(saveKey, JSON.stringify(sanitized));
        console.log('Saved Bodygram response to AsyncStorage:', saveKey);
      } catch (err) {
        console.log('Failed to save Bodygram response to AsyncStorage', err);
      }

      // prepare nav-safe raw response (truncate avatar) before navigating
      let navRaw: any;
      try {
        navRaw = JSON.parse(JSON.stringify(res));
        if (navRaw?.entry?.avatar?.data) navRaw.entry.avatar.data = '[BASE64_TRUNCATED]';
        else if (navRaw?.avatar?.data) navRaw.avatar.data = '[BASE64_TRUNCATED]';
      } catch {
        navRaw = undefined;
      }

      // navigate to result and pass the measurements immediately (no heavy avatar)
      navigation.navigate('Result', {
        measurements,
        avatar: undefined,
        rawResponse: navRaw ?? res,
      });
    } catch (e) {
      console.log('Upload error', e);
      Alert.alert('Lỗi quét', 'Không quét được số đo. Bạn muốn chụp lại ảnh?', [
        {
          text: 'Chụp lại',
          onPress: () => {
            setFront(null);
            setSide(null);
            setScreenStep('front');
          },
        },
        {
          text: 'Đóng',
          style: 'cancel',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // 📸 STEP CHỤP ẢNH
  if (screenStep === 'front' || screenStep === 'side') {
    return <BodyScanCamera mode={screenStep} onCapture={handleCapture} />;
  }
  console.log('Onboarding data used for Bodygram:', onboardingData);
  // 🔍 REVIEW + SUBMIT
  return (
    <ScrollView className="flex-1 p-4 mt-10 bg-slate-50">
      <Text className="text-2xl font-bold mb-4 text-center">Xem lại ảnh</Text>

      {front && (
        <Image
          source={{ uri: 'file://' + front }}
          className="w-full h-80 rounded-xl mb-4"
        />
      )}

      {side && (
        <Image
          source={{ uri: 'file://' + side }}
          className="w-full h-80 rounded-xl mb-4"
        />
      )}

      {loading ? (
        <View className="items-center mt-4">
          <ActivityIndicator size="large" />
          <Text className="mt-2">Đang gửi Bodygram...</Text>
        </View>
      ) : (
        <>
          <Button title="Gửi Bodygram để lấy số đo" onPress={handleSendBodygram} />

          <View className="mt-3">
            <Button
              title="Xem raw response (debug)"
              onPress={() => {
                // show a compact preview of the last response if present
                Alert.alert(
                  'Debug',
                  'Sau khi gửi, bạn sẽ thấy raw response ở màn Kết quả.'
                );
              }}
            />
          </View>
        </>
      )}
    </ScrollView>
  );
}
