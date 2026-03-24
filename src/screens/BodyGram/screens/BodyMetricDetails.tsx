import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Dimensions, Image } from 'react-native';
import { fetchMyHealthProfileMetrics, fetchHealthProfileById } from '../../../services/profile';
import { LineChart } from 'react-native-chart-kit';
import Ionicons from '@react-native-vector-icons/ionicons';
import BodySilhouetteOverlay from '../components/BodySilhouetteOverlay';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function BodyMetricDetails({ navigation }: any) {
  const [metricsData, setMetricsData] = useState<any | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [activeMetric, setActiveMetric] = useState<'weightKg' | 'bmi' | 'bodyFatPercentage' | 'muscleMassKg' | 'waistCm' | 'hipCm'>('weightKg');

  useEffect(() => {
    let mounted = true;
    async function load() {
      const res = await fetchMyHealthProfileMetrics();
      if (!mounted) return;
      if (!res.ok) return;
      setMetricsData(res.data);
      // if response includes a latestProfileId, fetch that profile to show avatar/details
      try {
        const latestId = res.data?.latestProfileId;
        if (latestId) {
          const pRes = await fetchHealthProfileById(String(latestId));
          if (pRes.ok) setProfile(pRes.data);
        }
      } catch {
        // ignore
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  const metrics = metricsData?.metrics ?? null;
  const latestComparison = metricsData?.latestComparison ?? null;

  function toChart(dataset: any[]) {
    if (!Array.isArray(dataset)) return { labels: [], values: [] };
    // filter out points with non-finite values (NaN, Infinity) to prevent SVG path errors
    const safe: any[] = (dataset || []).filter((d: any) => {
      const v = d == null ? null : Number(d.value);
      return v != null && Number.isFinite(v);
    }).map((d: any) => ({ date: d.date, value: Number(d.value) }));

    if (safe.length === 0) return { labels: [], values: [] };

    const vals = safe.map((d) => d.value);
    const labels = safe.map((d) => d.date);
    return { labels, values: vals };
  }

  const activeChart = useMemo(() => {
    if (!metrics) return { labels: [], values: [] };
    return toChart(metrics[activeMetric] ?? []);
  }, [metrics, activeMetric]);

  // helper to read a named measurement from profile.metadata.measurements
  function findMeasurement(profileObj: any, keywords: string[]) {
    try {
      let meta = profileObj?.metadata ?? profileObj?.metadata;
      if (typeof meta === 'string') meta = JSON.parse(meta || '{}');
      const arr = meta?.measurements ?? [];
      for (const m of arr) {
        const name = (m.name || m.key || '') + '';
        const lname = name.toLowerCase();
        for (const kw of keywords) {
          if (lname.includes(kw)) {
            const unit = ((m.unit || '') + '').toLowerCase();
            const raw = m.value ?? m.value_mm ?? m.value_cm ?? m.cm ?? m.mm ?? null;
            if (raw == null) return null;
            const num = Number(raw);
            if (isNaN(num)) return null;
            if (unit === 'mm') return `${Math.round(num/10)}cm`;
            if (unit === 'cm') return `${Math.round(num)}cm`;
            if (unit === 'g') return `${(num/1000).toFixed(2)}kg`;
            if (unit === 'kg') return `${num}kg`;
            return `${raw}`;
          }
        }
      }
    } catch { /* ignore */ }
    return null;
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.headerBtn}><Ionicons name="arrow-back" size={22} color="#333" /></Pressable>
        <Text style={styles.headerTitle}>Lịch sử số đo</Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        {/* Silhouette summary (latest profile measurements) */}
        {profile ? (
          <View style={styles.silhouetteSummaryCard}>
            <View style={styles.silhouetteSmall}>
              <BodySilhouetteOverlay mode="front" />
              <Image source={require('../../../assets/bodygram.png')} style={styles.silhouetteSmallImage} resizeMode="contain" />

              <View style={styles.silSmallTopLeft}>
                <View style={styles.bubbleCardSmall}><Text style={styles.bubbleLabel}>Ngực</Text><Text style={styles.bubbleValueSmall}>{findMeasurement(profile, ['bust','chest','bustgirth']) ?? '-'}</Text></View>
              </View>
              <View style={styles.silSmallMidLeft}>
                <View style={styles.bubbleCardSmall}><Text style={styles.bubbleLabel}>Eo</Text><Text style={styles.bubbleValueSmall}>{findMeasurement(profile, ['waist','belly','waistgirth']) ?? '-'}</Text></View>
              </View>
              <View style={styles.silSmallTopRight}>
                <View style={styles.bubbleCardSmall}><Text style={styles.bubbleLabel}>Bắp tay</Text><Text style={styles.bubbleValueSmall}>{findMeasurement(profile, ['bicep','upperarm','arm']) ?? '-'}</Text></View>
              </View>
              <View style={styles.silSmallMidRight}>
                <View style={styles.bubbleCardSmall}><Text style={styles.bubbleLabel}>Hông</Text><Text style={styles.bubbleValueSmall}>{findMeasurement(profile, ['hip','tophip','hipgirth']) ?? '-'}</Text></View>
              </View>
              <View style={styles.silSmallBottom}>
                <View style={styles.bubbleCardSmall}><Text style={styles.bubbleLabel}>Đùi</Text><Text style={styles.bubbleValueSmall}>{findMeasurement(profile, ['thigh','midthigh','thighgirth']) ?? '-'}</Text></View>
              </View>
            </View>
          </View>
        ) : null}

        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>So sánh nhanh</Text>
            <Pressable onPress={() => (navigation as any).navigate('HealthProfiles')} style={styles.viewProfilesBtn}>
              <Text style={styles.viewProfilesText}>Xem hồ sơ</Text>
            </Pressable>
          </View>
          <View style={styles.quickGrid}>
            {['weightKg','bmi','bodyFatPercentage','muscleMassKg','waistCm','hipCm'].map((k) => {
              const comp = latestComparison?.[k];
              const upDown = comp == null ? null : (Number(comp) > 0 ? 'up' : (Number(comp) < 0 ? 'down' : 'same'));
              const color = upDown === 'up' ? '#dc2626' : upDown === 'down' ? '#16a34a' : '#6b7280';
              const labelMap: any = { weightKg: 'Cân nặng', bmi: 'BMI', bodyFatPercentage: 'Tỷ lệ mỡ', muscleMassKg: 'Khối cơ', waistCm: 'Eo', hipCm: 'Hông' };
              return (
                <View key={k} style={styles.quickItem}>
                  <Text style={styles.quickLabel}>{labelMap[k]}</Text>
                  <Text style={[styles.quickValue, { color }]}>{comp == null ? '-' : (Number(comp) > 0 ? `+${comp}` : `${comp}`)}</Text>
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Biểu đồ</Text>

          <View style={styles.tabRow}>
            {['weightKg','bmi','bodyFatPercentage','muscleMassKg','waistCm','hipCm'].map((k) => (
              <Pressable key={k} onPress={() => setActiveMetric(k as any)} style={[styles.tabBtn, activeMetric === k ? styles.tabBtnActive : null]}>
                <Text style={[styles.tabText, activeMetric === k ? styles.tabTextActive : null]}>{k === 'weightKg' ? 'Cân nặng' : k === 'bmi' ? 'BMI' : k === 'bodyFatPercentage' ? 'Tỷ lệ mỡ' : k === 'muscleMassKg' ? 'Khối cơ' : k === 'waistCm' ? 'Eo' : 'Hông'}</Text>
              </Pressable>
            ))}
          </View>

          {/* render chart only when we have at least 2 valid numeric points */}
          {Array.isArray(activeChart.values) && activeChart.values.length >= 2 ? (
            <LineChart
              data={{ labels: (activeChart.labels || []).map(String), datasets: [{ data: (activeChart.values || []).map((v: any) => Number(v)) }] }}
              width={width - 32}
              height={260}
              chartConfig={{
                backgroundGradientFrom: '#fff',
                backgroundGradientTo: '#fff',
                decimalPlaces: 1,
                color: () => '#2563eb',
                labelColor: () => '#6b7280',
                propsForDots: { r: '4', strokeWidth: '2', stroke: '#fff' }
              }}
              bezier
              withDots
              withInnerLines
              style={styles.chartStyle}
            />
          ) : (
            <View style={styles.placeholderWrap}>
              <Text style={styles.placeholderText}>Không đủ dữ liệu để hiển thị biểu đồ</Text>
            </View>
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FAFAFB' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff' },
  headerBtn: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  container: { padding: 16 },
  card: { backgroundColor: '#fff', padding: 14, borderRadius: 12, marginBottom: 12 },
  cardTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  viewProfilesBtn: { paddingVertical: 6, paddingHorizontal: 10, backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#eee' },
  viewProfilesText: { color: '#2563eb', fontWeight: '700' },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  quickItem: { width: '48%', padding: 10, borderRadius: 10, backgroundColor: '#fdf6ec', marginBottom: 8 },
  quickLabel: { fontSize: 12, color: '#6b7280' },
  quickValue: { fontSize: 16, fontWeight: '700' },
  tabRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tabBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, backgroundColor: '#f3f4f6', marginRight: 8, marginBottom: 8 },
  tabBtnActive: { backgroundColor: '#2563eb' },
  tabText: { color: '#374151', fontWeight: '600' },
  tabTextActive: { color: '#fff' },
  chartStyle: { borderRadius: 12, marginTop: 12 },
  placeholderWrap: { paddingVertical: 36, alignItems: 'center' },
  placeholderText: { color: '#6b7280' },
  profileCard: { backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 12 },
  profileInner: { flexDirection: 'row', alignItems: 'center' },
  profileAvatarWrap: { position: 'relative' },
  profileAvatar: { width: 56, height: 56, borderRadius: 8, marginRight: 12, backgroundColor: '#f3f4f6' },
  profileAvatarOverlay: { position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  profileInitial: { fontSize: 18, fontWeight: '700', color: '#c2410c' },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 15, fontWeight: '700' },
  profileMeta: { fontSize: 12, color: '#6b7280', marginTop: 4 },
  silhouetteSummaryCard: { backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 12, overflow: 'hidden' },
  silhouetteSmall: { position: 'relative', alignItems: 'center', justifyContent: 'center', aspectRatio: 1, width: '100%', borderRadius: 12 },
  silhouetteSmallImage: { position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, width: '100%', height: '100%', borderRadius: 12 },
  silSmallTopLeft: { position: 'absolute', left: 8, top: 8 },
  silSmallMidLeft: { position: 'absolute', left: 8, top: 40 },
  silSmallTopRight: { position: 'absolute', right: 8, top: 8 },
  silSmallMidRight: { position: 'absolute', right: 8, top: 40 },
  silSmallBottom: { position: 'absolute', left: '50%', bottom: 8, transform: [{ translateX: -55 }] },
  bubbleCardSmall: { backgroundColor: '#f3f4f6', borderRadius: 10, padding: 8, marginBottom: 4, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  bubbleLabel: { fontSize: 12, color: '#6b7280' },
  bubbleValueSmall: { fontSize: 14, fontWeight: '700' },
});
