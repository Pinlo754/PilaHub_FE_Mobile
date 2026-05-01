import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Dimensions,
  Image,
} from 'react-native';
import {
  fetchMyHealthProfileMetrics,
  fetchLatestHealthProfile,
  mapStoredHealthProfile,
} from '../../../services/profile';
import { LineChart } from 'react-native-chart-kit';
import Ionicons from '@react-native-vector-icons/ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useOnboardingStore } from '../../../store/onboarding.store';
import ModalPopup from '../../../components/ModalPopup';

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

  const setData = useOnboardingStore((s) => s.setData);
  const onboarding = useOnboardingStore((s) => s.data);

  // ModalPopup state to replace Alert.alert
  const [modalProps, setModalProps] = useState<any>({ visible: false });
  const showModal = (p: any) => setModalProps({ ...p, visible: true });
  const closeModal = () => setModalProps({ visible: false });

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
          console.log('DEBUG latest health profile error:', latestRes.error);
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
    return mapStoredHealthProfile(profile);
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

  function handleUpdateBodyMetrics() {
    try {
      const latest = latestMapped.raw;

      const update: any = {};

      /**
       * BodyGram bắt buộc cần:
       * age, gender, height, weight.
       *
       * Ưu tiên lấy từ latest metadata/input nếu có.
       * Nếu latest không có age/gender thì giữ lại từ onboarding store cũ.
       */
      if (latest.age != null) {
        update.age = latest.age;
      } else if (onboarding?.age != null) {
        update.age = onboarding.age;
      }

      if (latest.gender != null) {
        update.gender = latest.gender;
      } else if (onboarding?.gender != null) {
        update.gender = onboarding.gender;
      }

      if (latest.heightCm != null) {
        update.height = latest.heightCm;
        update.heightUnit = 'cm';
      } else if (onboarding?.height != null) {
        update.height = onboarding.height;
        update.heightUnit = onboarding.heightUnit ?? 'cm';
      }

      if (latest.weightKg != null) {
        update.weight = latest.weightKg;
        update.weightUnit = 'kg';
      } else if (onboarding?.weight != null) {
        update.weight = onboarding.weight;
        update.weightUnit = onboarding.weightUnit ?? 'kg';
      }

      if (latest.bmi != null) update.bmi = latest.bmi;

      if (latest.bodyFatPercentage != null) {
        update.bodyFatPercent = latest.bodyFatPercentage;
      }

      if (latest.muscleMassKg != null) {
        update.muscleMass = latest.muscleMassKg;
      }

      if (latest.bustCm != null) update.bust = latest.bustCm;
      if (latest.waistCm != null) update.waist = latest.waistCm;
      if (latest.hipCm != null) update.hip = latest.hipCm;
      if (latest.bicepCm != null) update.bicep = latest.bicepCm;
      if (latest.thighCm != null) update.thigh = latest.thighCm;
      if (latest.calfCm != null) update.calf = latest.calfCm;

      console.log('BodyMetricDetails -> InputBody update:', update);

      if (Object.keys(update).length > 0) {
        setData(update);
      }

      navigation.navigate('InputBody', {
  returnToAfterAssessment: 'BodyMetricDetails',
});
    } catch (e) {
      console.log('InputBody navigation error', e);
      showModal({ mode: 'noti', titleText: 'Lỗi', contentText: 'Không thể mở màn cập nhật số đo.' });
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
           onPress={() =>
              navigation.reset({
                index: 0,
                routes: [
                  {
                    name: 'MainTabs',
                    params: { screen: 'TraineeProfile' },
                  },
                ],
              })
            }
          style={styles.headerBtn}
        >
          <Ionicons name="arrow-back" size={22} color="#333" />
        </Pressable>

        <Text style={styles.headerTitle}>Lịch sử số đo</Text>

        <View style={styles.headerBtn} />
      </View>

      <View style={styles.actionRow}>
        <Pressable
          onPress={handleUpdateBodyMetrics}
          style={[styles.actionBtn, styles.actionBtnPrimary]}
        >
          <Text style={styles.actionTextPrimary}>Cập nhật số đo</Text>
        </Pressable>

        <Pressable
          onPress={() => navigation.navigate('HealthProfiles')}
          style={[styles.actionBtn, styles.viewProfilesBtnTop]}
        >
          <Text style={styles.actionTextPrimary}>Xem hồ sơ</Text>
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
      <ModalPopup {...(modalProps as any)} onClose={closeModal} />
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
  actionBtn: {
    flex: 1,
    paddingVertical: 10,
    marginHorizontal: 6,
    borderRadius: 8,
    backgroundColor: '#A0522D',
    borderWidth: 1,
    borderColor: '#A0522D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnPrimary: {
    backgroundColor: '#A0522D',
    borderColor: '#A0522D',
    padding: 10,
  },
  viewProfilesBtnTop: {
    backgroundColor: '#A0522D',
    borderWidth: 1,
    borderColor: '#A0522D',
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