import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

type MappedProfile = {
  raw?: Record<string, any>;
  display?: Record<string, any>;
};

type CompareItem = {
  key: string;
  label: string;
  unit?: string;
  goodWhen?: 'up' | 'down' | 'neutral';
};

type Props = {
  before?: MappedProfile | null;
  after?: MappedProfile | null;
};

const compareItems: CompareItem[] = [
  {
    key: 'weightKg',
    label: 'Cân nặng',
    unit: 'kg',
    goodWhen: 'neutral',
  },
  {
    key: 'bmi',
    label: 'BMI',
    unit: '',
    goodWhen: 'neutral',
  },
  {
    key: 'bodyFatPercentage',
    label: 'Mỡ cơ thể',
    unit: '%',
    goodWhen: 'down',
  },
  {
    key: 'muscleMassKg',
    label: 'Khối cơ',
    unit: 'kg',
    goodWhen: 'up',
  },
  {
    key: 'waistCm',
    label: 'Eo',
    unit: 'cm',
    goodWhen: 'down',
  },
  {
    key: 'hipCm',
    label: 'Hông',
    unit: 'cm',
    goodWhen: 'neutral',
  },
  {
    key: 'bustCm',
    label: 'Ngực',
    unit: 'cm',
    goodWhen: 'neutral',
  },
  {
    key: 'bicepCm',
    label: 'Bắp tay',
    unit: 'cm',
    goodWhen: 'up',
  },
  {
    key: 'thighCm',
    label: 'Đùi',
    unit: 'cm',
    goodWhen: 'up',
  },
  {
    key: 'calfCm',
    label: 'Bắp chân',
    unit: 'cm',
    goodWhen: 'up',
  },
];

function toNumber(value: any): number | null {
  if (value === null || value === undefined || value === '') return null;

  const n = Number(value);

  if (Number.isNaN(n)) return null;

  return n;
}

function round1(value: number) {
  return Math.round(value * 10) / 10;
}

function getRawValue(profile: MappedProfile | null | undefined, key: string) {
  return toNumber(profile?.raw?.[key]);
}

function formatValue(value: number | null, unit?: string) {
  if (value === null || value === undefined) return '-';

  const rounded = round1(value);

  return unit ? `${rounded}${unit}` : `${rounded}`;
}

function formatDiff(diff: number | null, unit?: string) {
  if (diff === null || diff === undefined) return '-';

  const rounded = round1(diff);

  if (rounded > 0) {
    return `+${rounded}${unit ?? ''}`;
  }

  return `${rounded}${unit ?? ''}`;
}

function getDiffColor(diff: number | null, goodWhen?: CompareItem['goodWhen']) {
  if (diff === null || diff === 0 || goodWhen === 'neutral') {
    return '#6B6B6B';
  }

  if (goodWhen === 'down') {
    return diff < 0 ? '#16A34A' : '#DC2626';
  }

  if (goodWhen === 'up') {
    return diff > 0 ? '#16A34A' : '#DC2626';
  }

  return '#6B6B6B';
}

export default function RoadmapBeforeAfterCard({ before, after }: Props) {
  const rows = compareItems.map((item) => {
    const beforeValue = getRawValue(before, item.key);
    const afterValue = getRawValue(after, item.key);

    const diff =
      beforeValue !== null && afterValue !== null
        ? afterValue - beforeValue
        : null;

    return {
      ...item,
      beforeValue,
      afterValue,
      diff,
    };
  });

  const hasAnyData = rows.some(
    (row) => row.beforeValue !== null || row.afterValue !== null,
  );

  if (!hasAnyData) {
    return null;
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Kết quả trước / sau</Text>
          <Text style={styles.subtitle}>
            So sánh hồ sơ ban đầu và hồ sơ sau khi hoàn thành lộ trình
          </Text>
        </View>
      </View>

      <View style={styles.legendRow}>
        <Text style={[styles.legendText, styles.legendLeft]}>Trước</Text>
        <Text style={styles.legendText}>Sau</Text>
        <Text style={[styles.legendText, styles.legendRight]}>Thay đổi</Text>
      </View>

      <View style={styles.rowsWrap}>
        {rows.map((row) => {
          const empty = row.beforeValue === null && row.afterValue === null;

          return (
            <View
              key={row.key}
              style={[styles.row, empty ? styles.rowMuted : null]}
            >
              <View style={styles.metricNameBox}>
                <Text style={styles.metricLabel}>{row.label}</Text>
              </View>

              <View style={styles.valueBox}>
                <Text style={styles.beforeValue}>
                  {formatValue(row.beforeValue, row.unit)}
                </Text>
              </View>

              <Text style={styles.arrow}>→</Text>

              <View style={styles.valueBox}>
                <Text style={styles.afterValue}>
                  {formatValue(row.afterValue, row.unit)}
                </Text>
              </View>

              <View style={styles.diffBox}>
                <Text
                  style={[
                    styles.diffText,
                    {
                      color: getDiffColor(row.diff, row.goodWhen),
                    },
                  ]}
                >
                  {formatDiff(row.diff, row.unit)}
                </Text>
              </View>
            </View>
          );
        })}
      </View>

        </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EFE3D4',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  header: {
    marginBottom: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#3A2A1A',
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    color: '#7A6A58',
    lineHeight: 18,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFAF0',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  legendText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: '#8B4513',
    textAlign: 'center',
  },
  legendLeft: {
    marginLeft: 72,
  },
  legendRight: {
    textAlign: 'right',
  },
  rowsWrap: {
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDF6EC',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  rowMuted: {
    opacity: 0.35,
  },
  metricNameBox: {
    width: 74,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#3A2A1A',
  },
  valueBox: {
    flex: 1,
    alignItems: 'center',
  },
  beforeValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6B6B6B',
  },
  afterValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#111827',
  },
  arrow: {
    fontSize: 13,
    color: '#9CA3AF',
    marginHorizontal: 4,
  },
  diffBox: {
    width: 64,
    alignItems: 'flex-end',
  },
  diffText: {
    fontSize: 13,
    fontWeight: '800',
  },
  note: {
    marginTop: 12,
    fontSize: 12,
    color: '#8B8B8B',
    lineHeight: 17,
  },
});