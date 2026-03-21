import React, { useMemo, useState, useCallback } from 'react';
import { Text, ScrollView, View, Image, Pressable, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import BodySilhouetteOverlay from '../components/BodySilhouetteOverlay';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from '../../../components/Toast';
import Ionicons from '@react-native-vector-icons/ionicons';
import { useNavigation } from '@react-navigation/native';

type Props = NativeStackScreenProps<RootStackParamList, 'BodyGramResult'>;

function mmToCm(mm?: number | null) {
  if (mm == null) return undefined;
  const n = Number(mm);
  if (isNaN(n)) return undefined;
  return +(n / 10).toFixed(0);
}
function gToKg(g?: number | null) {
  if (g == null) return undefined;
  const n = Number(g);
  if (isNaN(n)) return undefined;
  return +(n / 1000).toFixed(0);
}

export default function BodyGramResult({ route, navigation: _navigation }: Props) {
  const nav = useNavigation();
  const { measurements: rawMeasurements, rawResponse } = route.params as any;

  const parseProfile = useCallback((entry: any) => {
    const out: any = { measurements: {}, meta: {} };
    if (!entry) return out;
    const data = entry?.entry ?? entry ?? {};

    out.height = data.heightCm ?? data.height ?? data.height_est ?? undefined;
    out.weight = data.weightKg ?? data.weight ?? data.weight_est ?? undefined;
    out.bmi = data.bmi ?? undefined;
    out.bodyFat = data.bodyFatPercentage ?? undefined;
    const metadata = (typeof data.metadata === 'string') ? (() => { try { return JSON.parse(data.metadata); } catch { return data.metadata; } })() : data.metadata ?? {};
    const bodyComp = metadata?.bodyComposition ?? {};
    out.bodyFat = out.bodyFat ?? bodyComp?.bodyFatPercentage ?? metadata?.bodyFatPercentage ?? undefined;
    out.muscle = data.muscleMassKg ?? bodyComp?.skeletalMuscleMass ?? metadata?.skeletalMuscleMass ?? undefined;
    out.waist = data.waistCm ?? data.waist ?? metadata?.waistCm ?? undefined;
    out.hip = data.hipCm ?? data.hip ?? metadata?.hipCm ?? undefined;
    out.source = data.source ?? undefined;
    out.createdAt = data.createdAt ?? data.created_at ?? metadata?.createdAt ?? undefined;

    const measurementsArr = data.measurements ?? metadata.measurements ?? [];
    (measurementsArr || []).forEach((m: any) => {
      const name = ((m.name || m.key || '') + '').toLowerCase();
      const unit = ((m.unit || '') + '').toLowerCase();
      const rawVal = m.value ?? m.value_mm ?? m.value_cm ?? m.cm ?? m.mm ?? null;
      const num = rawVal != null ? Number(rawVal) : null;
      const valCm = num == null ? null : (unit === 'mm' ? Math.round(num/10) : Math.round(num));
      const valKg = num == null ? null : (unit === 'g' ? Math.round(num/1000) : Math.round(num));

      if (name.includes('bust') || name.includes('bustgirth') || name.includes('chest')) out.measurements.chest = out.measurements.chest ?? valCm;
      else if (name.includes('waist') || name.includes('bellywaist') || name.includes('belly')) out.measurements.waist = out.measurements.waist ?? valCm;
      else if (name.includes('hip') || name.includes('hipgirth') || name.includes('tophip')) out.measurements.hip = out.measurements.hip ?? valCm;
      else if (name.includes('thigh')) out.measurements.thigh = out.measurements.thigh ?? valCm;
      else if (name.includes('calf')) out.measurements.calf = out.measurements.calf ?? valCm;
      else if (name.includes('bicep') || name.includes('upperarm') || name.includes('arm')) out.measurements.bicep = out.measurements.bicep ?? valCm;
      else if (name.includes('forearm') || name.includes('wrist')) out.measurements.forearm = out.measurements.forearm ?? valCm;
      else if (name.includes('shoulder')) out.measurements.shoulder = out.measurements.shoulder ?? valCm;
      else if (name.includes('neck')) out.measurements.neck = out.measurements.neck ?? valCm;
      else if (name.includes('height')) {
        if (valCm != null) out.measurements.height_est = out.measurements.height_est ?? valCm;
      } else if (name.includes('weight')) {
        if (valKg != null) out.measurements.weight_est = out.measurements.weight_est ?? valKg;
      } else {
        out.meta[name] = m.value ?? m;
      }
    });

    try {
      const input = data.input ?? metadata.input ?? {};
      const ps = input.photoScan ?? input;
      if (ps) {
        if (!out.measurements.height_est && (ps.height || ps.heightMm)) {
          const hraw = ps.height ?? ps.heightMm; out.measurements.height_est = (hraw > 1000 ? Math.round(hraw/10) : Math.round(hraw));
        }
        if (!out.measurements.weight_est && (ps.weight || ps.weightG)) {
          const wraw = ps.weight ?? ps.weightG; out.measurements.weight_est = (wraw > 500 ? Math.round(wraw/1000) : Math.round(wraw));
        }
        out.age = ps.age ?? data.age ?? undefined;
        out.gender = (ps.gender ?? data.gender ?? '');
      }
    } catch { }

    out.metadata = metadata;
    return out;
  }, []);

  const parsed = parseProfile(rawResponse?.entry ?? rawResponse ?? {});

  const display = useMemo(() => {
    if (rawMeasurements && !Array.isArray(rawMeasurements)) return rawMeasurements;
    const arr: any[] = Array.isArray(rawMeasurements) ? rawMeasurements : rawResponse?.entry?.measurements ?? rawResponse?.measurements ?? [];
    const out: any = {};

    arr.forEach((m: any) => {
      const name = (m.name || m.key || '').toString().toLowerCase();
      const unit = (m.unit || '').toString().toLowerCase();
      const val = m.value ?? m.value_mm ?? m.value_cm ?? m.cm ?? m.mm ?? null;
      const num = val != null ? Number(val) : null;
      const asCm = num == null ? null : unit === 'mm' ? mmToCm(num) : unit === 'cm' ? Math.round(num) : Math.round(num);

      if (!name) return;
      if (name.includes('bust') || name.includes('chest') || name.includes('bustgirth')) out.bust = asCm;
      else if (name.includes('waist') || name.includes('belly') || name.includes('vong eo') || name.includes('bellywaist')) out.waist = asCm;
      else if (name.includes('hip') || name.includes('hipgirth') || name.includes('tophip')) out.hip = asCm;
      else if (name.includes('thigh') || name.includes('thighgirth') || name.includes('midthigh')) out.thigh = asCm;
      else if (name.includes('calf') || name.includes('calfgirth')) out.calf = asCm;
      else if (name.includes('forearm') || name.includes('forearmgirth') || name.includes('wrist')) out.forearm = asCm;
      else if (name.includes('shoulder') || name.includes('acrossbackshoulder')) out.shoulder = asCm;
      else if (name.includes('upperarm') || name.includes('bicep') || name.includes('arm')) out.bicep = asCm;
      else if (name.includes('height') || name.includes('stature') || name.includes('heightmm')) out.height_est = unit === 'mm' ? mmToCm(num) : Math.round(num as any);
      else if (name.includes('weight') || name.includes('mass')) out.weight_est = unit === 'g' ? gToKg(num) : Math.round(num as any);
    });

    if (!out.height_est && rawResponse?.entry?.input?.photoScan?.height) {
      const h = rawResponse.entry.input.photoScan.height;
      out.height_est = h > 1000 ? mmToCm(h) : h;
    }
    if (!out.weight_est && rawResponse?.entry?.input?.photoScan?.weight) {
      const w = rawResponse.entry.input.photoScan.weight;
      out.weight_est = w > 500 ? gToKg(w) : w;
    }

    return out;
  }, [rawMeasurements, rawResponse]);

  const whr = display.waist && display.hip ? (display.waist / display.hip).toFixed(2) : undefined;

  const [toastVisible, setToastVisible] = useState(false);
  const [toastMsg, _setToastMsg] = useState('');
  const [toastType, _setToastType] = useState<'success' | 'error' | 'info'>('info');

  // helper: map measurement keys to friendly Vietnamese labels
  function formatMeasurementName(rawName: string) {
    if (!rawName) return '';
    const name = rawName.toString().toLowerCase();
    if (name.includes('bust') || name.includes('chest') || name.includes('bustgirth') || name.includes('bust_girth')) return 'Ngực';
    if (name.includes('waist') || name.includes('belly') || name.includes('waistgirth') || name.includes('bellywaist')) return 'Eo';
    if (name.includes('hip') || name.includes('hipgirth') || name.includes('tophip')) return 'Hông';
    if (name.includes('thigh') || name.includes('midthigh') || name.includes('thighgirth')) return 'Đùi';
    if (name.includes('calf') || name.includes('calfgirth')) return 'Bắp chân';
    if (name.includes('forearm') || name.includes('forearmgirth')) return 'Cẳng tay';
    if (name.includes('wrist')) return 'Cổ tay';
    if (name.includes('neck')) return 'Cổ';
    if (name.includes('shoulder')) return 'Vai';
    if (name.includes('underbust')) return 'Dưới ngực';
    if (name.includes('upperarm') || name.includes('bicep')) return 'Bắp tay trên';
    // default: prettify
    return rawName.replace(/[_-]/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2');
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* HEADER: centered title + back */}
      <View style={styles.header}>
        <Pressable onPress={() => (nav as any).goBack()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={22} color="#333" />
        </Pressable>
        <Text style={[styles.headerTitle, styles.headerTitleCenter]}>{'Thông tin cơ thể'}</Text>
        <View style={styles.headerButton} />
      </View>

      <ScrollView className="flex-1 p-4" contentContainerStyle={styles.scrollContent}>
        {/* HEADER SUMMARY */}
        <View className="bg-white rounded-xl p-4 mb-4 flex-row items-center">
          <View className="flex-1">
            <Text className="text-lg font-semibold">{parsed.source ? `Nguồn: ${parsed.source}` : 'Hồ sơ sức khỏe'}</Text>
            <Text className="text-sm text-gray-500 mt-1">{parsed.createdAt ? new Date(parsed.createdAt).toLocaleString() : ''}</Text>
            <Text className="text-sm text-gray-700 mt-2">Chiều cao: {parsed.height ?? parsed.measurements?.height_est ?? '-'} cm   Cân nặng: {parsed.weight ?? parsed.measurements?.weight_est ?? '-'} kg</Text>
          </View>
          <View className="ml-3 items-center">
            <View className="bg-amber-50 rounded-full w-16 h-16 items-center justify-center">
              <Text className="text-amber-700 font-bold">{parsed.bodyFat ? `${parsed.bodyFat}%` : (parsed.bmi ? `BMI ${parsed.bmi}` : '—')}</Text>
            </View>
          </View>
        </View>

        {/* SILHOUETTE CARD (unchanged)*/}
        <View className="bg-white rounded-xl p-4 items-center mb-4">
          <View className="w-64 h-80 items-center justify-center">
            <BodySilhouetteOverlay mode="front" />
            <Image source={require('../../../assets/bodygram.png')} className="w-full h-full" resizeMode="contain" />
            {/* measurement bubbles (unchanged) */}
            <View className="absolute top-8 left-3">
              <View className="bg-amber-200 rounded-lg px-3 py-2 shadow">
                <Text className="text-xs text-gray-800">Ngực</Text>
                <Text className="text-lg font-extrabold">{display.bust ?? '-'}cm</Text>
              </View>
            </View>
            <View className="absolute top-24 left-4">
              <View className="bg-amber-200 rounded-lg px-3 py-2 shadow">
                <Text className="text-xs text-gray-800">Eo</Text>
                <Text className="text-lg font-extrabold">{display.waist ?? '-'}cm</Text>
              </View>
            </View>
            <View className="absolute top-24 right-4">
              <View className="bg-amber-200 rounded-lg px-3 py-2 shadow">
                <Text className="text-xs text-gray-800">Hông</Text>
                <Text className="text-lg font-extrabold">{display.hip ?? '-'}cm</Text>
              </View>
            </View>
            <View className="absolute bottom-9 left-7">
              <View className="bg-amber-200 rounded-lg px-3 py-2 shadow">
                <Text className="text-xs text-gray-800">Đùi</Text>
                <Text className="text-lg font-extrabold">{display.thigh ?? '-'}cm</Text>
              </View>
            </View>
            <View className="absolute top-9 right-7">
              <View className="bg-amber-200 rounded-lg px-3 py-2 shadow">
                <Text className="text-xs text-gray-800">Bắp tay</Text>
                <Text className="text-lg font-extrabold">{display.bicep ?? '-'}cm</Text>
              </View>
            </View>
          </View>
        </View>

        {/* HEALTH CARD */}
        <View className="bg-amber-100 rounded-xl p-4 mb-4">
          <Text className="text-base font-semibold mb-2">Chỉ số sức khỏe</Text>
          <View className="flex-row justify-between items-center">
            <Text className="text-sm text-gray-700">Waist-to-Hip Ratio</Text>
            <Text className="text-xl font-extrabold">{whr ?? '-'}</Text>
          </View>
        </View>

        {/* DETAIL TILES */}
        <Text className="text-lg font-extrabold mb-3">Số đo chi tiết</Text>
        <View className="flex-row flex-wrap -m-2">
          {[
            { key: 'bust', label: 'Ngực' },
            { key: 'waist', label: 'Eo' },
            { key: 'hip', label: 'Hông' },
            { key: 'bicep', label: 'Bắp tay' },
            { key: 'thigh', label: 'Đùi' },
            { key: 'calf', label: 'Bắp chân' },
          ].map((t) => {
            const cur = display[t.key] ?? null;
            return (
              <View key={t.key} className="w-1/2 p-2">
                <View className="bg-background-sub2 rounded-xl p-4 shadow">
                  <Text className="text-sm text-gray-700">{t.label}</Text>
                  <View className="flex-row items-baseline justify-between mt-2">
                    <Text className="text-2xl font-extrabold">{cur ?? '-'}cm</Text>
                    <Text className="text-sm text-gray-500">&nbsp;</Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        {/* BODYGRAM METADATA: show only bodyComposition (Vietnamese labels). If none, do not render. */}
        

        {/* MEASUREMENTS: improved card grid for metadata.measurements */}
        {Array.isArray(parsed?.metadata?.measurements) && parsed.metadata.measurements.length > 0 ? (
          <View className="bg-white rounded-xl p-4 my-4">
            <Text className="text-base font-semibold mb-3">Tất cả số đo (BodyGram)</Text>

            {/* prepare measurements for display */}
            {(() => {
              const list: any[] = parsed.metadata.measurements || [];
              const formatted = list.map((m: any, i: number) => {
                const rawName = m.name ?? m.key ?? `#${i+1}`;
                const unit = (m.unit ?? '').toString().toLowerCase();
                const rawVal = m.value ?? m.value_mm ?? m.value_cm ?? m.cm ?? m.mm ?? m.g ?? m.value_g ?? m.value_kg ?? null;
                let displayVal = '-';
                if (rawVal != null) {
                  const num = Number(rawVal);
                  if (!isNaN(num)) {
                    // compact unit formatting (no space) to match design: e.g. 77cm
                    if (unit === 'mm') displayVal = `${Math.round(num / 10)}cm`;
                    else if (unit === 'cm') displayVal = `${Math.round(num)}cm`;
                    else if (unit === 'g') displayVal = `${(num / 1000).toFixed(2)}kg`;
                    else if (unit === 'kg') displayVal = `${num}kg`;
                    else displayVal = `${rawVal}${m.unit ? ` ${m.unit}` : ''}`;
                  } else {
                    displayVal = String(rawVal);
                  }
                }
                return { rawName, label: formatMeasurementName(rawName), displayVal };
              });

              // prioritize common measurements first
              const priority = ['Ngực', 'Eo', 'Hông', 'Đùi', 'Bắp tay', 'Bắp chân', 'Vai', 'Cổ', 'Cẳng tay', 'Cổ tay'];
              formatted.sort((a, b) => {
                const ia = priority.indexOf(a.label);
                const ib = priority.indexOf(b.label);
                if (ia === -1 && ib === -1) return 0;
                if (ia === -1) return 1;
                if (ib === -1) return -1;
                return ia - ib;
              });

              return (
                <View style={styles.measurementsGrid}>
                  {formatted.map((it, idx) => (
                    <View key={idx} style={styles.measurementCard}>
                      <View style={styles.measurementInner}>
                        <Text style={styles.measurementLabel}>{it.label}</Text>
                        <Text style={styles.measurementValue}>{it.displayVal}</Text>
                        <Text style={styles.measurementRaw}>{it.rawName}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              );
            })()}
          </View>
        ) : null}

         <Toast visible={toastVisible} message={toastMsg} type={toastType} onHidden={() => setToastVisible(false)} />

       </ScrollView>

       
     </SafeAreaView>
   );
 }

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#e5e7eb', backgroundColor: '#fff' },
  headerButton: { padding: 8 },
  headerButtonText: { color: '#333' },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  headerTitleCenter: { textAlign: 'center', flex: 1 },
  scrollContent: { paddingBottom: 140 },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: 16, backgroundColor: 'transparent' },
  metaAvatar: { width: 120, height: 120, borderRadius: 8, marginBottom: 8 },
  metaRawBox: { maxHeight: 120, backgroundColor: '#f8fafc', padding: 8, borderRadius: 6 },
  metaRawText: { fontSize: 12, color: '#374151' },
  measurementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  measurementCard: {
    backgroundColor: '#FDEFD8', // warm peach
    borderRadius: 12,
    paddingVertical: 18,
    paddingHorizontal: 18,
    marginBottom: 12,
    width: '48%',
    shadowColor: '#f1e7dc',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 2,
  },
  measurementInner: {
    alignItems: 'flex-start',
    minHeight: 72,
  },
  measurementLabel: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 6,
    textTransform: 'none',
  },
  measurementValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 6,
  },
  measurementRaw: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 6,
  },
});
