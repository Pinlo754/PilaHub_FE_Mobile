import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

type DeltaMetric = {
  baseline?: number;
  final?: number;
  percent?: number;
};

type Recommendation = {
  recommendation?: string;
  rationale?: string;
};

type RoadmapReview = {
  roadmapReviewId?: string;
  roadmapId?: string;
  overallScore?: number;
  subScores?: Record<string, number>;
  deltaMetrics?: Record<string, DeltaMetric>;
  narrativeSummary?: string;
  prioritizedRecommendations?: Recommendation[];
  confidenceLevel?: number;
  createdAt?: string;
};

type Props = {
  review?: RoadmapReview | null;
};

const METRIC_LABELS: Record<string, string> = {
  weightKg: 'Cân nặng',
  weight: 'Cân nặng',
  bmi: 'BMI',
  bodyFatPercentage: 'Mỡ cơ thể',
  bodyFatPercent: 'Mỡ cơ thể',
  muscleMassKg: 'Khối cơ',
  muscleMass: 'Khối cơ',
  waistCm: 'Vòng eo',
  waist: 'Vòng eo',
  hipCm: 'Vòng hông',
  hip: 'Vòng hông',
  bustCm: 'Vòng ngực',
  bust: 'Vòng ngực',
  bicepCm: 'Bắp tay',
  bicep: 'Bắp tay',
  thighCm: 'Đùi',
  thigh: 'Đùi',
  calfCm: 'Bắp chân',
  calf: 'Bắp chân',
};

const METRIC_UNITS: Record<string, string> = {
  weightKg: 'kg',
  weight: 'kg',
  bmi: '',
  bodyFatPercentage: '%',
  bodyFatPercent: '%',
  muscleMassKg: 'kg',
  muscleMass: 'kg',
  waistCm: 'cm',
  waist: 'cm',
  hipCm: 'cm',
  hip: 'cm',
  bustCm: 'cm',
  bust: 'cm',
  bicepCm: 'cm',
  bicep: 'cm',
  thighCm: 'cm',
  thigh: 'cm',
  calfCm: 'cm',
  calf: 'cm',
};

const GOOD_WHEN_DOWN = new Set([
  'bodyFatPercentage',
  'bodyFatPercent',
  'waistCm',
  'waist',
]);

const GOOD_WHEN_UP = new Set([
  'muscleMassKg',
  'muscleMass',
  'bicepCm',
  'bicep',
  'thighCm',
  'thigh',
  'calfCm',
  'calf',
]);

function toNumber(value: any): number | null {
  if (value === null || value === undefined || value === '') return null;

  const n = Number(value);
  if (Number.isNaN(n)) return null;

  return n;
}

function round1(value: number) {
  return Math.round(value * 10) / 10;
}

function getLabel(key: string) {
  return METRIC_LABELS[key] ?? key;
}

function getUnit(key: string) {
  return METRIC_UNITS[key] ?? '';
}

function formatValue(value: any, unit: string) {
  const n = toNumber(value);

  if (n === null) return '-';

  return `${round1(n)}${unit}`;
}

function formatPercent(value: any) {
  const n = toNumber(value);

  if (n === null) return '-';

  if (n > 0) return `+${round1(n)}%`;

  return `${round1(n)}%`;
}

function getPercentColor(key: string, percent: any) {
  const n = toNumber(percent);

  if (n === null || n === 0) return '#6B7280';

  if (GOOD_WHEN_DOWN.has(key)) {
    return n < 0 ? '#16A34A' : '#DC2626';
  }

  if (GOOD_WHEN_UP.has(key)) {
    return n > 0 ? '#16A34A' : '#DC2626';
  }

  return '#6B7280';
}

function getTopDelta(deltaMetrics: Record<string, DeltaMetric>) {
  const entries = Object.entries(deltaMetrics);

  if (!entries.length) return [];

  return entries
    .map(([key, value]) => ({
      key,
      percent: toNumber(value?.percent),
    }))
    .filter((item) => item.percent !== null)
    .sort((a, b) => Math.abs(b.percent ?? 0) - Math.abs(a.percent ?? 0))
    .slice(0, 3);
}

export default function RoadmapBeforeAfterCard({ review }: Props) {
  if (!review) return null;

  const deltaMetrics = review.deltaMetrics ?? {};
  const rows = Object.entries(deltaMetrics);
  const topDelta = getTopDelta(deltaMetrics);

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.scoreCircle}>
          <Text style={styles.scoreText}>
            {review.overallScore ?? '-'}
          </Text>
          <Text style={styles.scoreSubText}>điểm</Text>
        </View>

        <View style={styles.headerTextWrap}>
          <Text style={styles.title}>Đánh giá sau lộ trình</Text>
          <Text style={styles.subtitle}>
            Tổng hợp thay đổi trước / sau dựa trên số đo ban đầu và số đo cuối.
          </Text>
        </View>
      </View>

      {review.narrativeSummary ? (
        <View style={styles.summaryBox}>
          <Text style={styles.summaryTitle}>Tóm tắt</Text>
          <Text style={styles.summaryText}>{review.narrativeSummary}</Text>
        </View>
      ) : null}

      {topDelta.length > 0 ? (
        <View style={styles.highlightRow}>
          {topDelta.map((item) => (
            <View key={item.key} style={styles.highlightBox}>
              <Text style={styles.highlightLabel} numberOfLines={1}>
                {getLabel(item.key)}
              </Text>
              <Text
                style={[
                  styles.highlightValue,
                  {
                    color: getPercentColor(item.key, item.percent),
                  },
                ]}
              >
                {formatPercent(item.percent)}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      <View style={styles.tableHeader}>
        <Text style={[styles.tableHeaderText, styles.metricCol]}>Chỉ số</Text>
        <Text style={styles.tableHeaderText}>Trước</Text>
        <Text style={styles.tableHeaderText}>Sau</Text>
        <Text style={[styles.tableHeaderText, styles.percentCol]}>
          Thay đổi
        </Text>
      </View>

      {rows.length > 0 ? (
        rows.map(([key, metric]) => {
          const unit = getUnit(key);

          return (
            <View key={key} style={styles.row}>
              <Text style={[styles.metricLabel, styles.metricCol]} numberOfLines={1}>
                {getLabel(key)}
              </Text>

              <Text style={styles.valueText}>
                {formatValue(metric?.baseline, unit)}
              </Text>

              <Text style={styles.valueText}>
                {formatValue(metric?.final, unit)}
              </Text>

              <Text
                style={[
                  styles.percentText,
                  styles.percentCol,
                  {
                    color: getPercentColor(key, metric?.percent),
                  },
                ]}
              >
                {formatPercent(metric?.percent)}
              </Text>
            </View>
          );
        })
      ) : (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>
            Chưa có dữ liệu thay đổi chi tiết.
          </Text>
        </View>
      )}

      {review.prioritizedRecommendations?.length ? (
        <View style={styles.recommendBox}>
          <Text style={styles.recommendTitle}>Gợi ý ưu tiên</Text>

          {review.prioritizedRecommendations.map((item, index) => (
            <View key={`${item.recommendation ?? index}`} style={styles.recommendItem}>
              <Text style={styles.recommendIndex}>{index + 1}</Text>

              <View style={styles.recommendContent}>
                <Text style={styles.recommendText}>
                  {item.recommendation ?? 'Khuyến nghị'}
                </Text>

                {item.rationale ? (
                  <Text style={styles.rationaleText}>{item.rationale}</Text>
                ) : null}
              </View>
            </View>
          ))}
        </View>
      ) : null}

      <View style={styles.footerRow}>
        <Text style={styles.footerText}>
          Độ tin cậy: {review.confidenceLevel ?? '-'}%
        </Text>

        {review.createdAt ? (
          <Text style={styles.footerText}>
            {new Date(review.createdAt).toLocaleDateString('vi-VN')}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EFE3D4',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#F3EDE3',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    borderWidth: 1,
    borderColor: '#E4D3C2',
  },
  scoreText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#8B4513',
  },
  scoreSubText: {
    fontSize: 11,
    color: '#7A6A58',
    fontWeight: '700',
  },
  headerTextWrap: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    color: '#3A2A1A',
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    color: '#7A6A58',
    lineHeight: 18,
  },
  summaryBox: {
    marginTop: 14,
    padding: 13,
    borderRadius: 16,
    backgroundColor: '#FFFAF0',
    borderWidth: 1,
    borderColor: '#EFE3D4',
  },
  summaryTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#8B4513',
    marginBottom: 5,
  },
  summaryText: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 19,
  },
  highlightRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  highlightBox: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EEF2F7',
  },
  highlightLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '800',
  },
  highlightValue: {
    marginTop: 4,
    fontSize: 17,
    fontWeight: '900',
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: '#F3EDE3',
    marginTop: 14,
    marginBottom: 8,
  },
  tableHeaderText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '900',
    color: '#8B4513',
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: '#FDF6EC',
    marginBottom: 8,
  },
  metricCol: {
    flex: 1.25,
    textAlign: 'left',
  },
  percentCol: {
    flex: 1.05,
    textAlign: 'right',
  },
  metricLabel: {
    fontSize: 13,
    fontWeight: '900',
    color: '#3A2A1A',
  },
  valueText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    textAlign: 'center',
  },
  percentText: {
    fontSize: 13,
    fontWeight: '900',
  },
  emptyBox: {
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
  },
  emptyText: {
    color: '#6B7280',
    fontSize: 13,
    textAlign: 'center',
  },
  recommendBox: {
    marginTop: 12,
    padding: 13,
    borderRadius: 16,
    backgroundColor: '#F8FBF8',
    borderWidth: 1,
    borderColor: '#E5F2E5',
  },
  recommendTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#166534',
    marginBottom: 8,
  },
  recommendItem: {
    flexDirection: 'row',
    marginTop: 8,
  },
  recommendIndex: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#DCFCE7',
    color: '#166534',
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '900',
    marginRight: 8,
  },
  recommendContent: {
    flex: 1,
  },
  recommendText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#14532D',
  },
  rationaleText: {
    marginTop: 3,
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 17,
  },
  footerRow: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: {
    fontSize: 12,
    color: '#8B8B8B',
    fontWeight: '700',
  },
});