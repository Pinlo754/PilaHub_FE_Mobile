import React, { useMemo } from 'react';
import {
  Text,
  ScrollView,
  View,
  Image,
  Pressable,
  StyleSheet,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@react-native-vector-icons/ionicons';
import { useNavigation } from '@react-navigation/native';

type Props = NativeStackScreenProps<RootStackParamList, 'BodyGramResult'>;

function toNumber(value: any): number | null {
  if (value === null || value === undefined || value === '') return null;

  const n = Number(value);

  if (!Number.isFinite(n)) return null;

  return n;
}

function roundOne(value: number | null): number | null {
  if (value === null || value === undefined) return null;

  return Math.round(value * 10) / 10;
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

function formatCm(value: any) {
  const n = toNumber(value);

  if (n === null) return null;

  return `${roundOne(n)}cm`;
}

function formatKg(value: any) {
  const n = toNumber(value);

  if (n === null) return null;

  return `${roundOne(n)}kg`;
}

function formatPercent(value: any) {
  const n = toNumber(value);

  if (n === null) return null;

  return `${roundOne(n)}%`;
}

function getMeasurementNumberFromArray(arr: any[], names: string[]) {
  if (!Array.isArray(arr)) return null;

  const targets = names.map((x) => x.toLowerCase());

  const item = arr.find((m) => {
    const name = String(m?.name ?? m?.key ?? m?.label ?? '').toLowerCase();

    return targets.some((target) => {
      return name === target || name.includes(target) || target.includes(name);
    });
  });

  if (!item) return null;

  const raw =
    item.value ??
    item.latestValue ??
    item.value_mm ??
    item.value_cm ??
    item.cm ??
    item.mm ??
    item.kg ??
    item.g ??
    null;

  const n = toNumber(raw);

  if (n === null) return null;

  const unit = String(item.unit ?? '').toLowerCase();

  if (unit === 'mm') return roundOne(n / 10);
  if (unit === 'cm') return roundOne(n);
  if (unit === 'g') return roundOne(n / 1000);
  if (unit === 'kg') return roundOne(n);

  return roundOne(n);
}

function getFirstNumberFromObjects(objects: any[], keys: string[]) {
  const targetKeys = keys.map((x) => x.toLowerCase());

  for (const obj of objects) {
    if (!obj || typeof obj !== 'object') continue;

    for (const key of Object.keys(obj)) {
      const keyLower = key.toLowerCase();

      const matched = targetKeys.some((target) => {
        return (
          keyLower === target ||
          keyLower.includes(target) ||
          target.includes(keyLower)
        );
      });

      if (!matched) continue;

      const n = toNumber(obj[key]);

      if (n !== null) return n;
    }
  }

  return null;
}

function mapHealthProfileData(rawResponse: any, rawMeasurements: any) {
  const entry = rawResponse?.entry ?? rawResponse?.data ?? rawResponse ?? {};
  const metadata = parseMetadata(entry?.metadata);

  const extraMeasurements =
    metadata?.extraMeasurements ??
    metadata?.simpleMeasurements ??
    {};

  const bodyComposition = metadata?.bodyComposition ?? {};
  const input = metadata?.input ?? {};

  const rawObj =
    rawMeasurements && !Array.isArray(rawMeasurements) ? rawMeasurements : {};

  const measurementsArray =
    Array.isArray(rawMeasurements)
      ? rawMeasurements
      : Array.isArray(entry?.measurements)
        ? entry.measurements
        : Array.isArray(entry?.rawMeasurements)
          ? entry.rawMeasurements
          : Array.isArray(metadata?.rawMeasurements)
            ? metadata.rawMeasurements
            : Array.isArray(metadata?.measurements)
              ? metadata.measurements
              : [];

  const objects = [
    entry,
    rawObj,
    extraMeasurements,
    bodyComposition,
    input,
    metadata,
  ];

  const height =
    getFirstNumberFromObjects(objects, ['heightCm', 'height', 'height_est']) ??
    null;

  const weight =
    getFirstNumberFromObjects(objects, ['weightKg', 'weight', 'weight_est']) ??
    null;

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
    getMeasurementNumberFromArray(measurementsArray, [
      'bustGirth',
      'bust',
      'chest',
    ]);

  const waist =
    getFirstNumberFromObjects(objects, [
      'waistCm',
      'waist',
      'waistGirth',
      'bellyWaistGirth',
    ]) ??
    getMeasurementNumberFromArray(measurementsArray, [
      'waistGirth',
      'bellyWaistGirth',
      'waist',
      'belly',
    ]);

  const hip =
    getFirstNumberFromObjects(objects, ['hipCm', 'hip', 'hipGirth']) ??
    getMeasurementNumberFromArray(measurementsArray, [
      'hipGirth',
      'hip',
      'topHip',
    ]);

  const bicep =
    getFirstNumberFromObjects(objects, [
      'bicepCm',
      'bicep',
      'upperArmCm',
      'upperArm',
      'upperArmGirth',
    ]) ??
    getMeasurementNumberFromArray(measurementsArray, [
      'upperArmGirthR',
      'upperArmGirth',
      'upperArm',
      'bicep',
    ]);

  const thigh =
    getFirstNumberFromObjects(objects, [
      'thighCm',
      'thigh',
      'thighGirth',
      'midThighCm',
      'midThigh',
    ]) ??
    getMeasurementNumberFromArray(measurementsArray, [
      'thighGirthR',
      'midThighGirthR',
      'thigh',
      'midThigh',
    ]);

  const calf =
    getFirstNumberFromObjects(objects, ['calfCm', 'calf', 'calfGirth']) ??
    getMeasurementNumberFromArray(measurementsArray, [
      'calfGirthR',
      'calf',
    ]);

  const shoulder =
    getFirstNumberFromObjects(objects, [
      'shoulderCm',
      'shoulder',
      'acrossBackShoulderWidth',
    ]) ??
    getMeasurementNumberFromArray(measurementsArray, [
      'acrossBackShoulderWidth',
      'shoulder',
    ]);

  const neck =
    getFirstNumberFromObjects(objects, ['neckCm', 'neck', 'neckGirth']) ??
    getMeasurementNumberFromArray(measurementsArray, ['neckGirth', 'neck']);

  const source =
    entry?.source ??
    metadata?.provider ??
    rawObj?.source ??
    'BodyGram';

  const createdAt =
    entry?.createdAt ??
    entry?.created_at ??
    metadata?.createdAt ??
    rawObj?.createdAt ??
    null;

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
      shoulder,
      neck,
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
      shoulder: formatCm(shoulder),
      neck: formatCm(neck),
    },
    source,
    createdAt,
  };
}

function hasValue(value: any) {
  return value !== null && value !== undefined && value !== '' && value !== '-';
}

export default function BodyGramResult({
  route,
  navigation: _navigation,
}: Props) {
  const nav = useNavigation<any>();

  const { measurements: rawMeasurements, rawResponse } = route.params as any;

  console.log('DEBUG BodyGramResult route.params:', route.params);
  console.log('DEBUG BodyGramResult rawMeasurements:', rawMeasurements);
  console.log('DEBUG BodyGramResult rawResponse:', rawResponse);

  const mapped = useMemo(() => {
    return mapHealthProfileData(rawResponse, rawMeasurements);
  }, [rawMeasurements, rawResponse]);

  const whr =
    mapped.raw.waist != null &&
    mapped.raw.hip != null &&
    mapped.raw.hip !== 0
      ? (mapped.raw.waist / mapped.raw.hip).toFixed(2)
      : null;

  function fadedStyle(value: any) {
    return hasValue(value) ? null : styles.fadedItem;
  }

  const detailItems = [
    { key: 'bmi', label: 'BMI', unit: '', value: mapped.display.bmi },
    {
      key: 'bodyFat',
      label: '% Mỡ cơ thể',
      unit: '',
      value: mapped.display.bodyFat,
    },
    {
      key: 'muscle',
      label: 'Khối lượng cơ',
      unit: '',
      value: mapped.display.muscle,
    },
    { key: 'bust', label: 'Ngực', unit: '', value: mapped.display.bust },
    { key: 'waist', label: 'Eo', unit: '', value: mapped.display.waist },
    { key: 'hip', label: 'Hông', unit: '', value: mapped.display.hip },
    { key: 'bicep', label: 'Bắp tay', unit: '', value: mapped.display.bicep },
    { key: 'thigh', label: 'Đùi', unit: '', value: mapped.display.thigh },
    { key: 'calf', label: 'Bắp chân', unit: '', value: mapped.display.calf },
  ];

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View style={styles.header}>
        <Pressable
          onPress={() =>
            nav.reset({
              index: 0,
              routes: [{ name: 'MainTabs' }],
            })
          }
          style={styles.headerButton}
        >
          <Ionicons name="arrow-back" size={22} color="#333" />
        </Pressable>

        <Text style={[styles.headerTitle, styles.headerTitleCenter]}>
          Thông tin cơ thể
        </Text>

        <View style={styles.headerButton} />
      </View>

      <ScrollView
        className="flex-1 p-4"
        contentContainerStyle={styles.scrollContent}
      >
        <View className="bg-white rounded-xl p-4 mb-4 flex-row items-center">
          <View className="flex-1">
            <Text className="text-lg font-semibold">
              {mapped.source ? `Nguồn: ${mapped.source}` : 'Hồ sơ sức khỏe'}
            </Text>

            <Text className="text-sm text-gray-500 mt-1">
              {mapped.createdAt
                ? new Date(mapped.createdAt).toLocaleString()
                : ''}
            </Text>

            <Text className="text-sm text-gray-700 mt-2">
              Chiều cao: {mapped.display.height ?? '-'}   Cân nặng:{' '}
              {mapped.display.weight ?? '-'}
            </Text>
          </View>

         <View className="ml-3 items-center">
  <View className="bg-amber-50 rounded-full w-20 h-20 items-center justify-center px-2">
    <Text className="text-xs text-amber-700 font-semibold text-center">
      Mỡ cơ thể
    </Text>

    <Text className="text-amber-700 font-bold text-center text-lg">
      {mapped.display.bodyFat ??
        (mapped.display.bmi ? `BMI ${mapped.display.bmi}` : '—')}
    </Text>
  </View>
</View>
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
                style={fadedStyle(mapped.display.bust)}
              >
                <Text className="text-xs text-gray-800">Ngực</Text>
                <Text className="text-lg font-extrabold">
                  {mapped.display.bust ?? '-'}
                </Text>
              </View>
            </View>

            <View className="absolute top-24 left-4">
              <View
                className="bg-amber-200 rounded-lg px-3 py-2 shadow"
                style={fadedStyle(mapped.display.waist)}
              >
                <Text className="text-xs text-gray-800">Eo</Text>
                <Text className="text-lg font-extrabold">
                  {mapped.display.waist ?? '-'}
                </Text>
              </View>
            </View>

            <View className="absolute top-24 right-4">
              <View
                className="bg-amber-200 rounded-lg px-3 py-2 shadow"
                style={fadedStyle(mapped.display.hip)}
              >
                <Text className="text-xs text-gray-800">Hông</Text>
                <Text className="text-lg font-extrabold">
                  {mapped.display.hip ?? '-'}
                </Text>
              </View>
            </View>

            <View className="absolute bottom-9 left-7">
              <View
                className="bg-amber-200 rounded-lg px-3 py-2 shadow"
                style={fadedStyle(mapped.display.thigh)}
              >
                <Text className="text-xs text-gray-800">Đùi</Text>
                <Text className="text-lg font-extrabold">
                  {mapped.display.thigh ?? '-'}
                </Text>
              </View>
            </View>

            <View className="absolute top-9 right-7">
              <View
                className="bg-amber-200 rounded-lg px-3 py-2 shadow"
                style={fadedStyle(mapped.display.bicep)}
              >
                <Text className="text-xs text-gray-800">Bắp tay</Text>
                <Text className="text-lg font-extrabold">
                  {mapped.display.bicep ?? '-'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View className="bg-amber-100 rounded-xl p-4 mb-4">
          <Text className="text-base font-semibold mb-2">
            Chỉ số sức khỏe
          </Text>

          <View className="flex-row justify-between items-center">
            <Text className="text-sm text-gray-700">
              Waist-to-Hip Ratio
            </Text>

            <Text className="text-xl font-extrabold">{whr ?? '-'}</Text>
          </View>
        </View>

        <Text className="text-lg font-extrabold mb-3">Số đo chi tiết</Text>

        <View className="flex-row flex-wrap -m-2">
          {detailItems.map((item) => (
            <View key={item.key} className="w-1/2 p-2">
              <View
                className="bg-background-sub2 rounded-xl p-4 shadow"
                style={fadedStyle(item.value)}
              >
                <Text className="text-sm text-gray-700">{item.label}</Text>

                <View className="flex-row items-baseline justify-between mt-2">
                  <Text className="text-2xl font-extrabold">
                    {item.value ?? '-'}
                  </Text>

                  <Text className="text-sm text-gray-500">&nbsp;</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  headerButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerTitleCenter: {
    textAlign: 'center',
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  fadedItem: {
    opacity: 0.35,
  },
});