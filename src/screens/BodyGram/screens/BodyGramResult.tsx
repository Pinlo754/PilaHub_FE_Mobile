import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { Text, ScrollView, View, Image, Pressable, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import BodySilhouetteOverlay from '../components/BodySilhouetteOverlay';
import { useOnboardingStore } from '../../../store/onboarding.store';
import { SafeAreaView } from 'react-native-safe-area-context';
import LoadingOverlay from '../../../components/LoadingOverlay';
import Toast from '../../../components/Toast';
import Ionicons from '@react-native-vector-icons/ionicons';
import { useNavigation } from '@react-navigation/native';
import { fetchMyHealthProfiles } from '../../../services/profile';

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
  const _onboarding = useOnboardingStore((s) => s.data);
  const _setData = useOnboardingStore((s) => s.setData);
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

  // previous profile state for automatic comparison
  const [previousDisplay, setPreviousDisplay] = useState<any | null>(null);
  const [prevLoading, setPrevLoading] = useState(false);
  const [parsedProfilesList, setParsedProfilesList] = useState<any[]>([]);
  const [selectedProfileIndex, setSelectedProfileIndex] = useState<number | null>(null);
  const didLoadPrevRef = React.useRef(false);

  // normalize a parsed profile into the same shape as `display` used for current
  function normalizeParsedToDisplay(parsedProfile: any) {
    if (!parsedProfile) return null;
    const out: any = {};
    // prefer explicit measurement fields if present
    out.weight_est = parsedProfile.weight ?? parsedProfile.measurements?.weight_est ?? null;
    out.height_est = parsedProfile.height ?? parsedProfile.measurements?.height_est ?? null;
    out.bust = parsedProfile.measurements?.chest ?? parsedProfile.measurements?.bust ?? parsedProfile.measurements?.bust ?? parsedProfile.measurements?.chest ?? null;
    out.waist = parsedProfile.waist ?? parsedProfile.measurements?.waist ?? null;
    out.hip = parsedProfile.hip ?? parsedProfile.measurements?.hip ?? null;
    out.thigh = parsedProfile.measurements?.thigh ?? null;
    out.bicep = parsedProfile.muscle ?? parsedProfile.measurements?.bicep ?? null;
    out.calf = parsedProfile.measurements?.calf ?? null;
    return out;
  }

  // fetch user's health profiles and pick the most recent one before current parsed.createdAt
  // load previous profiles once per source timestamp (avoid reruns)
  useEffect(() => {
    // run previous-profile load only once per mount
    if (didLoadPrevRef.current) return;
    let mounted = true;
    async function loadPrevious() {
      didLoadPrevRef.current = true;
      setPrevLoading(true);
      try {
        const res = await fetchMyHealthProfiles();
        if (!mounted) return;
        if (!res.ok) return setPreviousDisplay(null);
        const profiles: any[] = res.data ?? [];
        if (!Array.isArray(profiles) || profiles.length === 0) return setPreviousDisplay(null);

        // parse entries into normalized parsed objects using existing parseProfile
        const parsedProfiles = profiles.map((p: any, idx: number) => ({ raw: p, parsed: parseProfile(p.entry ?? p ?? {}), idx })).filter((p: any) => p && (p.parsed.createdAt || p.parsed.metadata?.createdAt));
        console.log('[BodyGramResult] fetched profiles count:', parsedProfiles.length);
        setParsedProfilesList(parsedProfiles.map(p => p.parsed));

        // sort by createdAt descending (operate on parsed)
        parsedProfiles.sort((a: any, b: any) => {
          const ta = new Date(a.parsed.createdAt || a.parsed.metadata?.createdAt || 0).getTime();
          const tb = new Date(b.parsed.createdAt || b.parsed.metadata?.createdAt || 0).getTime();
          return tb - ta;
        });

        // find the first profile that is older than current parsed (if parsed.createdAt exists)
        let candidateWrapper: any = null;
        const currentTime = parsed?.createdAt ? new Date(parsed.createdAt).getTime() : null;
        if (currentTime != null) {
          candidateWrapper = parsedProfiles.find((p: any) => {
            const t = new Date(p.parsed.createdAt || p.parsed.metadata?.createdAt || 0).getTime();
            return t < currentTime;
          });
        }
        // if none found, pick the second-most-recent (i.e., parsedProfiles[1]) or the most recent if list has at least one and current is not in list
        if (!candidateWrapper) {
          candidateWrapper = parsedProfiles.find(p => {
            const curId = parsed?.metadata?.profileId ?? parsed?.metadata?.id ?? parsed?.createdAt;
            const pid = p.parsed?.metadata?.profileId ?? p.parsed?.metadata?.id ?? p.parsed?.createdAt;
            return curId !== pid;
          }) || parsedProfiles[1] || parsedProfiles[0];
        }

        if (candidateWrapper) {
          const candidate = candidateWrapper.parsed;
          const norm = normalizeParsedToDisplay(candidate);
          setPreviousDisplay(norm);
          // set selectedProfileIndex to first candidate index in parsedProfilesList
          const foundIndex = parsedProfiles.findIndex((pp: any) => pp.parsed === candidate);
          setSelectedProfileIndex(foundIndex >= 0 ? foundIndex : 0);
        } else {
          setPreviousDisplay(null);
        }
      } catch (e) {
        console.warn('Could not load previous profiles', e);
        setPreviousDisplay(null);
      } finally {
        if (mounted) setPrevLoading(false);
      }
    }
    // derive a stable key from rawResponse timestamps so effect doesn't re-run every render
    loadPrevious();
    return () => { mounted = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawResponse?.entry?.createdAt, rawResponse?.createdAt]);

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* HEADER: centered title + back */}
      <View style={styles.header}>
        <Pressable onPress={() => (nav as any).goBack()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={22} color="#333" />
        </Pressable>
        <Text style={[styles.headerTitle, styles.headerTitleCenter]}>{'Kết quả'}</Text>
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

        {/* PROFILE SELECTOR (previous profiles) */}
        {parsedProfilesList.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
            {parsedProfilesList.map((p, i) => {
              const label = p.createdAt ? new Date(p.createdAt).toLocaleDateString() : `#${i+1}`;
              const active = selectedProfileIndex === i;
              const brief = normalizeParsedToDisplay(p);
              return (
                <Pressable
                  key={i}
                  onPress={() => { setSelectedProfileIndex(i); setPreviousDisplay(normalizeParsedToDisplay(p)); }}
                  className={`mr-3 p-3 rounded-lg ${active ? 'bg-amber-200' : 'bg-white'}`}
                  style={{ minWidth: 140 }}
                >
                  <Text className="text-sm font-semibold mb-1">{label}</Text>
                  <Text className="text-xs text-gray-600">Cân nặng: {brief?.weight_est ?? '-'} kg</Text>
                  <Text className="text-xs text-gray-600">Ngực: {brief?.bust ?? '-'} cm</Text>
                  <Text className="text-xs text-gray-600">Eo: {brief?.waist ?? '-'} cm</Text>
                  <Text className="text-xs text-gray-600">Hông: {brief?.hip ?? '-'} cm</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        ) : null}

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
            const prev = previousDisplay ? previousDisplay[t.key] ?? null : null;
            const delta = (cur != null && prev != null) ? cur - prev : null;
            const pct = (delta != null && prev) ? (delta / prev * 100) : null;
            const isIncrease = delta != null ? delta > 0 : false;
            const changeColor = delta == null ? 'text-gray-500' : isIncrease ? 'text-green-600' : 'text-red-600';

            return (
              <View key={t.key} className="w-1/2 p-2">
                <View className="bg-background-sub2 rounded-xl p-4 shadow">
                  <Text className="text-sm text-gray-700">{t.label}</Text>
                  <View className="flex-row items-baseline justify-between mt-2">
                    <Text className="text-2xl font-extrabold">{cur ?? '-'}cm</Text>
                    {delta != null ? (
                      <View className="items-end">
                        <Text className={`${changeColor} text-lg font-semibold`}>{delta > 0 ? `+${delta}` : `${delta}`}{t.key === 'weight' || t.key === 'weight_est' ? ' kg' : ' cm'}</Text>
                        {pct != null ? <Text className="text-xs text-gray-500">{pct > 0 ? `+${pct.toFixed(1)}%` : `${pct.toFixed(1)}%`}</Text> : null}
                      </View>
                    ) : (
                      <Text className="text-sm text-gray-500">Không có dữ liệu trước</Text>
                    )}
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        {/* Compare with previous profile if available (auto-loaded most recent) */}
        {/* detailed per-tile deltas rendered above */}

         {prevLoading ? <LoadingOverlay message="Đang tải hồ sơ trước..." /> : null}
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
 
});
