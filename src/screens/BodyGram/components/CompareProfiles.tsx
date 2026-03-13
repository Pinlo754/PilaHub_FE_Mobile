import React from 'react';
import { View, Text } from 'react-native';

type Measurements = { [k: string]: number | null | undefined } | null | undefined;

const METRICS: Array<{ key: string; label: string; unit?: string }> = [
  { key: 'weight_est', label: 'Cân nặng', unit: 'kg' },
  { key: 'height_est', label: 'Chiều cao', unit: 'cm' },
  { key: 'bust', label: 'Ngực', unit: 'cm' },
  { key: 'waist', label: 'Eo', unit: 'cm' },
  { key: 'hip', label: 'Hông', unit: 'cm' },
  { key: 'thigh', label: 'Đùi', unit: 'cm' },
  { key: 'bicep', label: 'Bắp tay', unit: 'cm' },
  { key: 'calf', label: 'Bắp chân', unit: 'cm' },
];

function formatVal(v: number | null | undefined, unit?: string) {
  if (v == null) return '-';
  return `${v}${unit ? ` ${unit}` : ''}`;
}

export default function CompareProfiles({ previous, current }: { previous?: Measurements; current?: Measurements }) {
  if (!previous || !current) {
    return (
      <View className="bg-white rounded-xl p-4 mb-4">
        <Text className="text-sm text-gray-500">Không có hồ sơ trước để so sánh.</Text>
      </View>
    );
  }

  return (
    <View className="bg-white rounded-xl p-4 mb-4">
      <Text className="text-base font-semibold mb-3">So sánh với hồ sơ trước</Text>
      {METRICS.map((m) => {
        const a = (previous as any)[m.key] as number | null | undefined;
        const b = (current as any)[m.key] as number | null | undefined;
        if (a == null && b == null) return null;
        const delta = (b ?? 0) - (a ?? 0);
        const pct = a ? ((delta / a) * 100) : null;
        const isIncrease = delta > 0;
        const isDecrease = delta < 0;
        const color = isIncrease ? 'text-green-600' : isDecrease ? 'text-red-600' : 'text-gray-600';

        return (
          <View key={m.key} className="flex-row items-center justify-between py-2 border-b border-gray-100">
            <View>
              <Text className="text-sm text-gray-700">{m.label}</Text>
              <Text className="text-xs text-gray-500">Trước: {formatVal(a, m.unit)} • Hiện tại: {formatVal(b, m.unit)}</Text>
            </View>
            <View className="items-end">
              <Text className={`text-lg font-semibold ${color}`}>{delta === 0 ? '0' : (delta > 0 ? `+${delta}` : `${delta}`)}{m.unit ? ` ${m.unit}` : ''}</Text>
              {pct != null ? <Text className="text-xs text-gray-500">{pct > 0 ? `+${pct.toFixed(1)}%` : `${pct.toFixed(1)}%`}</Text> : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}
