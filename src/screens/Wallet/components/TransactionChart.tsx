import React, { useMemo } from "react";
import { View, Text } from "react-native";
import Svg, { Circle } from "react-native-svg";

type Tx = {
  transactionType: string;
  amount: number;
};

const colors = [
  "#4F78C4",
  "#F97316",
  "#A3A3A3",
  "#FACC15",
  "#22C55E",
  "#8B5CF6",
];

export default function TransactionChart({
  transactions,
  typeLabels,
}: {
  transactions: Tx[];
  typeLabels?: Record<string, string>;
}) {

  const { totalIncome, totalExpense, byType } = useMemo(() => {
    let income = 0;
    let expense = 0;
    const map: Record<string, number> = {};

    transactions.forEach((t) => {
      const amt = Number(t.amount || 0);

      if (t.transactionType === "WALLET_TOP_UP") {
        income += amt;
      } else {
        expense += amt;
      }

      map[t.transactionType] = (map[t.transactionType] || 0) + amt;
    });

    const entries = Object.keys(map).map((k) => ({
      type: k,
      amount: map[k],
    }));

    entries.sort((a, b) => b.amount - a.amount);

    return {
      totalIncome: income,
      totalExpense: expense,
      byType: entries,
    };
  }, [transactions]);

  const pieData = byType.slice(0, 5).map((e, i) => ({
    name: typeLabels?.[e.type] ?? e.type,
    amount: e.amount,
    color: colors[i % colors.length],
  }));

  const total = totalIncome + totalExpense;

  const pieDataWithPercent = pieData.map((p) => ({
    ...p,
    percent: total > 0 ? (p.amount / total) * 100 : 0,
  }));

  /* ===============================
     DONUT CHART CALCULATION
  =============================== */

  const size = 170;
  const strokeWidth = 22;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let offsetAccumulator = 0;

  return (
    <View className="bg-white rounded-xl p-4 shadow mb-3">
      <Text className="text-sm text-gray-500">Tổng quan thu - chi</Text>

      <View className="flex-row items-center mt-4">

        {/* LEFT INFO */}
        <View className="flex-1 pr-4">
          <Text className="text-xs text-gray-400">Tổng thu</Text>
          <Text className="text-lg font-bold text-green-600 mt-1">
            {totalIncome.toLocaleString("vi-VN")}₫
          </Text>

          <Text className="text-xs text-gray-400 mt-4">Tổng chi</Text>
          <Text className="text-lg font-bold text-red-500 mt-1">
            {totalExpense.toLocaleString("vi-VN")}₫
          </Text>

          <Text className="text-xs text-gray-400 mt-4">
            Tổng: {total.toLocaleString("vi-VN")}₫
          </Text>
        </View>

        {/* DONUT CHART */}
        <View className="items-center justify-center">
          <Svg width={size} height={size}>

            {/* background circle */}
            <Circle
              stroke="#E5E7EB"
              fill="none"
              cx={size / 2}
              cy={size / 2}
              r={radius}
              strokeWidth={strokeWidth}
            />

            {pieDataWithPercent.map((slice, index) => {

              const percent = slice.percent;
              const dash = (percent / 100) * circumference;
              const gap = circumference - dash;

              const circle = (
                <Circle
                  key={index}
                  stroke={slice.color}
                  fill="none"
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${dash} ${gap}`}
                  strokeDashoffset={-offsetAccumulator}
                  strokeLinecap="butt"
                  rotation="-90"
                  origin={`${size / 2}, ${size / 2}`}
                />
              );

              offsetAccumulator += dash;

              return circle;
            })}
          </Svg>

          {/* CENTER TEXT */}
          <View className="absolute items-center">
            <Text className="text-gray-400 text-xs">Chi</Text>
            <Text className="text-red-500 font-bold text-base">
              {totalExpense.toLocaleString("vi-VN")}₫
            </Text>
          </View>
        </View>

      </View>

      {/* LEGEND */}
      <View className="flex-row flex-wrap mt-4">
        {pieDataWithPercent.map((p) => (
          <View key={p.name} className="flex-row items-center mr-4 mb-2">
            <View
              style={{ backgroundColor: p.color }}
              className="w-3 h-3 rounded-sm mr-2"
            />
            <Text className="text-xs text-gray-600">
              {p.name} • {p.percent.toFixed(1)}%
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
