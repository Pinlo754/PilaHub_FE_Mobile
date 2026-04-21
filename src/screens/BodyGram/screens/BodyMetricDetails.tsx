import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Dimensions, Image, Alert, Modal, TextInput, KeyboardAvoidingView, TouchableOpacity, Platform } from 'react-native';
import { fetchMyHealthProfileMetrics, fetchHealthProfileById, createHealthProfile, buildHealthProfilePayload } from '../../../services/profile';
import { LineChart } from 'react-native-chart-kit';
import Ionicons from '@react-native-vector-icons/ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function BodyMetricDetails({ navigation }: any) {
  const [metricsData, setMetricsData] = useState<any | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [activeMetric, setActiveMetric] = useState<'weightKg' | 'bmi' | 'bodyFatPercentage' | 'muscleMassKg' | 'waistCm' | 'hipCm'>('weightKg');
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
  const [pendingBodyGramForCreate, setPendingBodyGramForCreate] = useState<any>(null);

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
          if (pRes.ok) {
            console.log('DEBUG: fetched latest health profile:', pRes.data);
            setProfile(pRes.data);
          }
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

    // sort by date ascending to ensure chart x-axis is chronological
    safe.sort((a, b) => {
      const ta = Number(new Date(a.date));
      const tb = Number(new Date(b.date));
      return ta - tb;
    });

    const vals = safe.map((d) => d.value);
    // shorten labels for readability (dd/MM)
    const labels = safe.map((d) => {
      try { return new Date(d.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }); } catch { return String(d.date); }
    });
    return { labels, values: vals, raw: safe };
  }

  const activeChart = useMemo(() => {
    if (!metrics) return { labels: [], values: [] };
    return toChart(metrics[activeMetric] ?? []);
  }, [metrics, activeMetric]);

  // helper to read a named measurement from profile.metadata.measurements
  function findMeasurement(profileObj: any, keywords: string[]) {
    try {
      // 1) quick scan profile top-level numeric fields (e.g., waistCm, hipCm, weightKg, bodyFatPercentage)
      if (profileObj && typeof profileObj === 'object') {
        for (const k of Object.keys(profileObj)) {
          const v = profileObj[k];
          if (v != null && typeof v === 'number') {
            const lname = k.toLowerCase();
            for (const kw of keywords) {
              if (lname.includes(kw)) {
                // heuristic unit
                if (lname.includes('cm') || kw.includes('waist') || kw.includes('hip') || kw.includes('thigh') || kw.includes('bust') || kw.includes('chest') || kw.includes('shoulder') || kw.includes('arm')) return `${Math.round(v)}cm`;
                if (lname.includes('kg') || kw.includes('weight') || kw.includes('mass')) return `${v}kg`;
                if (lname.includes('fat') || kw.includes('fat') || lname.includes('bfp') || kw.includes('bodyfat')) return `${v}%`;
                return String(v);
              }
            }
          }
        }
      }

      // 2) if metadata is a plain object like { shoulder:20, thigh:20 }, check keys
      let meta = profileObj?.metadata ?? {};
      if (typeof meta === 'string') {
        try { meta = JSON.parse(meta || '{}'); } catch { meta = {}; }
      }
      if (meta && typeof meta === 'object' && !Array.isArray(meta)) {
        for (const mk of Object.keys(meta)) {
          const mv = meta[mk];
          if (mv == null) continue;
          const mkLower = mk.toLowerCase();
          for (const kw of keywords) {
            if (mkLower.includes(kw) || kw.includes(mkLower)) {
              const num = Number(mv);
              if (!Number.isFinite(num)) return `${mv}`;
              // heuristic: body part -> cm, weight -> kg, fat -> %
              if (mkLower.includes('waist') || mkLower.includes('hip') || mkLower.includes('thigh') || mkLower.includes('bust') || mkLower.includes('chest') || mkLower.includes('shoulder') || mkLower.includes('arm')) return `${Math.round(num)}cm`;
              if (mkLower.includes('weight') || mkLower.includes('kg') || mkLower.includes('mass')) return `${num}kg`;
              if (mkLower.includes('fat') || mkLower.includes('bodyfat')) return `${num}%`;
              return `${num}`;
            }
          }
        }
      }

      // 3) fall back to previous flexible array/object search
      let arr: any[] = [];
      if (Array.isArray(profileObj?.measurements)) {
        arr = profileObj.measurements;
      } else {
        if (Array.isArray(meta?.measurements)) arr = meta.measurements;
        else if (Array.isArray(meta?.measurementList)) arr = meta.measurementList;
      }

      if (arr.length === 0) {
        for (const k of Object.keys(profileObj || {})) {
          const v = profileObj[k];
          if (Array.isArray(v) && v.length > 0 && typeof v[0] === 'object' && (v[0].name || v[0].key || v[0].value)) {
            arr = v; break;
          }
        }
      }

      for (const m of arr) {
        const name = (m.name || m.key || m.label || '') + '';
        const lname = name.toLowerCase();
        for (const kw of keywords) {
          if (lname.includes(kw)) {
            const unit = ((m.unit || '') + '').toLowerCase();
            const raw = m.value ?? m.latestValue ?? m.value_mm ?? m.value_cm ?? m.cm ?? m.mm ?? (m.values && m.values[0] && m.values[0].value) ?? null;
            if (raw == null || raw === '') return null;
            const num = Number(raw);
            if (!Number.isFinite(num)) return `${raw}`;
            if (unit === 'mm') return `${Math.round(num/10)}cm`;
            if (unit === 'cm') return `${Math.round(num)}cm`;
            if (unit === 'g') return `${(num/1000).toFixed(2)}kg`;
            if (unit === 'kg') return `${num}kg`;
            if (kw.includes('waist') || kw.includes('hip') || kw.includes('thigh') || kw.includes('bust') || kw.includes('chest') || kw.includes('bicep') || kw.includes('arm')) return `${Math.round(num)}cm`;
            if (kw.includes('weight') || kw.includes('kg') || kw.includes('mass')) return `${num}kg`;
            if (kw.includes('fat') || kw.includes('bodyfat')) return `${num}%`;
            return `${raw}`;
          }
        }
      }
    } catch { /* ignore */ }
    return null;
  }

  // return a readable latest value for a given metric key
  function getLatestValue(key: string) {
    try {
      // prefer top-level profile fields if present (backend DTO may include these)
      const top = profile?.[key];
      if (top != null) {
        if (String(key).toLowerCase().includes('kg')) return `${top}kg`;
        if (String(key).toLowerCase().includes('cm')) return `${top}cm`;
        if (key === 'bodyFatPercentage') return `${top}%`;
        return String(top);
      }
    } catch { /* ignore */ }

    const kws: any = {
      weightKg: ['weight', 'weightkg', 'mass', 'kg'],
      bmi: ['bmi'],
      bodyFatPercentage: ['body fat', 'bodyfat', 'fat', 'body_fat'],
      muscleMassKg: ['muscle', 'muscle mass', 'musclemass'],
      waistCm: ['waist', 'waistgirth', 'belly'],
      hipCm: ['hip', 'hipgirth']
    };

    // try metadata measurements
    const found = findMeasurement(profile, kws[key] || []);
    if (found) return found;

    // fallback to last metric point from metrics arrays
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
      (navigation as any).navigate('BodyScanFlow');
    } catch (e) {
      console.log('Rescan navigation error', e);
      Alert.alert('Lỗi', 'Không thể bắt đầu quét.');
    }
  }

  async function handleCreateHealthProfile() {
    if (!profile) {
      Alert.alert('Không có dữ liệu', 'Không có hồ sơ để gửi. Vui lòng quét hoặc nhập số đo.');
      return;
    }

    try {
      // prepare bodyGramPayload by merging parsed metadata if present
      let bodyGramPayload: any = profile;
      try {
        if (typeof profile?.metadata === 'string') {
          const md = JSON.parse(profile.metadata || '{}');
          bodyGramPayload = { ...profile, ...(md || {}) };
        }
      } catch { /* ignore parse errors */ }

      // build health payload to see if normalization yields height/weight
      const hp = buildHealthProfilePayload(bodyGramPayload, 'BodyMetricDetails');

      // Prefill inputs from normalized payload, or attempt to parse from profile/metrics
      const prefHeight = hp.heightCm ?? parseNumberFromLabel(String(findMeasurement(profile, ['height','heightcm','stature']) ?? '')) ?? null;
      const prefWeight = hp.weightKg ?? parseNumberFromLabel(String(findMeasurement(profile, ['weight','weightkg','mass','kg']) ?? '')) ?? null;

      setHeightInput(prefHeight ? String(prefHeight) : '');
      setWeightInput(prefWeight ? String(prefWeight) : '');
      // prefill extra measurements if available
      const prefBust = parseNumberFromLabel(String(findMeasurement(profile, ['bust','chest','bustgirth']) ?? ''));
      const prefWaist = parseNumberFromLabel(String(findMeasurement(profile, ['waist','belly','waistgirth']) ?? ''));
      const prefHip = parseNumberFromLabel(String(findMeasurement(profile, ['hip','tophip','hipgirth']) ?? ''));
      const prefBicep = parseNumberFromLabel(String(findMeasurement(profile, ['bicep','upperarm','arm']) ?? ''));
      const prefThigh = parseNumberFromLabel(String(findMeasurement(profile, ['thigh','midthigh','thighgirth']) ?? ''));
      const prefCalf = parseNumberFromLabel(String(findMeasurement(profile, ['calf','calfgirth']) ?? ''));
      setBustInput(prefBust ? String(prefBust) : '');
      setWaistInput(prefWaist ? String(prefWaist) : (prefWaist === 0 ? '0' : ''));
      setHipInput(prefHip ? String(prefHip) : '');
      setBicepInput(prefBicep ? String(prefBicep) : '');
      setThighInput(prefThigh ? String(prefThigh) : '');
      setCalfInput(prefCalf ? String(prefCalf) : '');
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
      Alert.alert('Lỗi', 'Vui lòng nhập chiều cao(cm) và cân nặng(kg) hợp lệ.');
      return;
    }

    const bmiVal = Number(bmiInput) || undefined;
    const bodyFatVal = Number(bodyFatInput) || undefined;
    const muscleVal = Number(muscleInput) || undefined;
    const waistVal = Number(waistInput) || undefined;
    const hipVal = Number(hipInput) || undefined;

    // build metadata by merging existing profile.metadata (if any) and attach images/extra
    let existingMeta: any = {};
    try {
      if (typeof (pendingBodyGramForCreate || profile)?.metadata === 'string') existingMeta = JSON.parse((pendingBodyGramForCreate || profile).metadata || '{}');
      else existingMeta = (pendingBodyGramForCreate || profile)?.metadata ?? {};
    } catch { existingMeta = {}; }

    const metadataObj: any = { ...(existingMeta || {}) };
    // copy possible image fields to metadata
    const maybeImg = (pendingBodyGramForCreate || profile)?.avatarUrl ?? (pendingBodyGramForCreate || profile)?.avatar ?? (pendingBodyGramForCreate || profile)?.photo ?? null;
    if (maybeImg) metadataObj.image = maybeImg;
    // include original measurements if present
    if ((pendingBodyGramForCreate || profile)?.measurements) metadataObj.measurements = (pendingBodyGramForCreate || profile).measurements;
    // include extra simple measurements from modal (null if not provided)
    const extraMeasures: any = {
      bust: parseNullableNumber(bustInput),
      waist: parseNullableNumber(waistInput),
      hip: parseNullableNumber(hipInput),
      bicep: parseNullableNumber(bicepInput),
      thigh: parseNullableNumber(thighInput),
      calf: parseNullableNumber(calfInput),
    };
    metadataObj.simpleMeasurements = { ...(metadataObj.simpleMeasurements || {}), ...extraMeasures };

    // redact large strings
    const redactLargeStrings = (obj: any) => {
      if (!obj || typeof obj !== 'object') return;
      for (const k of Object.keys(obj)) {
        const v = obj[k];
        if (typeof v === 'string' && v.length > 2000) obj[k] = '[redacted]';
        else if (typeof v === 'object') redactLargeStrings(v);
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
      const res = await createHealthProfile(bodyGramPayload, 'BodyMetricDetails');
      if (res && res.ok) {
        Alert.alert('Thành công', 'Đã tạo health-profile mới.');
        try {
          const refreshed = await fetchMyHealthProfileMetrics();
          if (refreshed.ok) setMetricsData(refreshed.data);
        } catch { }
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

  function renderInputRow(label: string, value: string, onChange: (s: string) => void, placeholder: string, unit?: string) {
    return (
      <View>
        <Text style={modalStyles.inputLabel}>{label}</Text>
        <View style={modalStyles.inputRow}>
          <TextInput
            value={value}
            onChangeText={onChange}
            keyboardType={'numeric'}
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
      (navigation as any).navigate('InBodyScan');
    } catch (e) {
      console.log('InBody navigation error', e);
      Alert.alert('Lỗi', 'Không thể mở InBody scan.');
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.headerBtn}><Ionicons name="arrow-back" size={22} color="#333" /></Pressable>
        <Text style={styles.headerTitle}>Lịch sử số đo</Text>
        <View style={styles.headerBtn} />
      </View>

      {/* ACTIONS: rescan, dropdown for updates, and view profiles */}
      <View style={styles.actionRow}>
        {/* Primary dropdown button: keep brown (actionBtnPrimary) and don't override its bg */}
        <View style={styles.dropdownWrap}>
          <Pressable onPress={() => setMenuVisible((s) => !s)} style={[styles.actionBtn, styles.actionBtnPrimary]}> 
            <Text style={styles.actionTextPrimary}>Cập nhật số đo ▾</Text>
          </Pressable>

          {menuVisible ? (
            <View style={styles.menuBox}>
              <TouchableOpacity onPress={() => { setMenuVisible(false); handleRescan(); }} style={styles.menuItem}><Text style={styles.menuItemText}>Quét Bodygram</Text></TouchableOpacity>
              <TouchableOpacity onPress={async () => { setMenuVisible(false); await handleCreateHealthProfile(); }} style={styles.menuItem}><Text style={styles.menuItemText}>Cập nhật thủ công</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => { setMenuVisible(false); handleInbodyScan(); }} style={[styles.menuItem, styles.menuItemLast]}>
                <View style={styles.menuItemRow}><Ionicons name="flame" size={16} color="#FF4500" style={styles.menuItemIcon} /><Text style={styles.menuItemText}>InBody Scan</Text></View>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>

        <Pressable onPress={() => (navigation as any).navigate('HealthProfiles')} style={[styles.actionBtn, styles.viewProfilesBtnTop]}>
          <Text style={styles.actionText}>Xem hồ sơ</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        {/* Silhouette summary (latest profile measurements) */}
        {profile ? (
          <View style={styles.silhouetteSummaryCard}>
            <View style={styles.silhouetteSmall}>
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
          </View>
          <View style={styles.quickGrid}>
            {['weightKg','bmi','bodyFatPercentage','muscleMassKg','waistCm','hipCm'].map((k) => {
              const comp = latestComparison?.[k];
              const upDown = comp == null ? null : (Number(comp) > 0 ? 'up' : (Number(comp) < 0 ? 'down' : 'same'));
              const diffColor = upDown === 'up' ? '#dc2626' : upDown === 'down' ? '#16a34a' : '#6b7280';
              const labelMap: any = { weightKg: 'Cân nặng', bmi: 'BMI', bodyFatPercentage: 'Tỷ lệ mỡ', muscleMassKg: 'Khối cơ', waistCm: 'Eo', hipCm: 'Hông' };
              const latest = getLatestValue(k as string);
              return (
                <View key={k} style={styles.quickItem}>
                  <Text style={styles.quickLabel}>{labelMap[k]}</Text>
                  <Text style={styles.quickValue}>{latest}</Text>
                  {comp != null ? <Text style={[styles.quickDiff, { color: diffColor }]}>{Number(comp) > 0 ? `+${comp}` : `${comp}`}</Text> : null}
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

          {/* render chart when >=2 points; if exactly 1 point, show latest value card; otherwise show placeholder */}
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
          ) : Array.isArray(activeChart.values) && activeChart.values.length === 1 ? (
            // single measurement: show latest value and date prominently
            <View style={[styles.card, styles.singleCard]}> 
              <Text style={styles.singleTitle}>Giá trị mới nhất</Text>
              <Text style={styles.singleValue}>{String(activeChart.values[0])}</Text>
              {activeChart.raw && activeChart.raw[0] && (
                <Text style={styles.singleDate}>{new Date(activeChart.raw[0].date).toLocaleDateString('vi-VN')}</Text>
              )}
              <Text style={styles.singleHint}>Cần ít nhất 2 lần đo để hiển thị biểu đồ</Text>
            </View>
          ) : (
            <View style={styles.placeholderWrap}>
              <Text style={styles.placeholderText}>Không đủ dữ liệu để hiển thị biểu đồ</Text>
            </View>
          )}
        </View>

      </ScrollView>

      {/* Modal: ask for missing height/weight */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={modalStyles.backdrop}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={modalStyles.keyboardAvoiding}>
            <ScrollView style={modalStyles.modalScroll} contentContainerStyle={modalStyles.modalContentContainer} keyboardShouldPersistTaps="handled">
              <View style={modalStyles.modalContainer}>
                <Text style={modalStyles.modalTitle}>Nhập chiều cao và cân nặng</Text>
                {renderInputRow('Chiều cao', heightInput, setHeightInput, 'Chiều cao', 'cm')}
                {renderInputRow('Cân nặng', weightInput, setWeightInput, 'Cân nặng', 'kg')}
                {renderInputRow('BMI', bmiInput, setBmiInput, 'BMI', '')}
                {renderInputRow('Tỷ lệ mỡ', bodyFatInput, setBodyFatInput, 'Tỷ lệ mỡ (%)', '%')}
                {renderInputRow('Khối cơ', muscleInput, setMuscleInput, 'Khối cơ (kg)', 'kg')}
                {renderInputRow('Ngực', bustInput, setBustInput, 'Ngực', 'cm')}
                {renderInputRow('Eo', waistInput, setWaistInput, 'Eo', 'cm')}
                {renderInputRow('Hông', hipInput, setHipInput, 'Hông', 'cm')}
                {renderInputRow('Bắp tay', bicepInput, setBicepInput, 'Bắp tay', 'cm')}
                {renderInputRow('Đùi', thighInput, setThighInput, 'Đùi', 'cm')}
                {renderInputRow('Bắp chân', calfInput, setCalfInput, 'Bắp chân', 'cm')}
                {/* hide source input from UI when manual; keep internal sourceInput as 'Manual' */}
                <View style={modalStyles.modalActions}>
                  <TouchableOpacity onPress={() => setModalVisible(false)} style={modalStyles.cancelBtn}>
                    <Text style={modalStyles.cancelText}>Hủy</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleSubmitModal} style={modalStyles.submitBtn}>
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
  safe: { flex: 1, backgroundColor: '#FFFAF0' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff' },
  headerBtn: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  actionRow: { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#fff', flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  dropdownWrap: { position: 'relative', flex: 1, alignItems: 'flex-start' },
  menuBox: { position: 'absolute', top: 46, right: 4, minWidth: 180, backgroundColor: '#fff', borderRadius: 12, paddingVertical: 6, paddingHorizontal: 6, borderWidth: 1, borderColor: '#eee', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 12, zIndex: 999 },
  menuItem: { paddingVertical: 10, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  menuItemLast: { borderBottomWidth: 0 },
  menuItemText: { color: '#111827', fontSize: 15 },
  menuItemRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  viewProfilesBtnTop: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb' },
  actionTextYellow: { color: '#FBBF24', fontWeight: '600' },
  menuItemIcon: { marginRight: 8 },
  actionBtn: { flex: 1, paddingVertical: 10, marginHorizontal: 6, borderRadius: 8, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center' },
  actionBtnPrimary: { backgroundColor: '#A0522D', borderColor: '#A0522D', padding: 10 },
  actionText: { color: '#374151', fontWeight: '600' },
  actionTextPrimary: { color: '#fff', fontWeight: '700' },
  container: { padding: 16 },
  card: { backgroundColor: '#fff', padding: 14, borderRadius: 12, marginBottom: 12 },
  cardTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  viewProfilesBtn: { paddingVertical: 6, paddingHorizontal: 10, backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#eee' },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  quickItem: { width: '48%', padding: 10, borderRadius: 10, backgroundColor: '#fdf6ec', marginBottom: 8 },
  quickLabel: { fontSize: 12, color: '#6b7280' },
  quickValue: { fontSize: 16, fontWeight: '700' },
  quickDiff: { fontSize: 12, fontWeight: '500', marginLeft: 4 },
  tabRow: { flexDirection: 'row', flexWrap: 'wrap' },
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
  // position bubbles using percentages to better align with centered body image
  silSmallTopLeft: { position: 'absolute', left: '12%', top: '20%' },
  silSmallMidLeft: { position: 'absolute', left: '12%', top: '35%' },
  silSmallTopRight: { position: 'absolute', right: '12%', top: '20%' },
  silSmallMidRight: { position: 'absolute', right: '12%', top: '40%' },
  silSmallBottom: { position: 'absolute', left: '50%', bottom: '6%', transform: [{ translateX: -50 }] },
  bubbleCardSmall: { backgroundColor: '#f3f4f6', borderRadius: 12, paddingVertical: 8, paddingHorizontal: 10, marginBottom: 6, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', minWidth: 72 },
  bubbleLabel: { fontSize: 13, color: '#6b7280', marginRight: 6 },
  bubbleValueSmall: { fontSize: 15, fontWeight: '800' },
  singleCard: { alignItems: 'center' },
  singleTitle: { fontSize: 14, color: '#6b7280', marginBottom: 6 },
  singleValue: { fontSize: 28, fontWeight: '800', color: '#1f2937' },
  singleDate: { marginTop: 6, color: '#6b7280' },
  singleHint: { marginTop: 8, color: '#9CA3AF' },
});

const modalStyles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'flex-start', paddingTop: 84, paddingHorizontal: 12 },
  sheet: { width: '92%', backgroundColor: '#fff', borderRadius: 16, padding: 20 },
  title: { fontSize: 18, fontWeight: '800', marginBottom: 14 },
  input: { borderWidth: 1, borderColor: '#e5e7eb', padding: 14, borderRadius: 10, marginBottom: 10, backgroundColor: '#fff' },
  inputRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 10, backgroundColor: '#fff' },
  inputFlex: { flex: 1, paddingVertical: 8, paddingHorizontal: 6, fontSize: 18 },
  unitText: { marginLeft: 8, color: '#6b7280', fontSize: 15, minWidth: 36, textAlign: 'right' },
  inputLabel: { marginBottom: 6, color: '#111827', fontSize: 14, fontWeight: '700' },
  modalContainer: { backgroundColor: '#fff', padding: 20, borderRadius: 20, width: Math.min(width * 0.9, 520), alignSelf: 'center', marginTop: 18, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 8 },
  modalScroll: { maxHeight: '78%' },
  modalContentContainer: { paddingBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: '800', marginBottom: 12, textAlign: 'center' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12 },
  cancelBtn: { paddingHorizontal: 14, paddingVertical: 10, backgroundColor: '#f3f4f6', borderRadius: 10, marginRight: 10 },
  cancelText: { color: '#111827', fontWeight: '600' },
  submitBtn: { paddingHorizontal: 18, paddingVertical: 12, backgroundColor: '#A0522D', borderRadius: 10 },
  submitText: { color: '#fff', fontWeight: '700' },
  keyboardAvoiding: { flex: 1 },
});
