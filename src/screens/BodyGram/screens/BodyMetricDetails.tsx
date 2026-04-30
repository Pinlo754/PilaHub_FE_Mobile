import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Dimensions,
  Image,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import {
  fetchMyHealthProfileMetrics,
  fetchLatestHealthProfile,
  createHealthProfile,
  buildHealthProfilePayload,
} from '../../../services/profile';
import { LineChart } from 'react-native-chart-kit';
import Ionicons from '@react-native-vector-icons/ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

type ActiveMetric =
  | 'weightKg'
  | 'bmi'
  | 'bodyFatPercentage'
  | 'muscleMassKg'
  | 'waistCm'
  | 'hipCm';

export default function BodyMetricDetails({ navigation }: any) {
  const [metricsData, setMetricsData] = useState<any | null>(null);
  const [profile, setProfile] = useState<any | null>(null);

  const [activeMetric, setActiveMetric] =
    useState<ActiveMetric>('weightKg');

  const [menuVisible, setMenuVisible] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const [heightInput, setHeightInput] = useState<string>('');
  const [weightInput, setWeightInput] = useState<string>('');
  const [bmiInput, setBmiInput] = useState<string>('');
  const [bodyFatInput, setBodyFatInput] = useState<string>('');
  const [muscleInput, setMuscleInput] = useState<string>('');
  const [waistInput, setWaistInput] = useState<string>('');
  const [hipInput, setHipInput] = useState<string>('');
  const [bustInput, setBustInput] = useState<string>('');
  const [bicepInput, setBicepInput] = useState<string>('');
  const [thighInput, setThighInput] = useState<string>('');
  const [calfInput, setCalfInput] = useState<string>('');

  const [sourceInput] = useState<string>('Manual');
  const [pendingBodyGramForCreate, setPendingBodyGramForCreate] =
    useState<any>(null);

  function parseNumberFromLabel(label?: string): number | null {
    if (!label) return null;

    const m = String(label).match(/([0-9]+(?:\.[0-9]+)?)/);

    if (!m) return null;

    const n = Number(m[1]);

    return Number.isFinite(n) ? n : null;
  }

  function parseNullableNumber(s?: string): number | null {
    if (s == null || s === '') return null;

    const n = Number(s);

    return Number.isFinite(n) ? n : null;
  }

  function parseMetadataSafe(metadata: any) {
    if (!metadata) return {};

    if (typeof metadata === 'object') {
      return metadata;
    }

    if (typeof metadata === 'string') {
      try {
        return JSON.parse(metadata);
      } catch {
        return {};
      }
    }

    return {};
  }

  function toNumberSafe(value: any): number | null {
    if (value === null || value === undefined || value === '') return null;

    const n = Number(value);

    if (!Number.isFinite(n)) return null;

    return n;
  }

  function roundOne(value: number | null) {
    if (value === null || value === undefined) return null;

    return Math.round(value * 10) / 10;
  }

  function formatCm(value: any) {
    const n = toNumberSafe(value);

    if (n === null) return null;

    return `${roundOne(n)}cm`;
  }

  function formatKg(value: any) {
    const n = toNumberSafe(value);

    if (n === null) return null;

    return `${roundOne(n)}kg`;
  }

  function formatPercent(value: any) {
    const n = toNumberSafe(value);

    if (n === null) return null;

    return `${roundOne(n)}%`;
  }

  function getMeasurementFromArray(
    arr: any[],
    names: string[],
    outputUnit: 'cm' | 'kg' | 'percent' | 'raw' = 'cm',
  ) {
    if (!Array.isArray(arr)) return null;

    const normalizedNames = names.map((x) => x.toLowerCase());

    const item = arr.find((m) => {
      const name = String(
        m?.name ?? m?.key ?? m?.label ?? '',
      ).toLowerCase();

      return normalizedNames.some((target) => {
        return (
          name === target ||
          name.includes(target) ||
          target.includes(name)
        );
      });
    });

    if (!item) return null;

    const raw =
      item.value ??
      item.latestValue ??
      item.value_mm ??
      item.value_cm ??
      item.value_kg ??
      item.value_g ??
      item.cm ??
      item.mm ??
      item.kg ??
      null;

    const n = toNumberSafe(raw);

    if (n === null) return null;

    const unit = String(item.unit ?? '').toLowerCase();

    let value = n;

    if (outputUnit === 'cm') {
      if (unit === 'mm') value = n / 10;
      return `${roundOne(value)}cm`;
    }

    if (outputUnit === 'kg') {
      if (unit === 'g') value = n / 1000;
      return `${roundOne(value)}kg`;
    }

    if (outputUnit === 'percent') {
      return `${roundOne(value)}%`;
    }

    return String(roundOne(value));
  }

  function getFirstNumberFromObjects(objects: any[], keys: string[]) {
    const normalizedKeys = keys.map((x) => x.toLowerCase());

    for (const obj of objects) {
      if (!obj || typeof obj !== 'object') continue;

      for (const key of Object.keys(obj)) {
        const keyLower = key.toLowerCase();

        const matched = normalizedKeys.some((target) => {
          return (
            keyLower === target ||
            keyLower.includes(target) ||
            target.includes(keyLower)
          );
        });

        if (!matched) continue;

        const n = toNumberSafe(obj[key]);

        if (n !== null) return n;
      }
    }

    return null;
  }

  function getHealthMetricDisplay(profileObj: any) {
    const latestProfile = profileObj ?? {};
    const metadata = parseMetadataSafe(latestProfile?.metadata);

    const extraMeasurements =
      metadata?.extraMeasurements ??
      metadata?.simpleMeasurements ??
      {};

    const bodyComposition = metadata?.bodyComposition ?? {};
    const input = metadata?.input ?? {};

    const rawMeasurements =
      latestProfile?.rawMeasurements ??
      latestProfile?.measurements ??
      metadata?.rawMeasurements ??
      metadata?.measurements ??
      metadata?.measurementList ??
      [];

    const objects = [
      latestProfile,
      extraMeasurements,
      bodyComposition,
      input,
      metadata,
    ];

    const height =
      getFirstNumberFromObjects(objects, ['heightCm', 'height']) ?? null;

    const weight =
      getFirstNumberFromObjects(objects, ['weightKg', 'weight']) ?? null;

    const bmi = getFirstNumberFromObjects(objects, ['bmi']) ?? null;

    const bodyFat =
      getFirstNumberFromObjects(objects, [
        'bodyFatPercentage',
        'bodyFatPercent',
        'body_fat',
        'fatPercentage',
      ]) ?? null;

    const muscle =
      getFirstNumberFromObjects(objects, [
        'muscleMassKg',
        'muscleMass',
        'skeletalMuscleMassKg',
        'skeletalMuscleMass',
      ]) ?? null;

    const bust =
      getFirstNumberFromObjects(objects, [
        'bustCm',
        'bust',
        'chestCm',
        'chest',
      ]) ??
      toNumberSafe(
        getMeasurementFromArray(rawMeasurements, [
          'bustGirth',
          'bust',
          'chest',
        ])?.replace('cm', ''),
      );

    const waist =
      getFirstNumberFromObjects(objects, [
        'waistCm',
        'waist',
        'waistGirth',
        'bellyWaistGirth',
      ]) ??
      toNumberSafe(
        getMeasurementFromArray(rawMeasurements, [
          'waistGirth',
          'bellyWaistGirth',
          'waist',
          'belly',
        ])?.replace('cm', ''),
      );

    const hip =
      getFirstNumberFromObjects(objects, ['hipCm', 'hip', 'hipGirth']) ??
      toNumberSafe(
        getMeasurementFromArray(rawMeasurements, [
          'hipGirth',
          'hip',
          'topHip',
        ])?.replace('cm', ''),
      );

    const bicep =
      getFirstNumberFromObjects(objects, [
        'bicepCm',
        'bicep',
        'upperArmCm',
        'upperArm',
        'armCm',
        'arm',
      ]) ??
      toNumberSafe(
        getMeasurementFromArray(rawMeasurements, [
          'upperArmGirthR',
          'upperArm',
          'bicep',
          'arm',
        ])?.replace('cm', ''),
      );

    const thigh =
      getFirstNumberFromObjects(objects, [
        'thighCm',
        'thigh',
        'thighGirth',
        'midThighCm',
        'midThigh',
      ]) ??
      toNumberSafe(
        getMeasurementFromArray(rawMeasurements, [
          'thighGirthR',
          'midThighGirthR',
          'thigh',
          'midThigh',
        ])?.replace('cm', ''),
      );

    const calf =
      getFirstNumberFromObjects(objects, [
        'calfCm',
        'calf',
        'calfGirth',
      ]) ??
      toNumberSafe(
        getMeasurementFromArray(rawMeasurements, [
          'calfGirthR',
          'calf',
        ])?.replace('cm', ''),
      );

    return {
      raw: {
        height,
        weight,
        bmi,
        bodyFat,
        muscle,
        bust,
        waist,
        hip,
        bicep,
        thigh,
        calf,
      },
      display: {
        height: formatCm(height),
        weight: formatKg(weight),
        bmi: bmi !== null ? String(roundOne(bmi)) : null,
        bodyFat: formatPercent(bodyFat),
        muscle: formatKg(muscle),
        bust: formatCm(bust),
        waist: formatCm(waist),
        hip: formatCm(hip),
        bicep: formatCm(bicep),
        thigh: formatCm(thigh),
        calf: formatCm(calf),
      },
      source: latestProfile?.source ?? metadata?.provider ?? null,
      createdAt: latestProfile?.createdAt ?? metadata?.createdAt ?? null,
    };
  }

  function hasDisplayValue(value: any) {
    return (
      value !== null &&
      value !== undefined &&
      value !== '' &&
      value !== '-'
    );
  }

  function fadedIfEmpty(value: any) {
    return hasDisplayValue(value) ? null : styles.fadedBubble;
  }

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const metricsRes = await fetchMyHealthProfileMetrics();

        if (!mounted) return;

        if (metricsRes.ok) {
          setMetricsData(metricsRes.data);
        }

        const latestRes = await fetchLatestHealthProfile();

        if (!mounted) return;

        if (latestRes.ok) {
          console.log('DEBUG latest health profile:', latestRes.data);
          setProfile(latestRes.data);
        } else {
          console.log(
            'DEBUG latest health profile error:',
            latestRes.error,
          );
          setProfile(null);
        }
      } catch (e) {
        console.log('BodyMetricDetails load error:', e);
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, []);

  const metrics = metricsData?.metrics ?? null;
  const latestComparison = metricsData?.latestComparison ?? null;

  const latestMapped = useMemo(() => {
    return getHealthMetricDisplay(profile);
  }, [profile]);

  function toChart(dataset: any[]) {
    if (!Array.isArray(dataset)) return { labels: [], values: [] };

    const safe: any[] = (dataset || [])
      .filter((d: any) => {
        const v = d == null ? null : Number(d.value);
        return v != null && Number.isFinite(v);
      })
      .map((d: any) => ({
        date: d.date,
        value: Number(d.value),
      }));

    if (safe.length === 0) return { labels: [], values: [] };

    safe.sort((a, b) => {
      const ta = Number(new Date(a.date));
      const tb = Number(new Date(b.date));
      return ta - tb;
    });

    const vals = safe.map((d) => d.value);

    const labels = safe.map((d) => {
      try {
        return new Date(d.date).toLocaleDateString('vi-VN', {
          day: '2-digit',
          month: '2-digit',
        });
      } catch {
        return String(d.date);
      }
    });

    return {
      labels,
      values: vals,
      raw: safe,
    };
  }

  const activeChart = useMemo(() => {
    if (!metrics) return { labels: [], values: [] };

    return toChart(metrics[activeMetric] ?? []);
  }, [metrics, activeMetric]);

  function findMeasurement(profileObj: any, keywords: string[]) {
    try {
      const mapped = getHealthMetricDisplay(profileObj);

      const keywordText = keywords.join(' ').toLowerCase();

      if (
        keywordText.includes('bust') ||
        keywordText.includes('chest')
      ) {
        return mapped.display.bust;
      }

      if (
        keywordText.includes('waist') ||
        keywordText.includes('belly')
      ) {
        return mapped.display.waist;
      }

      if (keywordText.includes('hip')) {
        return mapped.display.hip;
      }

      if (
        keywordText.includes('bicep') ||
        keywordText.includes('upperarm') ||
        keywordText.includes('arm')
      ) {
        return mapped.display.bicep;
      }

      if (
        keywordText.includes('thigh') ||
        keywordText.includes('midthigh')
      ) {
        return mapped.display.thigh;
      }

      if (keywordText.includes('calf')) {
        return mapped.display.calf;
      }

      if (keywordText.includes('height')) {
        return mapped.display.height;
      }

      if (
        keywordText.includes('weight') ||
        keywordText.includes('mass') ||
        keywordText.includes('kg')
      ) {
        return mapped.display.weight;
      }

      if (
        keywordText.includes('fat') ||
        keywordText.includes('bodyfat')
      ) {
        return mapped.display.bodyFat;
      }

      if (keywordText.includes('muscle')) {
        return mapped.display.muscle;
      }
    } catch {
      // ignore
    }

    return null;
  }

  function getLatestValue(key: string) {
    const latestDisplayMap: Record<string, any> = {
      weightKg: latestMapped.display.weight,
      bmi: latestMapped.display.bmi,
      bodyFatPercentage: latestMapped.display.bodyFat,
      muscleMassKg: latestMapped.display.muscle,
      waistCm: latestMapped.display.waist,
      hipCm: latestMapped.display.hip,
    };

    if (latestDisplayMap[key]) {
      return latestDisplayMap[key];
    }

    const arr = metrics?.[key];

    if (Array.isArray(arr) && arr.length > 0) {
      const chart = toChart(arr);

      if (chart.values && chart.values.length > 0) {
        const last = chart.values[chart.values.length - 1];

        if (String(key).toLowerCase().includes('kg')) return `${last}kg`;
        if (String(key).toLowerCase().includes('cm')) return `${last}cm`;
        if (key === 'bodyFatPercentage') return `${last}%`;

        return String(last);
      }
    }

    return '-';
  }

  async function handleRescan() {
    try {
      navigation.navigate('BodyScanFlow');
    } catch (e) {
      console.log('Rescan navigation error', e);
      Alert.alert('Lỗi', 'Không thể bắt đầu quét.');
    }
  }

  async function handleCreateHealthProfile() {
    if (!profile) {
      Alert.alert(
        'Không có dữ liệu',
        'Không có hồ sơ để gửi. Vui lòng quét hoặc nhập số đo.',
      );
      return;
    }

    try {
      let bodyGramPayload: any = profile;

      try {
        if (typeof profile?.metadata === 'string') {
          const md = JSON.parse(profile.metadata || '{}');
          bodyGramPayload = {
            ...profile,
            ...(md || {}),
          };
        }
      } catch {
        // ignore parse errors
      }

      const hp = buildHealthProfilePayload(
        bodyGramPayload,
        'BodyMetricDetails',
      );

      const prefHeight =
        hp.heightCm ??
        parseNumberFromLabel(
          String(findMeasurement(profile, ['height', 'heightcm']) ?? ''),
        ) ??
        null;

      const prefWeight =
        hp.weightKg ??
        parseNumberFromLabel(
          String(
            findMeasurement(profile, ['weight', 'weightkg', 'mass']) ?? '',
          ),
        ) ??
        null;

      setHeightInput(prefHeight ? String(prefHeight) : '');
      setWeightInput(prefWeight ? String(prefWeight) : '');
      setBmiInput(latestMapped.display.bmi ?? '');
      setBodyFatInput(
        latestMapped.raw.bodyFat != null
          ? String(latestMapped.raw.bodyFat)
          : '',
      );
      setMuscleInput(
        latestMapped.raw.muscle != null
          ? String(latestMapped.raw.muscle)
          : '',
      );

      setBustInput(
        latestMapped.raw.bust != null ? String(latestMapped.raw.bust) : '',
      );
      setWaistInput(
        latestMapped.raw.waist != null ? String(latestMapped.raw.waist) : '',
      );
      setHipInput(
        latestMapped.raw.hip != null ? String(latestMapped.raw.hip) : '',
      );
      setBicepInput(
        latestMapped.raw.bicep != null
          ? String(latestMapped.raw.bicep)
          : '',
      );
      setThighInput(
        latestMapped.raw.thigh != null
          ? String(latestMapped.raw.thigh)
          : '',
      );
      setCalfInput(
        latestMapped.raw.calf != null ? String(latestMapped.raw.calf) : '',
      );

      setPendingBodyGramForCreate(bodyGramPayload);
      setModalVisible(true);
    } catch (e) {
      console.log('Prepare create health profile error', e);
      Alert.alert('Lỗi', 'Không thể chuẩn bị tạo health-profile.');
    }
  }

  async function handleSubmitModal() {
    const h = Number(heightInput);
    const w = Number(weightInput);

    if (!Number.isFinite(h) || !Number.isFinite(w) || h <= 0 || w <= 0) {
      Alert.alert(
        'Lỗi',
        'Vui lòng nhập chiều cao(cm) và cân nặng(kg) hợp lệ.',
      );
      return;
    }

    const bmiVal = Number(bmiInput) || undefined;
    const bodyFatVal = Number(bodyFatInput) || undefined;
    const muscleVal = Number(muscleInput) || undefined;
    const waistVal = Number(waistInput) || undefined;
    const hipVal = Number(hipInput) || undefined;

    let existingMeta: any = {};

    try {
      if (typeof (pendingBodyGramForCreate || profile)?.metadata === 'string') {
        existingMeta = JSON.parse(
          (pendingBodyGramForCreate || profile).metadata || '{}',
        );
      } else {
        existingMeta = (pendingBodyGramForCreate || profile)?.metadata ?? {};
      }
    } catch {
      existingMeta = {};
    }

    const metadataObj: any = {
      ...(existingMeta || {}),
    };

    const maybeImg =
      (pendingBodyGramForCreate || profile)?.avatarUrl ??
      (pendingBodyGramForCreate || profile)?.avatar ??
      (pendingBodyGramForCreate || profile)?.photo ??
      null;

    if (maybeImg) metadataObj.image = maybeImg;

    if ((pendingBodyGramForCreate || profile)?.measurements) {
      metadataObj.measurements = (pendingBodyGramForCreate || profile)
        .measurements;
    }

    const extraMeasures: any = {
      bustCm: parseNullableNumber(bustInput),
      waistCm: parseNullableNumber(waistInput),
      hipCm: parseNullableNumber(hipInput),
      bicepCm: parseNullableNumber(bicepInput),
      thighCm: parseNullableNumber(thighInput),
      calfCm: parseNullableNumber(calfInput),
    };

    metadataObj.extraMeasurements = {
      ...(metadataObj.extraMeasurements || {}),
      ...extraMeasures,
    };

    const redactLargeStrings = (obj: any) => {
      if (!obj || typeof obj !== 'object') return;

      for (const k of Object.keys(obj)) {
        const v = obj[k];

        if (typeof v === 'string' && v.length > 2000) {
          obj[k] = '[redacted]';
        } else if (typeof v === 'object') {
          redactLargeStrings(v);
        }
      }
    };

    redactLargeStrings(metadataObj);

    const bodyGramPayload = {
      ...(pendingBodyGramForCreate || profile),
      height: h,
      heightCm: h,
      weight: w,
      weightKg: w,
      bmi: bmiVal,
      bodyFatPercentage: bodyFatVal,
      muscleMassKg: muscleVal,
      waistCm: waistVal,
      hipCm: hipVal,
      source: sourceInput || 'Manual',
      metadata: JSON.stringify(metadataObj),
    };

    try {
      setModalVisible(false);

      const res = await createHealthProfile(
        bodyGramPayload,
        'BodyMetricDetails',
      );

      if (res && res.ok) {
        Alert.alert('Thành công', 'Đã tạo health-profile mới.');

        try {
          const refreshed = await fetchMyHealthProfileMetrics();
          if (refreshed.ok) setMetricsData(refreshed.data);

          const latestRes = await fetchLatestHealthProfile();
          if (latestRes.ok) setProfile(latestRes.data);
        } catch {
          // ignore
        }
      } else {
        let errMsg: string | null = null;

        if (res) {
          const e = (res as any).error ?? res;
          errMsg = typeof e === 'string' ? e : JSON.stringify(e);
        }

        Alert.alert('Lỗi', errMsg || 'Không thể tạo health-profile');
      }
    } catch (e) {
      console.log('create from modal error', e);
      Alert.alert('Lỗi', 'Không thể tạo health-profile.');
    } finally {
      setPendingBodyGramForCreate(null);
    }
  }

  function renderInputRow(
    label: string,
    value: string,
    onChange: (s: string) => void,
    placeholder: string,
    unit?: string,
  ) {
    return (
      <View>
        <Text style={modalStyles.inputLabel}>{label}</Text>

        <View style={modalStyles.inputRow}>
          <TextInput
            value={value}
            onChangeText={onChange}
            keyboardType="numeric"
            placeholder={placeholder}
            style={modalStyles.inputFlex}
          />

          {unit ? <Text style={modalStyles.unitText}>{unit}</Text> : null}
        </View>
      </View>
    );
  }

  function handleInbodyScan() {
    try {
      navigation.navigate('InBodyScan');
    } catch (e) {
      console.log('InBody navigation error', e);
      Alert.alert('Lỗi', 'Không thể mở InBody scan.');
    }
  }

  const metricTabs: ActiveMetric[] = [
    'weightKg',
    'bmi',
    'bodyFatPercentage',
    'muscleMassKg',
    'waistCm',
    'hipCm',
  ];

  const labelMap: Record<string, string> = {
    weightKg: 'Cân nặng',
    bmi: 'BMI',
    bodyFatPercentage: 'Tỷ lệ mỡ',
    muscleMassKg: 'Khối cơ',
    waistCm: 'Eo',
    hipCm: 'Hông',
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.headerBtn}
        >
          <Ionicons name="arrow-back" size={22} color="#333" />
        </Pressable>

        <Text style={styles.headerTitle}>Lịch sử số đo</Text>

        <View style={styles.headerBtn} />
      </View>

      <View style={styles.actionRow}>
        <View style={styles.dropdownWrap}>
          <Pressable
            onPress={() => setMenuVisible((s) => !s)}
            style={[styles.actionBtn, styles.actionBtnPrimary]}
          >
            <Text style={styles.actionTextPrimary}>Cập nhật số đo ▾</Text>
          </Pressable>

          {menuVisible ? (
            <View style={styles.menuBox}>
              <TouchableOpacity
                onPress={() => {
                  setMenuVisible(false);
                  handleRescan();
                }}
                style={styles.menuItem}
              >
                <Text style={styles.menuItemText}>Quét Bodygram</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={async () => {
                  setMenuVisible(false);
                  await handleCreateHealthProfile();
                }}
                style={styles.menuItem}
              >
                <Text style={styles.menuItemText}>Cập nhật thủ công</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setMenuVisible(false);
                  handleInbodyScan();
                }}
                style={[styles.menuItem, styles.menuItemLast]}
              >
                <View style={styles.menuItemRow}>
                  <Ionicons
                    name="flame"
                    size={16}
                    color="#FF4500"
                    style={styles.menuItemIcon}
                  />

                  <Text style={styles.menuItemText}>InBody Scan</Text>
                </View>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>

        <Pressable
          onPress={() => navigation.navigate('HealthProfiles')}
          style={[styles.actionBtn, styles.viewProfilesBtnTop]}
        >
          <Text style={styles.actionText}>Xem hồ sơ</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        {profile ? (
          <View style={styles.silhouetteSummaryCard}>
            <View style={styles.silhouetteSmall}>
              <Image
                source={require('../../../assets/bodygram.png')}
                style={styles.silhouetteSmallImage}
                resizeMode="contain"
              />

              <View style={styles.silSmallTopLeft}>
                <View
                  style={[
                    styles.bubbleCardSmall,
                    fadedIfEmpty(latestMapped.display.bust),
                  ]}
                >
                  <Text style={styles.bubbleLabel}>Ngực</Text>
                  <Text style={styles.bubbleValueSmall}>
                    {latestMapped.display.bust ?? '-'}
                  </Text>
                </View>
              </View>

              <View style={styles.silSmallMidLeft}>
                <View
                  style={[
                    styles.bubbleCardSmall,
                    fadedIfEmpty(latestMapped.display.waist),
                  ]}
                >
                  <Text style={styles.bubbleLabel}>Eo</Text>
                  <Text style={styles.bubbleValueSmall}>
                    {latestMapped.display.waist ?? '-'}
                  </Text>
                </View>
              </View>

              <View style={styles.silSmallTopRight}>
                <View
                  style={[
                    styles.bubbleCardSmall,
                    fadedIfEmpty(latestMapped.display.bicep),
                  ]}
                >
                  <Text style={styles.bubbleLabel}>Bắp tay</Text>
                  <Text style={styles.bubbleValueSmall}>
                    {latestMapped.display.bicep ?? '-'}
                  </Text>
                </View>
              </View>

              <View style={styles.silSmallMidRight}>
                <View
                  style={[
                    styles.bubbleCardSmall,
                    fadedIfEmpty(latestMapped.display.hip),
                  ]}
                >
                  <Text style={styles.bubbleLabel}>Hông</Text>
                  <Text style={styles.bubbleValueSmall}>
                    {latestMapped.display.hip ?? '-'}
                  </Text>
                </View>
              </View>

              <View style={styles.silSmallBottom}>
                <View
                  style={[
                    styles.bubbleCardSmall,
                    fadedIfEmpty(latestMapped.display.thigh),
                  ]}
                >
                  <Text style={styles.bubbleLabel}>Đùi</Text>
                  <Text style={styles.bubbleValueSmall}>
                    {latestMapped.display.thigh ?? '-'}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        ) : null}

        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>So sánh nhanh</Text>
          </View>

          <View style={styles.quickGrid}>
            {metricTabs.map((k) => {
              const comp = latestComparison?.[k];

              const upDown =
                comp == null
                  ? null
                  : Number(comp) > 0
                    ? 'up'
                    : Number(comp) < 0
                      ? 'down'
                      : 'same';

              const diffColor =
                upDown === 'up'
                  ? '#dc2626'
                  : upDown === 'down'
                    ? '#16a34a'
                    : '#6b7280';

              const latest = getLatestValue(k);

              return (
                <View key={k} style={styles.quickItem}>
                  <Text style={styles.quickLabel}>{labelMap[k]}</Text>
                  <Text style={styles.quickValue}>{latest}</Text>

                  {comp != null ? (
                    <Text style={[styles.quickDiff, { color: diffColor }]}>
                      {Number(comp) > 0 ? `+${comp}` : `${comp}`}
                    </Text>
                  ) : null}
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Biểu đồ</Text>

          <View style={styles.tabRow}>
            {metricTabs.map((k) => (
              <Pressable
                key={k}
                onPress={() => setActiveMetric(k)}
                style={[
                  styles.tabBtn,
                  activeMetric === k ? styles.tabBtnActive : null,
                ]}
              >
                <Text
                  style={[
                    styles.tabText,
                    activeMetric === k ? styles.tabTextActive : null,
                  ]}
                >
                  {labelMap[k]}
                </Text>
              </Pressable>
            ))}
          </View>

          {Array.isArray(activeChart.values) &&
          activeChart.values.length >= 2 ? (
            <LineChart
              data={{
                labels: (activeChart.labels || []).map(String),
                datasets: [
                  {
                    data: (activeChart.values || []).map((v: any) =>
                      Number(v),
                    ),
                  },
                ],
              }}
              width={width - 32}
              height={260}
              chartConfig={{
  backgroundGradientFrom: '#fff',
  backgroundGradientTo: '#fff',
  decimalPlaces: 1,
  color: () => '#A0522D',
  labelColor: () => '#6b7280',
  propsForDots: {
    r: '4',
    strokeWidth: '2',
    stroke: '#A0522D',
  },
}}
              bezier
              withDots
              withInnerLines
              style={styles.chartStyle}
            />
          ) : Array.isArray(activeChart.values) &&
            activeChart.values.length === 1 ? (
            <View style={[styles.card, styles.singleCard]}>
              <Text style={styles.singleTitle}>Giá trị mới nhất</Text>
              <Text style={styles.singleValue}>
                {String(activeChart.values[0])}
              </Text>

              {activeChart.raw && activeChart.raw[0] ? (
                <Text style={styles.singleDate}>
                  {new Date(activeChart.raw[0].date).toLocaleDateString(
                    'vi-VN',
                  )}
                </Text>
              ) : null}

              <Text style={styles.singleHint}>
                Cần ít nhất 2 lần đo để hiển thị biểu đồ
              </Text>
            </View>
          ) : (
            <View style={styles.placeholderWrap}>
              <Text style={styles.placeholderText}>
                Không đủ dữ liệu để hiển thị biểu đồ
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={modalStyles.backdrop}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={modalStyles.keyboardAvoiding}
          >
            <ScrollView
              style={modalStyles.modalScroll}
              contentContainerStyle={modalStyles.modalContentContainer}
              keyboardShouldPersistTaps="handled"
            >
              <View style={modalStyles.modalContainer}>
                <Text style={modalStyles.modalTitle}>
                  Nhập chiều cao và cân nặng
                </Text>

                {renderInputRow(
                  'Chiều cao',
                  heightInput,
                  setHeightInput,
                  'Chiều cao',
                  'cm',
                )}
                {renderInputRow(
                  'Cân nặng',
                  weightInput,
                  setWeightInput,
                  'Cân nặng',
                  'kg',
                )}
                {renderInputRow('BMI', bmiInput, setBmiInput, 'BMI', '')}
                {renderInputRow(
                  'Tỷ lệ mỡ',
                  bodyFatInput,
                  setBodyFatInput,
                  'Tỷ lệ mỡ (%)',
                  '%',
                )}
                {renderInputRow(
                  'Khối cơ',
                  muscleInput,
                  setMuscleInput,
                  'Khối cơ (kg)',
                  'kg',
                )}
                {renderInputRow(
                  'Ngực',
                  bustInput,
                  setBustInput,
                  'Ngực',
                  'cm',
                )}
                {renderInputRow(
                  'Eo',
                  waistInput,
                  setWaistInput,
                  'Eo',
                  'cm',
                )}
                {renderInputRow(
                  'Hông',
                  hipInput,
                  setHipInput,
                  'Hông',
                  'cm',
                )}
                {renderInputRow(
                  'Bắp tay',
                  bicepInput,
                  setBicepInput,
                  'Bắp tay',
                  'cm',
                )}
                {renderInputRow(
                  'Đùi',
                  thighInput,
                  setThighInput,
                  'Đùi',
                  'cm',
                )}
                {renderInputRow(
                  'Bắp chân',
                  calfInput,
                  setCalfInput,
                  'Bắp chân',
                  'cm',
                )}

                <View style={modalStyles.modalActions}>
                  <TouchableOpacity
                    onPress={() => setModalVisible(false)}
                    style={modalStyles.cancelBtn}
                  >
                    <Text style={modalStyles.cancelText}>Hủy</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleSubmitModal}
                    style={modalStyles.submitBtn}
                  >
                    <Text style={modalStyles.submitText}>Gửi</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FFFAF0',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  headerBtn: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  actionRow: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  dropdownWrap: {
    position: 'relative',
    flex: 1,
    alignItems: 'flex-start',
  },
  menuBox: {
    position: 'absolute',
    top: 46,
    right: 4,
    minWidth: 180,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: '#eee',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    elevation: 12,
    zIndex: 999,
  },
  menuItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuItemText: {
    color: '#111827',
    fontSize: 15,
  },
  menuItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  menuItemIcon: {
    marginRight: 8,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 10,
    marginHorizontal: 6,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnPrimary: {
    backgroundColor: '#A0522D',
    borderColor: '#A0522D',
    padding: 10,
  },
  viewProfilesBtnTop: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  actionText: {
    color: '#374151',
    fontWeight: '600',
  },
  actionTextPrimary: {
    color: '#fff',
    fontWeight: '700',
  },
  container: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickItem: {
    width: '48%',
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#fdf6ec',
    marginBottom: 8,
  },
  quickLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  quickValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  quickDiff: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  tabRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tabBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    marginRight: 8,
    marginBottom: 8,
  },
  tabBtnActive: {
    backgroundColor: '#A0522D',
  },
  tabText: {
    color: '#374151',
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#fff',
  },
  chartStyle: {
    borderRadius: 12,
    marginTop: 12,
  },
  placeholderWrap: {
    paddingVertical: 36,
    alignItems: 'center',
  },
  placeholderText: {
    color: '#6b7280',
  },
  silhouetteSummaryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  silhouetteSmall: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    aspectRatio: 1,
    width: '100%',
    borderRadius: 12,
  },
  silhouetteSmallImage: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  silSmallTopLeft: {
    position: 'absolute',
    left: '12%',
    top: '20%',
  },
  silSmallMidLeft: {
    position: 'absolute',
    left: '12%',
    top: '35%',
  },
  silSmallTopRight: {
    position: 'absolute',
    right: '12%',
    top: '20%',
  },
  silSmallMidRight: {
    position: 'absolute',
    right: '12%',
    top: '40%',
  },
  silSmallBottom: {
    position: 'absolute',
    left: '50%',
    bottom: '6%',
    transform: [{ translateX: -50 }],
  },
  bubbleCardSmall: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 72,
  },
  bubbleLabel: {
    fontSize: 13,
    color: '#6b7280',
    marginRight: 6,
  },
  bubbleValueSmall: {
    fontSize: 15,
    fontWeight: '800',
  },
  fadedBubble: {
    opacity: 0.35,
  },
  singleCard: {
    alignItems: 'center',
  },
  singleTitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 6,
  },
  singleValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1f2937',
  },
  singleDate: {
    marginTop: 6,
    color: '#6b7280',
  },
  singleHint: {
    marginTop: 8,
    color: '#9CA3AF',
  },
});

const modalStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 84,
    paddingHorizontal: 12,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  inputFlex: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 6,
    fontSize: 18,
  },
  unitText: {
    marginLeft: 8,
    color: '#6b7280',
    fontSize: 15,
    minWidth: 36,
    textAlign: 'right',
  },
  inputLabel: {
    marginBottom: 6,
    color: '#111827',
    fontSize: 14,
    fontWeight: '700',
  },
  modalContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 20,
    width: Math.min(width * 0.9, 520),
    alignSelf: 'center',
    marginTop: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    elevation: 8,
  },
  modalScroll: {
    maxHeight: '78%',
  },
  modalContentContainer: {
    paddingBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
  },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
    marginRight: 10,
  },
  cancelText: {
    color: '#111827',
    fontWeight: '600',
  },
  submitBtn: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: '#A0522D',
    borderRadius: 10,
  },
  submitText: {
    color: '#fff',
    fontWeight: '700',
  },
  keyboardAvoiding: {
    flex: 1,
  },
});