import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Image,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import ModalPopup from '../../../components/ModalPopup';
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

export default function BodyScanFlowScreen({ navigation, route }: Props) {
  const returnToAfterAssessment = (route.params as any)?.returnToAfterAssessment;

  const [front, setFront] = useState<string | null>(null);
  const [side, setSide] = useState<string | null>(null);
  const [screenStep, setScreenStep] = useState<'front' | 'side' | 'review'>(
    'front',
  );
  const [loading, setLoading] = useState(false);
  const [modalProps, setModalProps] = useState<any>({ visible: false });

  function showModal(
    title: string,
    message?: string,
    mode: string = 'noti',
    onConfirm?: () => void,
  ) {
    const normalizedMode = mode === 'notify' ? 'noti' : mode;

    setModalProps({
      visible: true,
      mode: normalizedMode,
      titleText: title,
      contentText: message ?? '',
      onClose: () => setModalProps({ visible: false }),
      ...(onConfirm ? { onConfirm } : {}),
      ...(normalizedMode === 'confirm'
        ? { onCancel: () => setModalProps({ visible: false }) }
        : {}),
    });
  }

  const onboardingData = useOnboardingStore((s) => s.data);
  const setData = useOnboardingStore((s) => s.setData);
  const setStep = useOnboardingStore((s) => s.setStep);

  useEffect(() => {
    const unsub = useOnboardingStore.subscribe((s) => {
      console.log(
        'ZUSTAND onboarding store changed:',
        JSON.stringify(s, null, 2),
      );
    });

    return () => unsub();
  }, []);

  const hydratedRef = useRef(false);

  useEffect(() => {
    if (hydratedRef.current) return;

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
      let source: any =
        onboardingData && Object.keys(onboardingData).length > 0
          ? onboardingData
          : undefined;

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
        throw new Error(
          'Thiếu thông tin: onboarding trống. Vui lòng hoàn tất onboarding.',
        );
      }

      console.log(
        'DEBUG onboardingData for Bodygram (used source):',
        JSON.stringify(source, null, 2),
      );

      body = normalizeForBodygram(source);

      console.log('DEBUG normalized body for Bodygram:', JSON.stringify(body, null, 2));
    } catch (err: any) {
      showModal(
        'Thiếu thông tin',
        err.message || 'Vui lòng hoàn tất onboarding trước khi quét.',
      );
      return;
    }

    try {
      setLoading(true);

      const res: any = await uploadToBodygram(front, side, body);

      console.log('Bodygram full response:', res);

      const entry = res.entry ?? res;

      const errorCode =
        (entry && (entry as any).error && (entry as any).error.code) ||
        undefined;

      if (errorCode) {
        const friendly: Record<string, string> = {
          personNotDetected:
            'Không phát hiện người trong ảnh. Hãy chụp lại đảm bảo toàn thân vào khung.',
          lowQuality: 'Chất lượng ảnh thấp, vui lòng chụp lại ảnh rõ hơn.',
          tooFar: 'Bạn ở quá xa camera, hãy tiến lại gần hơn.',
        };

        const msg = friendly[errorCode] ?? `Lỗi: ${errorCode}`;

        showModal('Quét thất bại', msg, 'confirm', () => {
          setFront(null);
          setSide(null);
          setScreenStep('front');
        });

        return;
      }

      const measurements: Measurements = entry.measurements ?? {};

      const hasMeasurements =
        measurements && Object.keys(measurements).length > 0;

      if (!hasMeasurements) {
        console.warn('Bodygram returned no measurements', res);

        showModal(
          'Quét thất bại',
          'Không nhận được số đo từ server. Bạn muốn chụp lại ảnh để thử lại?',
          'confirm',
          () => {
            setFront(null);
            setSide(null);
            setScreenStep('front');
          },
        );

        return;
      }

      try {
        const measKey = 'bodygram:lastMeasurements';

        await AsyncStorage.setItem(measKey, JSON.stringify(measurements));

        console.log('Saved measurements to AsyncStorage:', measKey);
      } catch (err) {
        console.log('Failed to save measurements to AsyncStorage', err);
      }

      try {
        const saveKey = 'bodygram:lastResponse';
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

      let navRaw: any;

      try {
        navRaw = JSON.parse(JSON.stringify(res));

        if (navRaw?.entry?.avatar?.data) {
          navRaw.entry.avatar.data = '[BASE64_TRUNCATED]';
        } else if (navRaw?.avatar?.data) {
          navRaw.avatar.data = '[BASE64_TRUNCATED]';
        }
      } catch {
        navRaw = undefined;
      }

      navigation.navigate('Result', {
        measurements,
        avatar: undefined,
        rawResponse: navRaw ?? res,
        source: 'BodyGram',
        returnToAfterAssessment,
      } as any);
    } catch (e) {
      console.log('Upload error', e);

      showModal('Lỗi quét', 'Không quét được số đo. Bạn muốn chụp lại ảnh?', 'confirm', () => {
        setFront(null);
        setSide(null);
        setScreenStep('front');
      });
    } finally {
      setLoading(false);
    }
  };

  if (screenStep === 'front' || screenStep === 'side') {
    return <BodyScanCamera mode={screenStep} onCapture={handleCapture} />;
  }

  console.log('Onboarding data used for Bodygram:', onboardingData);
  console.log('BodyScanFlow returnToAfterAssessment:', returnToAfterAssessment);

  return (
    <ScrollView style={styles.container}>
      <Text className="text-2xl font-bold mb-4 text-center">Xem lại ảnh</Text>

      {front && (
        <Image source={{ uri: 'file://' + front }} style={styles.imgStyle} />
      )}

      {side && (
        <Image source={{ uri: 'file://' + side }} style={styles.imgStyle} />
      )}

      {loading ? (
        <View style={styles.centerView}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Đang gửi Bodygram...</Text>
        </View>
      ) : (
        <>
          <TouchableOpacity
            onPress={handleSendBodygram}
            style={styles.sendButton}
          >
            <Text style={styles.sendButtonText}>
              Gửi Bodygram để lấy số đo
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              setFront(null);
              setSide(null);
              setScreenStep('front');
            }}
            style={styles.retakeButton}
          >
            <Text style={styles.retakeButtonText}>Chụp lại</Text>
          </TouchableOpacity>
        </>
      )}

      <ModalPopup {...(modalProps as any)} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    marginTop: 40,
    backgroundColor: '#FFFAF0',
  },
  sendButton: {
    backgroundColor: '#A0522D',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 12,
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  retakeButton: {
    borderColor: '#A0522D',
    borderWidth: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  retakeButtonText: {
    color: '#A0522D',
    fontWeight: '700',
  },
  imgStyle: {
    width: '100%',
    height: 320,
    borderRadius: 12,
    marginBottom: 16,
  },
  centerView: {
    alignItems: 'center',
    marginTop: 16,
  },
  loadingText: {
    marginTop: 8,
  },
});