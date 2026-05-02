import React, { useMemo, useState } from 'react';
import {
  Text,
  ScrollView,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  StyleSheet,
  Pressable,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import { useOnboardingStore } from '../../../store/onboarding.store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  submitHealthProfile,
  mapBodygramToHealthProfilePayload,
} from '../../../services/profile';
import RoadmapApi from '../../../hooks/roadmap.api';
import LoadingOverlay from '../../../components/LoadingOverlay';
import Toast from '../../../components/Toast';
import ModalPopup from '../../../components/ModalPopup';

type Props = NativeStackScreenProps<RootStackParamList, 'Result'>;

type SourceType = 'Manual' | 'BodyGram' | 'InBody';

function toNumber(value: any): number | null {
  if (value == null || value === '') return null;

  const n = Number(value);

  if (Number.isNaN(n)) return null;

  return n;
}

function round1(value: number | null): number | null {
  if (value == null) return null;

  return Math.round(value * 10) / 10;
}

function mmToCm(mm?: number | null) {
  if (mm == null) return undefined;

  const n = Number(mm);

  if (Number.isNaN(n)) return undefined;

  return +(n / 10).toFixed(0);
}

function gToKg(g?: number | null) {
  if (g == null) return undefined;

  const n = Number(g);

  if (Number.isNaN(n)) return undefined;

  return +(n / 1000).toFixed(0);
}

function getMeasurementCm(
  measurements: any[],
  measurementName: string,
): number | null {
  const item = measurements.find((m) => m?.name === measurementName);

  if (!item) return null;

  const value = toNumber(item.value);

  if (value == null) return null;

  const unit = String(item.unit || '').toLowerCase();

  if (unit === 'mm') return round1(value / 10);
  if (unit === 'cm') return round1(value);

  return round1(value);
}

function parseMetadata(metadata: any) {
  if (!metadata) return {};

  if (typeof metadata === 'object') {
    return metadata;
  }

  if (typeof metadata === 'string') {
    try {
      return JSON.parse(metadata);
    } catch (error) {
      console.log('Parse metadata error:', error);
      return {};
    }
  }

  return {};
}

function calculateBmi(heightCm?: number | null, weightKg?: number | null) {
  if (!heightCm || !weightKg) return null;

  const h = heightCm / 100;

  if (h <= 0) return null;

  return round1(weightKg / (h * h));
}

function extractHealthProfileId(payload: any) {
  const data = payload?.data ?? payload;
  const entry = data?.entry ?? data;

  return (
    entry?.healthProfileId ??
    entry?.profileId ??
    entry?.id ??
    data?.healthProfileId ??
    data?.profileId ??
    data?.id ??
    payload?.healthProfileId ??
    payload?.profileId ??
    payload?.id ??
    null
  );
}

function buildManualHealthProfilePayload(params: {
  measurements: any;
  onboarding: any;
}) {
  const { measurements, onboarding } = params;

  const heightCm =
    toNumber(measurements?.heightCm) ??
    toNumber(measurements?.height) ??
    toNumber(measurements?.height_est) ??
    toNumber(onboarding?.height);

  const weightKg =
    toNumber(measurements?.weightKg) ??
    toNumber(measurements?.weight) ??
    toNumber(measurements?.weight_est) ??
    toNumber(onboarding?.weight);

  const bmi = toNumber(measurements?.bmi) ?? calculateBmi(heightCm, weightKg);

  const bodyFatPercentage =
    toNumber(measurements?.bodyFatPercentage) ??
    toNumber(measurements?.bodyFatPercent);

  const muscleMassKg =
    toNumber(measurements?.muscleMassKg) ??
    toNumber(measurements?.muscleMass);

  const waistCm =
    toNumber(measurements?.waistCm) ?? toNumber(measurements?.waist);

  const hipCm = toNumber(measurements?.hipCm) ?? toNumber(measurements?.hip);

  const bustCm =
    toNumber(measurements?.bustCm) ?? toNumber(measurements?.bust);

  const bicepCm =
    toNumber(measurements?.bicepCm) ?? toNumber(measurements?.bicep);

  const thighCm =
    toNumber(measurements?.thighCm) ?? toNumber(measurements?.thigh);

  const calfCm =
    toNumber(measurements?.calfCm) ?? toNumber(measurements?.calf);

  return {
    heightCm,
    weightKg,
    bmi,
    bodyFatPercentage,
    muscleMassKg,
    waistCm,
    hipCm,
    source: 'Manual',
    metadata: JSON.stringify({
      provider: 'Manual',
      input: {
        heightCm,
        weightKg,
        age: onboarding?.age ?? null,
        gender: onboarding?.gender ?? null,
      },
      bodyComposition: {
        bodyFatPercentage,
        muscleMassKg,
      },
      extraMeasurements: {
        bustCm,
        bicepCm,
        waistCm,
        hipCm,
        thighCm,
        calfCm,
      },
      rawMeasurements: measurements ?? null,
    }),
  };
}

function buildInBodyHealthProfilePayload(params: {
  data: any;
  onboarding: any;
}) {
  const { data, onboarding } = params;

  const entry = data?.entry ?? data?.data ?? data ?? {};
  const metadata = parseMetadata(entry?.metadata);

  const heightCm =
    toNumber(entry?.heightCm) ??
    toNumber(entry?.height) ??
    toNumber(metadata?.heightCm) ??
    toNumber(metadata?.height) ??
    toNumber(onboarding?.height);

  const weightKg =
    toNumber(entry?.weightKg) ??
    toNumber(entry?.weight) ??
    toNumber(metadata?.weightKg) ??
    toNumber(metadata?.weight) ??
    toNumber(onboarding?.weight);

  const bmi =
    toNumber(entry?.bmi) ??
    toNumber(metadata?.bmi) ??
    calculateBmi(heightCm, weightKg);

  const bodyFatPercentage =
    toNumber(entry?.bodyFatPercentage) ??
    toNumber(entry?.bodyFatPercent) ??
    toNumber(entry?.body_fat) ??
    toNumber(metadata?.bodyFatPercentage) ??
    toNumber(metadata?.bodyFatPercent);

  const muscleMassKg =
    toNumber(entry?.muscleMassKg) ??
    toNumber(entry?.muscleMass) ??
    toNumber(entry?.skeletalMuscleMassKg) ??
    toNumber(metadata?.muscleMassKg) ??
    toNumber(metadata?.muscleMass);

  const waistCm =
    toNumber(entry?.waistCm) ??
    toNumber(entry?.waist) ??
    toNumber(metadata?.waistCm) ??
    toNumber(metadata?.waist);

  const hipCm =
    toNumber(entry?.hipCm) ??
    toNumber(entry?.hip) ??
    toNumber(metadata?.hipCm) ??
    toNumber(metadata?.hip);

  const bustCm =
    toNumber(entry?.bustCm) ??
    toNumber(entry?.bust) ??
    toNumber(entry?.chestCm) ??
    toNumber(metadata?.bustCm) ??
    toNumber(metadata?.bust);

  const bicepCm =
    toNumber(entry?.bicepCm) ??
    toNumber(entry?.bicep) ??
    toNumber(entry?.armCm) ??
    toNumber(metadata?.bicepCm) ??
    toNumber(metadata?.bicep);

  const thighCm =
    toNumber(entry?.thighCm) ??
    toNumber(entry?.thigh) ??
    toNumber(metadata?.thighCm) ??
    toNumber(metadata?.thigh);

  const calfCm =
    toNumber(entry?.calfCm) ??
    toNumber(entry?.calf) ??
    toNumber(metadata?.calfCm) ??
    toNumber(metadata?.calf);

  return {
    heightCm,
    weightKg,
    bmi,
    bodyFatPercentage,
    muscleMassKg,
    waistCm,
    hipCm,
    source: 'InBody',
    metadata: JSON.stringify({
      provider: 'InBody',
      input: {
        heightCm,
        weightKg,
        age: onboarding?.age ?? null,
        gender: onboarding?.gender ?? null,
      },
      bodyComposition: {
        bodyFatPercentage,
        muscleMassKg,
      },
      extraMeasurements: {
        bustCm,
        bicepCm,
        waistCm,
        hipCm,
        thighCm,
        calfCm,
      },
      originalMetadata: metadata,
      rawData: entry,
    }),
  };
}

function pickHealthProfileObject(rawResponse: any, rawMeasurements: any) {
  const entry = rawResponse?.entry ?? rawResponse ?? {};
  const data = rawResponse?.data ?? {};
  const rawObj =
    rawMeasurements && !Array.isArray(rawMeasurements) ? rawMeasurements : {};

  if (entry?.metadata || entry?.heightCm || entry?.weightKg) {
    return entry;
  }

  if (data?.metadata || data?.heightCm || data?.weightKg) {
    return data;
  }

  if (rawObj?.metadata || rawObj?.heightCm || rawObj?.weightKg) {
    return rawObj;
  }

  return entry;
}

export default function ResultScreen({ route, navigation }: Props) {
  const { measurements: rawMeasurements, rawResponse } = route.params as any;

  const source = ((route.params as any)?.source ?? 'BodyGram') as SourceType;
  const alreadySaved = Boolean((route.params as any)?.alreadySaved);

  const returnToAfterAssessment =
    (route.params as any)?.returnToAfterAssessment;

  const roadmapFinalUpdate = (route.params as any)?.roadmapFinalUpdate;

  const setData = useOnboardingStore((s) => s.setData);
  const onboarding = useOnboardingStore((s) => s.data);

  const hasValue = (value: any) => {
    return value !== null && value !== undefined && value !== '' && value !== '-';
  };

  const getFadedStyle = (value: any) => {
    return hasValue(value) ? null : styles.fadedItem;
  };

  const renderValue = (value: any, unit = '') => {
    return hasValue(value) ? `${value}${unit}` : '-';
  };

  const summary = useMemo(() => {
    const profile = pickHealthProfileObject(rawResponse, rawMeasurements);

    const heightFromStore =
      onboarding?.height && onboarding.heightUnit === 'cm'
        ? onboarding.height
        : undefined;

    const weightFromStore =
      onboarding?.weight && onboarding.weightUnit === 'kg'
        ? onboarding.weight
        : undefined;

    const measurementsObj =
      rawMeasurements && !Array.isArray(rawMeasurements)
        ? rawMeasurements
        : undefined;

    const entry = rawResponse?.entry ?? rawResponse ?? {};
    const input = entry?.input?.photoScan ?? entry?.input ?? {};

    const hRaw =
      profile?.heightCm ??
      input?.height ??
      input?.heightMm ??
      measurementsObj?.height ??
      measurementsObj?.heightCm ??
      null;

    const wRaw =
      profile?.weightKg ??
      input?.weight ??
      input?.weightG ??
      measurementsObj?.weight ??
      measurementsObj?.weightKg ??
      null;

    const height =
      heightFromStore ??
      (typeof hRaw === 'number'
        ? hRaw > 1000
          ? mmToCm(hRaw)
          : hRaw
        : undefined);

    const weight =
      weightFromStore ??
      (typeof wRaw === 'number'
        ? wRaw > 500
          ? gToKg(wRaw)
          : wRaw
        : undefined);

    const metadata = parseMetadata(profile?.metadata);
    const inputFromMetadata = metadata?.input ?? {};

    const age =
      input?.age ?? inputFromMetadata?.age ?? onboarding?.age ?? undefined;

    const genderRaw =
      input?.gender ??
      inputFromMetadata?.gender ??
      onboarding?.gender ??
      undefined;

    const gender = (
      genderRaw === 'male'
        ? 'Nam'
        : genderRaw === 'female'
          ? 'Nữ'
          : genderRaw
    ) as any;

    return {
      height,
      weight,
      age,
      gender,
    };
  }, [rawMeasurements, rawResponse, onboarding]);

  const display = useMemo(() => {
    const entry = rawResponse?.entry ?? rawResponse ?? {};
    const profile = pickHealthProfileObject(rawResponse, rawMeasurements);

    const out: any =
      rawMeasurements && !Array.isArray(rawMeasurements)
        ? { ...rawMeasurements }
        : {};

    const arr: any[] = Array.isArray(rawMeasurements)
      ? rawMeasurements
      : Array.isArray(entry?.measurements)
        ? entry.measurements
        : Array.isArray(profile?.rawMeasurements)
          ? profile.rawMeasurements
          : [];

    const metadata = parseMetadata(
      profile?.metadata ??
        entry?.metadata ??
        rawResponse?.metadata ??
        rawResponse?.data?.metadata ??
        (rawMeasurements && !Array.isArray(rawMeasurements)
          ? rawMeasurements?.metadata
          : undefined),
    );

    const extra = metadata?.extraMeasurements ?? {};

    const setIfExists = (key: string, bodygramName: string) => {
      const value = getMeasurementCm(arr, bodygramName);

      if (value != null) {
        out[key] = value;
      }
    };

    setIfExists('bust', 'bustGirth');
    setIfExists('underBust', 'underBustGirth');
    setIfExists('waist', 'waistGirth');

    if (out.waist == null) {
      setIfExists('waist', 'bellyWaistGirth');
    }

    setIfExists('hip', 'hipGirth');
    setIfExists('thigh', 'thighGirthR');
    setIfExists('midThigh', 'midThighGirthR');
    setIfExists('calf', 'calfGirthR');
    setIfExists('forearm', 'forearmGirthR');
    setIfExists('wrist', 'wristGirthR');
    setIfExists('knee', 'kneeGirthR');
    setIfExists('neck', 'neckGirth');
    setIfExists('neckBase', 'neckBaseGirth');
    setIfExists('shoulder', 'acrossBackShoulderWidth');
    setIfExists('bicep', 'upperArmGirthR');

    out.heightCm = out.heightCm ?? profile?.heightCm;
    out.weightKg = out.weightKg ?? profile?.weightKg;
    out.bmi = out.bmi ?? profile?.bmi;
    out.bodyFatPercentage =
      out.bodyFatPercentage ?? profile?.bodyFatPercentage;
    out.muscleMassKg = out.muscleMassKg ?? profile?.muscleMassKg;

    out.waist = out.waist ?? profile?.waistCm;
    out.hip = out.hip ?? profile?.hipCm;

    out.bust = out.bust ?? profile?.bustCm ?? extra?.bustCm;
    out.underBust = out.underBust ?? profile?.underBustCm ?? extra?.underBustCm;
    out.bicep = out.bicep ?? profile?.bicepCm ?? extra?.bicepCm;
    out.waist = out.waist ?? profile?.waistCm ?? extra?.waistCm;
    out.hip = out.hip ?? profile?.hipCm ?? extra?.hipCm;
    out.thigh = out.thigh ?? profile?.thighCm ?? extra?.thighCm;
    out.midThigh = out.midThigh ?? profile?.midThighCm ?? extra?.midThighCm;
    out.shoulder = out.shoulder ?? profile?.shoulderCm ?? extra?.shoulderCm;
    out.neck = out.neck ?? profile?.neckCm ?? extra?.neckCm;
    out.neckBase = out.neckBase ?? profile?.neckBaseCm ?? extra?.neckBaseCm;
    out.calf = out.calf ?? profile?.calfCm ?? extra?.calfCm;
    out.forearm = out.forearm ?? profile?.forearmCm ?? extra?.forearmCm;
    out.wrist = out.wrist ?? profile?.wristCm ?? extra?.wristCm;
    out.knee = out.knee ?? profile?.kneeCm ?? extra?.kneeCm;

    console.log('ResultScreen source:', source);
    console.log('ResultScreen alreadySaved:', alreadySaved);
    console.log('ResultScreen returnToAfterAssessment:', returnToAfterAssessment);
    console.log('ResultScreen roadmapFinalUpdate:', roadmapFinalUpdate);
    console.log('ResultScreen profile:', profile);
    console.log('ResultScreen display:', out);

    return out;
  }, [
    rawMeasurements,
    rawResponse,
    source,
    alreadySaved,
    returnToAfterAssessment,
    roadmapFinalUpdate,
  ]);

  const whr =
    display.waist && display.hip
      ? (display.waist / display.hip).toFixed(2)
      : undefined;

  const [loading, setLoading] = useState(false);

  const [toastVisible, setToastVisible] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>(
    'info',
  );

  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<
    'noti' | 'confirm' | 'toast'
  >('noti');
  const [modalTitle, setModalTitle] = useState<string | undefined>(
    undefined,
  );
  const [modalContent, setModalContent] = useState('');
  const [modalConfirmHandler, setModalConfirmHandler] = useState<
    (() => void) | undefined
  >(undefined);

  const showModal = (opts: {
    title?: string;
    content: string;
    mode?: 'noti' | 'confirm' | 'toast';
    onConfirm?: () => void;
  }) => {
    setModalTitle(opts.title);
    setModalContent(opts.content);
    setModalMode(opts.mode ?? 'noti');
    setModalConfirmHandler(() => opts.onConfirm);
    setModalVisible(true);
  };

  const hideModal = () => {
    setModalVisible(false);
  };

  const sanitizeForLog = (obj: any) => {
    try {
      return JSON.parse(
        JSON.stringify(obj, (k, v) => {
          if (
            k &&
            typeof k === 'string' &&
            k.toLowerCase().includes('avatar')
          ) {
            return '<omitted_avatar>';
          }

          return v;
        }),
      );
    } catch (err) {
      return '<non-serializable>';
    }
  };

  const saveMeasurements = async () => {
    try {
      const map: any = {};

      if (display.shoulder) map.shoulder = display.shoulder;
      if (display.waist) map.waist = display.waist;
      if (display.hip) map.hip = display.hip;
      if (display.thigh) map.thigh = display.thigh;
      if (display.bust) map.bust = display.bust;
      if (display.bicep) map.bicep = display.bicep;
      if (display.calf) map.calf = display.calf;

      if (onboarding?.height) map.height = onboarding.height;
      if (onboarding?.weight) map.weight = onboarding.weight;

      if (Object.keys(map).length > 0) {
        setData(map);

        await AsyncStorage.setItem(
          'bodygram:savedMeasurements',
          JSON.stringify({
            ...display,
            height: onboarding?.height ?? null,
            weight: onboarding?.weight ?? null,
          }),
        );
      }
    } catch (e) {
      console.log('Save measurements error', e);
    }
  };

  const updateRoadmapFinalProfileIfNeeded = async (
    profileId?: string | null,
  ) => {
    if (!roadmapFinalUpdate?.roadmapId || !profileId) {
      return;
    }

    console.log('PATCH finalHealthProfileId for roadmap:', {
      roadmapId: roadmapFinalUpdate.roadmapId,
      finalHealthProfileId: profileId,
    });

    await RoadmapApi.updateFinalHealthProfile(
      String(roadmapFinalUpdate.roadmapId),
      String(profileId),
    );
  };

  const goNextAfterSuccess = async (profileId?: string | null) => {
    hideModal();

    try {
      await updateRoadmapFinalProfileIfNeeded(profileId);
    } catch (err: any) {
      console.log('updateFinalHealthProfile error:', err);

      setToastType('error');
      setToastMsg(
        err?.response?.data?.message ??
          err?.message ??
          'Không thể cập nhật số đo cuối cho lộ trình.',
      );
      setToastVisible(true);

      showModal({
        title: 'Lỗi cập nhật lộ trình',
        content:
          err?.response?.data?.message ??
          err?.message ??
          'Không thể gắn hồ sơ sức khỏe cuối vào lộ trình.',
        mode: 'noti',
      });

      return;
    }

    if (profileId) {
      try {
        (navigation as any).reset({
          index: 0,
          routes: [
            {
              name: 'HealthProfileAssessment',
              params: {
                healthProfileId: String(profileId),
                returnToAfterAssessment,
              },
            },
          ],
        });
      } catch {
        navigation.navigate(
          'HealthProfileAssessment' as any,
          {
            healthProfileId: String(profileId),
            returnToAfterAssessment,
          } as any,
        );
      }

      return;
    }

    try {
      (navigation as any).reset({
        index: 0,
        routes: [{ name: 'MainTabs' }],
      });
    } catch {
      navigation.navigate('MainTabs' as any);
    }
  };

  const handleSubmitAll = async () => {
    setToastVisible(false);
    setLoading(true);

    showModal({
      title: 'Đang xử lý',
      content: 'Đang xử lý dữ liệu sức khỏe, vui lòng chờ...',
      mode: 'noti',
    });

    try {
      const profile = pickHealthProfileObject(rawResponse, rawMeasurements);

      if (
        source === 'InBody' &&
        (alreadySaved || profile?.healthProfileId || profile?.id)
      ) {
        setLoading(false);

        await saveMeasurements();

        setToastType('success');
        setToastMsg('Kết quả InBody đã được lưu');
        setToastVisible(true);
        hideModal();

        const profileId = extractHealthProfileId(profile);

        if (!profileId) {
          showModal({
            title: 'Thiếu dữ liệu',
            content: 'Không tìm thấy healthProfileId từ kết quả InBody.',
            mode: 'noti',
          });

          return;
        }

        showModal({
          title: 'Thành công',
          content: roadmapFinalUpdate?.roadmapId
            ? 'Kết quả InBody đã được lưu. Tiếp tục để gắn số đo cuối vào lộ trình.'
            : 'Kết quả InBody đã được lưu.',
          mode: 'noti',
          onConfirm: () => {
            void goNextAfterSuccess(String(profileId));
          },
        });

        return;
      }

      const healthProfilePayload =
        source === 'Manual'
          ? buildManualHealthProfilePayload({
              measurements: rawMeasurements,
              onboarding,
            })
          : source === 'InBody'
            ? buildInBodyHealthProfilePayload({
                data: rawResponse ?? rawMeasurements,
                onboarding,
              })
            : mapBodygramToHealthProfilePayload({
                bodyGram: rawResponse,
                onboarding,
                source: 'BodyGram',
              });

      console.log('RESULT source:', source);
      console.log(
        'DEBUG healthProfilePayload:',
        sanitizeForLog(healthProfilePayload),
      );

      const hRes = await submitHealthProfile(healthProfilePayload);

      setLoading(false);

      if (hRes.ok) {
        await saveMeasurements();

        setToastType('success');
        setToastMsg('Lưu hồ sơ sức khỏe thành công');
        setToastVisible(true);
        hideModal();

        const profileId = extractHealthProfileId(hRes);

        if (!profileId) {
          showModal({
            title: 'Thiếu dữ liệu',
            content: 'Không tìm thấy healthProfileId sau khi lưu hồ sơ.',
            mode: 'noti',
          });

          return;
        }

        showModal({
          title: 'Lưu thành công',
          content: roadmapFinalUpdate?.roadmapId
            ? 'Hồ sơ sức khỏe đã được lưu. Tiếp tục để gắn số đo cuối vào lộ trình.'
            : 'Hồ sơ sức khỏe đã được lưu thành công.',
          mode: 'noti',
          onConfirm: () => {
            void goNextAfterSuccess(String(profileId));
          },
        });

        return;
      }

      const msg =
        typeof hRes.error === 'string'
          ? hRes.error
          : JSON.stringify(hRes.error);

      console.warn('submitHealthProfile error', hRes.error);

      setToastType('error');
      setToastMsg(`Lỗi khi lưu: ${msg}`);
      setToastVisible(true);
      hideModal();

      showModal({
        title: 'Lỗi',
        content: msg,
        mode: 'noti',
      });
    } catch (e: any) {
      setLoading(false);

      const msg = e?.message ?? String(e);

      console.error('submit health profile thrown error', e);

      setToastType('error');
      setToastMsg(`Lỗi khi lưu: ${msg}`);
      setToastVisible(true);
      hideModal();

      showModal({
        title: 'Lỗi',
        content: msg,
        mode: 'noti',
      });
    }
  };

  const detailItems = [
    { key: 'bmi', label: 'BMI', unit: '' },
    {
      key: 'bodyFatPercentage',
      label: '% Mỡ cơ thể',
      unit: '%',
    },
    {
      key: 'muscleMassKg',
      label: 'Khối lượng cơ',
      unit: 'kg',
    },
    { key: 'bust', label: 'Ngực', unit: 'cm' },
    { key: 'waist', label: 'Eo', unit: 'cm' },
    { key: 'hip', label: 'Hông', unit: 'cm' },
    { key: 'bicep', label: 'Bắp tay', unit: 'cm' },
    { key: 'thigh', label: 'Đùi', unit: 'cm' },
    { key: 'calf', label: 'Bắp chân', unit: 'cm' },
  ];

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1 p-4">
        <View className="bg-amber-100 rounded-xl p-4 mb-4 flex-row items-center justify-between">
          <Pressable
            className="p-2"
            onPress={() => {
              try {
                if (
                  navigation &&
                  typeof navigation.canGoBack === 'function' &&
                  navigation.canGoBack()
                ) {
                  navigation.goBack();
                } else {
                  (navigation as any).reset({
                    index: 0,
                    routes: [{ name: 'MainTabs' }],
                  });
                }
              } catch (err) {
                try {
                  (navigation as any).reset({
                    index: 0,
                    routes: [{ name: 'MainTabs' }],
                  });
                } catch {
                  // noop
                }
              }
            }}
            accessibilityRole="button"
            accessibilityLabel="Quay lại"
          >
            <Text className="text-2xl text-gray-700">‹</Text>
          </Pressable>

          <Text className="text-center text-gray-700 flex-1 px-2">
            {`Chiều cao: ${summary.height ?? '-'}cm   Cân nặng: ${
              summary.weight ?? '-'
            }kg   ${summary.age ?? ''} tuổi   ${summary.gender ?? ''}`}
          </Text>

          <View className="w-8" />
        </View>

        <View className="bg-white rounded-xl p-4 items-center mb-4">
          <View className="w-64 h-80 items-center justify-center">
            <Image
              source={require('../../../assets/bodygram.png')}
              className="w-full h-full"
              resizeMode="contain"
            />

            <View className="absolute top-8 left-3">
              <View
                className="bg-amber-200 rounded-lg px-3 py-2 shadow"
                style={getFadedStyle(display.bust)}
              >
                <Text className="text-xs text-gray-800">Ngực</Text>
                <Text className="text-lg font-extrabold">
                  {renderValue(display.bust, 'cm')}
                </Text>
              </View>
            </View>

            <View className="absolute top-24 left-4">
              <View
                className="bg-amber-200 rounded-lg px-3 py-2 shadow"
                style={getFadedStyle(display.waist)}
              >
                <Text className="text-xs text-gray-800">Eo</Text>
                <Text className="text-lg font-extrabold">
                  {renderValue(display.waist, 'cm')}
                </Text>
              </View>
            </View>

            <View className="absolute top-24 right-4">
              <View
                className="bg-amber-200 rounded-lg px-3 py-2 shadow"
                style={getFadedStyle(display.hip)}
              >
                <Text className="text-xs text-gray-800">Hông</Text>
                <Text className="text-lg font-extrabold">
                  {renderValue(display.hip, 'cm')}
                </Text>
              </View>
            </View>

            <View className="absolute bottom-9 left-7">
              <View
                className="bg-amber-200 rounded-lg px-3 py-2 shadow"
                style={getFadedStyle(display.thigh)}
              >
                <Text className="text-xs text-gray-800">Đùi</Text>
                <Text className="text-lg font-extrabold">
                  {renderValue(display.thigh, 'cm')}
                </Text>
              </View>
            </View>

            <View className="absolute top-9 right-7">
              <View
                className="bg-amber-200 rounded-lg px-3 py-2 shadow"
                style={getFadedStyle(display.bicep)}
              >
                <Text className="text-xs text-gray-800">Bắp tay</Text>
                <Text className="text-lg font-extrabold">
                  {renderValue(display.bicep, 'cm')}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View
          className="bg-amber-100 rounded-xl p-4 mb-4"
          style={getFadedStyle(whr)}
        >
          <Text className="text-base font-semibold mb-2">
            Chỉ số sức khỏe
          </Text>

          <View className="flex-row justify-between items-center">
            <Text className="text-sm text-gray-700">
              Waist-to-Hip Ratio
            </Text>

            <Text className="text-xl font-extrabold">
              {hasValue(whr) ? whr : '-'}
            </Text>
          </View>
        </View>

        <Text className="text-lg font-extrabold mb-3">
          Số đo chi tiết
        </Text>

        <View className="flex-row flex-wrap -m-2">
          {detailItems.map((t) => {
            const value = display[t.key];

            return (
              <View key={t.key} className="w-1/2 p-2">
                <View
                  className="bg-background-sub2 rounded-xl p-4 shadow"
                  style={getFadedStyle(value)}
                >
                  <Text className="text-sm text-gray-700">
                    {t.label}
                  </Text>

                  <Text className="text-2xl font-extrabold mt-2">
                    {renderValue(value, t.unit)}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        <View className="mt-6">
          <TouchableOpacity
            onPress={handleSubmitAll}
            disabled={loading}
            style={[
              styles.saveBtn,
              loading ? styles.saveBtnDisabled : null,
            ]}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveBtnText}>
                {source === 'InBody' && alreadySaved
                  ? roadmapFinalUpdate?.roadmapId
                    ? 'Lưu số đo cuối'
                    : 'Tiếp tục'
                  : roadmapFinalUpdate?.roadmapId
                    ? 'Lưu số đo cuối'
                    : 'Lưu kết quả'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {loading ? <LoadingOverlay /> : null}

        <Toast
          visible={toastVisible}
          message={toastMsg}
          type={toastType}
          onHidden={() => setToastVisible(false)}
        />

        <ModalPopup
          {...({
            visible: modalVisible,
            mode: modalMode,
            onClose: () => setModalVisible(false),
            titleText: modalTitle,
            contentText: modalContent,
            confirmBtnText: 'Đóng',
            onConfirm: modalConfirmHandler,
          } as any)}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  saveBtn: {
    backgroundColor: '#A0522D',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    marginHorizontal: 2,
  },
  saveBtnDisabled: {
    backgroundColor: '#c4c4c4',
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  fadedItem: {
    opacity: 0.35,
  },
});