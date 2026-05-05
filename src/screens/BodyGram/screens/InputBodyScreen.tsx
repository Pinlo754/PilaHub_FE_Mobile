import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import MeasurementModal from '../components/MeasurementModal';
import {
  useOnboardingStore,
  OnboardingData,
} from '../../../store/onboarding.store';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LoadingOverlay from '../../../components/LoadingOverlay';
import Toast from '../../../components/Toast';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import BodyInputOptions from '../components/BodyInputOptions';
import ManualBodyInputSection from '../components/ManualBodyInputSection';



type Props = NativeStackScreenProps<RootStackParamList, 'InputBody'>;

type MeasurementKey =
  | 'waist'
  | 'bust'
  | 'hip'
  | 'thigh'
  | 'bicep'
  | 'calf'
  | 'bodyFatPercent'
  | 'muscleMass'
  | 'height'
  | 'weight';

function isEmptyValue(value: unknown) {
  return value === undefined || value === null || value === '';
}

function normalizeGender(value: unknown): 'male' | 'female' | undefined {
  if (typeof value !== 'string') return undefined;

  const text = value.toLowerCase().trim();

  if (text === 'male' || text === 'nam') return 'male';
  if (text === 'female' || text === 'nữ' || text === 'nu') return 'female';

  return undefined;
}

function allMeasurementsFilled(onboarding: OnboardingData | null | undefined) {
  if (!onboarding) return false;

  const required: Array<keyof OnboardingData> = [
    'waist',
    'bust',
    'hip',
    'thigh',
    'bicep',
    'calf',
    'height',
    'weight',
  ];

  return required.every(k => !isEmptyValue(onboarding[k]));
}

function round1(value: number) {
  return Math.round(value * 10) / 10;
}

function normalizeHeightToCm(
  height?: number | string | null,
  unit?: string | null,
) {
  if (isEmptyValue(height)) return undefined;

  let h = Number(height);

  if (Number.isNaN(h) || h <= 0) return undefined;

  const hUnit = unit ?? 'cm';

  if (hUnit === 'm') {
    h = h * 100;
  } else if (hUnit === 'in' || hUnit === 'inch') {
    h = h * 2.54;
  } else if (hUnit === 'mm') {
    h = h / 10;
  }

  return round1(h);
}

function normalizeWeightToKg(
  weight?: number | string | null,
  unit?: string | null,
) {
  if (isEmptyValue(weight)) return undefined;

  let w = Number(weight);

  if (Number.isNaN(w) || w <= 0) return undefined;

  const wUnit = unit ?? 'kg';

  if (wUnit === 'lb' || wUnit === 'lbs') {
    w = w * 0.45359237;
  } else if (wUnit === 'g' || wUnit === 'gram') {
    w = w / 1000;
  }

  return round1(w);
}

function computeBmi(
  heightCm?: number | undefined,
  weightKg?: number | undefined,
) {
  if (!heightCm || !weightKg) return undefined;

  const h = heightCm / 100;

  if (h <= 0) return undefined;

  const bmi = weightKg / (h * h);

  return Math.round(bmi * 10) / 10;
}

function parseMetadata(metadata: any) {
  if (!metadata) return {};

  if (typeof metadata === 'object') return metadata;

  if (typeof metadata === 'string') {
    try {
      return JSON.parse(metadata);
    } catch {
      return {};
    }
  }

  return {};
}

function getExtraMeasurementsFromProfile(profile: any) {
  const metadata = parseMetadata(profile?.metadata);

  return {
    metadata,
    input: metadata?.input ?? {},
    extra: metadata?.extraMeasurements ?? {},
    bodyComposition: metadata?.bodyComposition ?? {},
  };
}

export default function InputBodyScreen({ navigation, route }: Props) {
  const returnToAfterAssessment =
    (route.params as any)?.returnToAfterAssessment;

  const roadmapFinalUpdate = (route.params as any)?.roadmapFinalUpdate;

  const bodyInputSeed = (route.params as any)?.bodyInputSeed;

  const labelMap: Record<MeasurementKey, string> = {
    waist: 'Eo',
    bust: 'Ngực',
    hip: 'Hông',
    thigh: 'Đùi',
    bicep: 'Bắp Tay',
    calf: 'Bắp Chân',
    bodyFatPercent: '% Mỡ Cơ Thể',
    muscleMass: 'Khối Lượng Cơ',
    height: 'Chiều Cao',
    weight: 'Cân Nặng',
  };

  const [manualMode, setManualMode] = useState(false);

  const [modal, setModal] = useState<{
    key: MeasurementKey | '';
    visible: boolean;
  }>({
    key: '',
    visible: false,
  });

  const onboarding = useOnboardingStore(s => s.data);
  const setData = useOnboardingStore(s => s.setData);
  const setStep = useOnboardingStore(s => s.setStep);

  const [loading, _setLoading] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMsg, _setToastMsg] = useState('');
  const [toastType, _setToastType] = useState<
    'success' | 'error' | 'info'
  >('info');

  useEffect(() => {
    setModal({ key: '', visible: false });
  }, []);

  const seedHydratedRef = useRef(false);

  useEffect(() => {
    if (seedHydratedRef.current) return;
    if (!bodyInputSeed?.profile) return;

    const profile = bodyInputSeed.profile;
    const { input, extra, bodyComposition } =
      getExtraMeasurementsFromProfile(profile);

    const update: Partial<OnboardingData> = {};

    if (isEmptyValue(onboarding?.height) && profile?.heightCm != null) {
      update.height = Number(profile.heightCm);
      update.heightUnit = 'cm';
    }

    if (isEmptyValue(onboarding?.weight) && profile?.weightKg != null) {
      update.weight = Number(profile.weightKg);
      update.weightUnit = 'kg';
    }

    if (
      isEmptyValue(onboarding?.bodyFatPercent) &&
      (profile?.bodyFatPercentage != null ||
        bodyComposition?.bodyFatPercentage != null)
    ) {
      update.bodyFatPercent = Number(
        profile?.bodyFatPercentage ?? bodyComposition?.bodyFatPercentage,
      );
    }

    if (
      isEmptyValue(onboarding?.muscleMass) &&
      (profile?.muscleMassKg != null || bodyComposition?.muscleMassKg != null)
    ) {
      update.muscleMass = Number(
        profile?.muscleMassKg ?? bodyComposition?.muscleMassKg,
      );
    }

    if (
      isEmptyValue(onboarding?.waist) &&
      (profile?.waistCm != null || extra?.waistCm != null)
    ) {
      update.waist = Number(profile?.waistCm ?? extra?.waistCm);
    }

    if (
      isEmptyValue(onboarding?.hip) &&
      (profile?.hipCm != null || extra?.hipCm != null)
    ) {
      update.hip = Number(profile?.hipCm ?? extra?.hipCm);
    }

    if (
      isEmptyValue(onboarding?.bust) &&
      (profile?.bustCm != null || extra?.bustCm != null)
    ) {
      update.bust = Number(profile?.bustCm ?? extra?.bustCm);
    }

    if (
      isEmptyValue(onboarding?.bicep) &&
      (profile?.bicepCm != null || extra?.bicepCm != null)
    ) {
      update.bicep = Number(profile?.bicepCm ?? extra?.bicepCm);
    }

    if (
      isEmptyValue(onboarding?.thigh) &&
      (profile?.thighCm != null || extra?.thighCm != null)
    ) {
      update.thigh = Number(profile?.thighCm ?? extra?.thighCm);
    }

    if (
      isEmptyValue(onboarding?.calf) &&
      (profile?.calfCm != null || extra?.calfCm != null)
    ) {
      update.calf = Number(profile?.calfCm ?? extra?.calfCm);
    }

    if (isEmptyValue(onboarding?.age) && input?.age != null) {
      update.age = Number(input.age);
    }

    if (isEmptyValue(onboarding?.gender) && input?.gender != null) {
      const normalizedGender = normalizeGender(input.gender);

      if (normalizedGender) {
        update.gender = normalizedGender;
      }
    }

    if (Object.keys(update).length > 0) {
      console.log('Hydrate InputBody from Roadmap bodyInputSeed:', update);
      setData(update);
    }

    seedHydratedRef.current = true;
  }, [bodyInputSeed, onboarding, setData]);

  const hydrateRanRef = useRef(false);

  useEffect(() => {
    if (hydrateRanRef.current) return;

    (async () => {
      hydrateRanRef.current = true;

      try {
        const measRaw = await AsyncStorage.getItem(
          'bodygram:lastMeasurements',
        );

        if (measRaw) {
          const meas = JSON.parse(measRaw || '{}');
          const update: Partial<OnboardingData> = {};

          if (
            (meas.bodyFatPercentage ??
              meas.body_fat ??
              meas.bodyfat) != null &&
            onboarding?.bodyFatPercent == null
          ) {
            update.bodyFatPercent =
              meas.bodyFatPercentage ?? meas.body_fat ?? meas.bodyfat;
          }

          if (
            (meas.muscleMassKg ??
              meas.muscle_mass_kg ??
              meas.musclemass) != null &&
            onboarding?.muscleMass == null
          ) {
            update.muscleMass =
              meas.muscleMassKg ??
              meas.muscle_mass_kg ??
              meas.musclemass;
          }

          if (Object.keys(update).length > 0) {
            setData(update);

            console.log(
              'Hydrated onboarding from bodygram:lastMeasurements',
              update,
            );

            return;
          }
        }

        const respRaw = await AsyncStorage.getItem(
          'bodygram:lastResponse',
        );

        if (respRaw) {
          const resp = JSON.parse(respRaw || '{}');
          const entry = resp.entry ?? resp;

          const bc =
            entry.bodyComposition ??
            entry.body_composition ??
            entry.bodyCompositionResult ??
            {};

          const update: Partial<OnboardingData> = {};

          if (
            (bc.bodyFatPercentage ??
              bc.bodyFatPercent ??
              bc.body_fat) != null &&
            onboarding?.bodyFatPercent == null
          ) {
            update.bodyFatPercent =
              bc.bodyFatPercentage ?? bc.bodyFatPercent ?? bc.body_fat;
          }

          if (
            (bc.muscleMassKg ??
              bc.muscle_mass_kg ??
              bc.muscle_mass) != null &&
            onboarding?.muscleMass == null
          ) {
            update.muscleMass =
              bc.muscleMassKg ?? bc.muscle_mass_kg ?? bc.muscle_mass;
          }

          if (
            (resp.bodyFatPercentage ?? resp.body_fat) != null &&
            onboarding?.bodyFatPercent == null
          ) {
            update.bodyFatPercent =
              update.bodyFatPercent ??
              resp.bodyFatPercentage ??
              resp.body_fat;
          }

          if (
            (resp.muscleMassKg ?? resp.muscle_mass) != null &&
            onboarding?.muscleMass == null
          ) {
            update.muscleMass =
              update.muscleMass ??
              resp.muscleMassKg ??
              resp.muscle_mass;
          }

          if (Object.keys(update).length > 0) {
            setData(update);

            console.log(
              'Hydrated onboarding from bodygram:lastResponse',
              update,
            );
          }
        }
      } catch (e) {
        console.warn('Could not hydrate bodygram results into onboarding', e);
      }
    })();
  }, [setData, onboarding]);

  const openModal = (key: string) => {
    setModal({
      key: key as MeasurementKey,
      visible: true,
    });
  };

  const closeModal = () => {
    setModal({ key: '', visible: false });
  };

  const getOnboardingValue = (key: MeasurementKey | '') => {
    if (!key) return undefined;

    const value = onboarding?.[key];

    if (typeof value === 'number') {
      return value;
    }

    return undefined;
  };

  const save = (value: number | undefined) => {
    if (!modal.key) return;

    const key = modal.key;

    const update = {
      [key]: value,
    } as Partial<OnboardingData>;

    if (key === 'height') {
      update.heightUnit = 'cm';
    }

    if (key === 'weight') {
      update.weightUnit = 'kg';
    }

    setData(update);
  };

  const allFilled = allMeasurementsFilled(onboarding);

  const bmiValue =
    onboarding?.bmi ??
    computeBmi(
      normalizeHeightToCm(
        onboarding?.height,
        onboarding?.heightUnit ?? 'cm',
      ),
      normalizeWeightToKg(
        onboarding?.weight,
        onboarding?.weightUnit ?? 'kg',
      ),
    ) ??
    '—';

  const handleContinue = () => {
    if (!allFilled) {
      Alert.alert(
        'Thiếu thông tin',
        'Vui lòng nhập đầy đủ các thông số trước khi tiếp tục.',
      );
      return;
    }

    const meas: any = {};

    if (onboarding?.waist != null) meas.waist = Number(onboarding.waist);
    if (onboarding?.hip != null) meas.hip = Number(onboarding.hip);
    if (onboarding?.thigh != null) meas.thigh = Number(onboarding.thigh);
    if (onboarding?.bicep != null) meas.bicep = Number(onboarding.bicep);
    if (onboarding?.calf != null) meas.calf = Number(onboarding.calf);
    if (onboarding?.bust != null) meas.bust = Number(onboarding.bust);

    const heightCm = normalizeHeightToCm(
      onboarding?.height,
      onboarding?.heightUnit ?? 'cm',
    );

    if (heightCm != null) {
      meas.height_est = heightCm;
      meas.height = heightCm;
      meas.heightCm = heightCm;
    }

    const weightKg = normalizeWeightToKg(
      onboarding?.weight,
      onboarding?.weightUnit ?? 'kg',
    );

    if (weightKg != null) {
      meas.weight_est = weightKg;
      meas.weight = weightKg;
      meas.weightKg = weightKg;
    }

    if (onboarding?.bodyFatPercent != null) {
      meas.bodyFatPercent = Number(onboarding.bodyFatPercent);
      meas.bodyFatPercentage = Number(onboarding.bodyFatPercent);
    }

    if (onboarding?.muscleMass != null) {
      meas.muscleMass = Number(onboarding.muscleMass);
      meas.muscleMassKg = Number(onboarding.muscleMass);
    }

    const h = meas.heightCm ?? meas.height_est ?? meas.height;
    const w = meas.weightKg ?? meas.weight_est ?? meas.weight;

    if (h && w) {
      const hMeter = h / 100;
      meas.bmi = Math.round((w / (hMeter * hMeter)) * 10) / 10;
    }

    meas.input = {
      source: 'manual',
      age: onboarding?.age ?? null,
      gender: onboarding?.gender ?? null,
    };

    console.log('MANUAL -> Result measurements:', meas);

    navigation.navigate('Result' as any, {
      measurements: meas,
      rawResponse: null,
      source: 'Manual',
      returnToAfterAssessment,
      roadmapFinalUpdate,
    });
  };

  const handleBack = () => {
    if (manualMode) {
      setManualMode(false);
      return;
    }

    try {
      const state = navigation.getState?.();
      const routes = state?.routes ?? [];
      const prev = routes[routes.length - 2];

      if (
        routes.length >= 2 &&
        prev?.name &&
        prev.name !== 'InputBody'
      ) {
        if (navigation.canGoBack && navigation.canGoBack()) {
          navigation.goBack();
        }

        return;
      }
    } catch {
      // ignore
    }

    try {
      setStep(6);
    } catch {
      // ignore
    }

    navigation.navigate('Onboarding' as any);
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <Pressable
          onPress={handleBack}
          style={styles.backBtn}
          accessibilityLabel="Quay lại"
          accessibilityRole="button"
        >
                    <Ionicons name="arrow-back" size={22} color="#0F172A" />
        
        </Pressable>

        <ScrollView
          className="flex-1 bg-background p-4"
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            styles.scrollContent,
            manualMode && styles.scrollContentManual,
          ]}
        >
          <View className="items-center mb-4" style={styles.headerContainer}>
            <Text className="text-2xl font-semibold text-foreground text-center">
              Nhập thông tin cơ thể
            </Text>

            <Text className="text-sm text-secondaryText text-center mt-2 px-6">
              Bạn có thể chọn quét cơ thể, dùng InBody hoặc nhập thông tin cơ bản thủ công.
            </Text>
          </View>

          {!manualMode ? (
            <BodyInputOptions
              onInBodyPress={() =>
                navigation.navigate('InBodyScan' as any, {
                  returnToAfterAssessment,
                  roadmapFinalUpdate,
                })
              }
              onBodyScanPress={() =>
                navigation.navigate('BodyScanFlow' as any, {
                  returnToAfterAssessment,
                  roadmapFinalUpdate,
                })
              }
              onManualPress={() => setManualMode(true)}
            />
          ) : (
            <ManualBodyInputSection
              onboarding={onboarding}
              bmiValue={bmiValue}
              openModal={openModal}
            />
          )}
        </ScrollView>

        {manualMode ? (
          <View style={styles.bottomBar}>
            <Pressable
              onPress={() => setManualMode(false)}
              style={[styles.cancelBtn, styles.centerContent]}
            >
              <Text style={styles.cancelBtnText}>Hủy</Text>
            </Pressable>

            <Pressable
              disabled={!allFilled}
              onPress={handleContinue}
              style={[
                styles.fillBtn,
                styles.centerContent,
                !allFilled && styles.fillBtnDisabled,
              ]}
            >
              <Text style={styles.fillBtnText}>Tiếp tục</Text>
            </Pressable>
          </View>
        ) : null}

        {loading ? <LoadingOverlay /> : null}

        <Toast
          visible={toastVisible}
          message={toastMsg}
          type={toastType}
          onHidden={() => setToastVisible(false)}
        />

        <MeasurementModal
          visible={modal.visible}
          label={modal.key ? labelMap[modal.key] : ''}
          initialValue={getOnboardingValue(modal.key)}
          onClose={closeModal}
          onSave={save}
          unit={
            modal.key === 'muscleMass'
              ? 'kg'
              : modal.key === 'bodyFatPercent'
                ? '%'
                : 'cm'
          }
          subtitle={
            modal.key === 'bodyFatPercent'
              ? 'Nhập tỷ lệ phần trăm, ví dụ 18.5'
              : modal.key === 'muscleMass'
                ? 'Nhập khối lượng cơ bằng kg'
                : 'Ước lượng gần đúng. Nhập số theo cm.'
          }
          placeholder={
            modal.key === 'bodyFatPercent'
              ? 'Ví dụ: 18.5'
              : modal.key === 'muscleMass'
                ? 'Ví dụ: 55'
                : 'Ví dụ: 72'
          }
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  scrollContentManual: {
    paddingBottom: 120,
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtn: {
    position: 'absolute',
    left: 8,
    top: 8,
    padding: 12,
    zIndex: 2000,
  },
  headerContainer: {
    position: 'relative',
    paddingTop: 8,
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 28 : 16,
    backgroundColor: '#FFF8ED',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
    flexDirection: 'row',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    borderRadius: 12,
    minHeight: 48,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  cancelBtnText: {
    color: '#111827',
    fontWeight: '700',
    fontSize: 16,
  },
  fillBtn: {
    flex: 1,
    backgroundColor: '#B5651D',
    paddingVertical: 14,
    borderRadius: 12,
    minHeight: 48,
    paddingHorizontal: 10,
  },
  fillBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  fillBtnDisabled: {
    opacity: 0.55,
  },
});