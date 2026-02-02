import React, { useState } from 'react';
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
  const [step, setStep] = useState<'front' | 'side' | 'review'>('front');
  const [loading, setLoading] = useState(false);

  // ✅ LẤY ĐÚNG DATA TỪ STORE (KHÔNG LẤY CẢ STATE)
  const onboardingData = useOnboardingStore((state) => state.data);

  const handleCapture = (path: string) => {
    if (step === 'front') {
      setFront(path);
      setStep('side');
    } else {
      setSide(path);
      setStep('review');
    }
  };

  const handleSendBodygram = async () => {
    if (!front || !side) return;

    let body;
    try {
      // ✅ VALIDATE + NORMALIZE ONBOARDING DATA
      body = normalizeForBodygram(onboardingData);
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
      let navRaw: any = undefined;
      try {
        navRaw = JSON.parse(JSON.stringify(res));
        if (navRaw?.entry?.avatar?.data) navRaw.entry.avatar.data = '[BASE64_TRUNCATED]';
        else if (navRaw?.avatar?.data) navRaw.avatar.data = '[BASE64_TRUNCATED]';
      } catch (e) {
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
      Alert.alert('Lỗi', 'Không quét được số đo. Bạn thử lại sau nhé.');
    } finally {
      setLoading(false);
    }
  };

  // 📸 STEP CHỤP ẢNH
  if (step === 'front' || step === 'side') {
    return <BodyScanCamera mode={step} onCapture={handleCapture} />;
  }

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
