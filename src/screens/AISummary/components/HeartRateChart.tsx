import React from 'react';
import { View, Text, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import Ionicons from '@react-native-vector-icons/ionicons';
import { colors } from '../../../theme/colors';

const { width } = Dimensions.get('window');

type Props = {
  heartRateData: number[];
};

const HeartRateChart = ({ heartRateData }: Props) => {
  const Y_LABELS = [50, 70, 90, 110, 130, 150];
  let yIndex = 0;
  const MIN_Y = 50;
  const MAX_Y = 150;

  return (
    <View className="m-4 bg-white rounded-xl border border-foreground overflow-hidden shadow-md elevation-md">
      {/* Header */}
      <View className="flex-row items-center gap-2 m-4">
        <Ionicons name="fitness" size={26} color={colors.danger.DEFAULT} />
        <Text className="text-lg font-semibold text-foreground">Nhịp tim</Text>
      </View>

      <LineChart
        data={{
          labels: [],
          datasets: [
            {
              data: heartRateData,
            },
            {
              data: [MIN_Y, MIN_Y, MAX_Y, MAX_Y],
              strokeWidth: 0,
              withDots: false,
              color: () => 'rgba(0,0,0,0)',
            },
          ],
        }}
        width={width - 40}
        height={220}
        segments={5}
        formatYLabel={() => {
          const value = Y_LABELS[yIndex] ?? Y_LABELS[Y_LABELS.length - 1];
          yIndex += 1;
          return `${value}`;
        }}
        yLabelsOffset={20}
        yAxisSuffix=""
        withDots
        withInnerLines
        withOuterLines={false}
        withShadow={false}
        bezier
        fromZero={false}
        getDotProps={(dataPoint, index) => {
          // Ẩn dot của dataset thứ 2
          if (index >= heartRateData.length) {
            return {
              r: 0,
              fill: 'transparent',
              stroke: 'transparent',
            };
          }
          return {
            r: 4.5,
            strokeWidth: 2,
            stroke: '#fff',
            fill: colors.danger.DEFAULT,
          };
        }}
        renderDotContent={({ x, y, index }) => {
          // Chỉ render cho data.length điểm đầu tiên (dataset thực)
          if (index >= heartRateData.length) return null;

          return (
            <>
              {/* Dot shadow */}
              <View
                key={`shadow-${index}`}
                style={{
                  position: 'absolute',
                  left: x - 8,
                  top: y - 8,
                  width: 16,
                  height: 16,
                  borderRadius: 8,
                  backgroundColor: colors.danger.darker,
                  opacity: 0.25,
                }}
              />
            </>
          );
        }}
        chartConfig={{
          backgroundGradientFrom: '#FFF',
          backgroundGradientTo: '#FFF',
          decimalPlaces: 0,
          color: (_opacity = 1, index = 0) =>
            index === 0 ? colors.danger.DEFAULT : 'transparent',
          labelColor: () => colors.inactive.darker,
          propsForDots: {
            r: '4.5',
            strokeWidth: '2',
            stroke: '#fff',
          },
          fillShadowGradient: colors.danger.DEFAULT,
          fillShadowGradientOpacity: 0.25,
          propsForBackgroundLines: {
            strokeDasharray: '4 4',
            stroke: colors.inactive.lighter,
          },
        }}
        style={{
          borderRadius: 12,
          marginLeft: -13,
          marginBottom: -15,
        }}
      />
    </View>
  );
};

export default HeartRateChart;
