import React from 'react';
import { View, Text, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import Ionicons from '@react-native-vector-icons/ionicons';
import { colors } from '../../../theme/colors';

const { width } = Dimensions.get('window');

type Props = {
  data?: number[];
};

const HeartRateChart = ({ data = [56, 64, 76, 78, 70, 60] }: Props) => {
  const MIN_Y = 50;
  const Y_LABELS = [50, 70, 90, 110, 130, 150];
  let yIndex = 0;
  const scaledData = data.map(v => v - MIN_Y);
  return (
    <View className="m-4  bg-white rounded-xl border border-foreground overflow-hidden">
      {/* Header */}
      <View className="flex-row items-center gap-2 m-4">
        <Ionicons name="fitness" size={26} color={colors.danger.DEFAULT} />
        <Text className="text-lg font-semibold text-foreground">Nhịp tim</Text>
      </View>

      <LineChart
        data={{
          labels: [],
          datasets: [{ data: scaledData }],
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
        withShadow
        bezier
        fromZero
        renderDotContent={({ x, y, index }) => (
          <View
            key={index}
            style={{
              position: 'absolute',
              left: x - 8,
              top: y - 8,
              width: 16,
              height: 16,
              borderRadius: 10,
              backgroundColor: colors.danger.darker,
              opacity: 0.25,
            }}
          />
        )}
        chartConfig={{
          backgroundGradientFrom: '#FFF',
          backgroundGradientTo: '#FFF',
          decimalPlaces: 0,
          color: () => colors.danger.DEFAULT,
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
