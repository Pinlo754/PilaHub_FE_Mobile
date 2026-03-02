import React from 'react';
import { View, Text } from 'react-native';
import { Measurements } from '../types/measurement';


type Props = {
  data: Measurements;
};

export default function MeasurementPanel({ data }: Props) {
  return (
    <View className="mt-4 p-4 bg-white rounded-xl shadow-sm">
      <Text className="text-lg font-semibold mb-2">Số đo cơ thể (ước lượng)</Text>

      {data.shoulder != null && (
        <Text>Vai: {data.shoulder.toFixed(1)} cm</Text>
      )}
      {data.waist != null && (
        <Text>Eo: {data.waist.toFixed(1)} cm</Text>
      )}
      {data.hip != null && (
        <Text>Hông: {data.hip.toFixed(1)} cm</Text>
      )}
      {data.thigh != null && (
        <Text>Đùi: {data.thigh.toFixed(1)} cm</Text>
      )}
      {data.height_est != null && (
        <Text>Chiều cao (ước lượng): {data.height_est.toFixed(1)} cm</Text>
      )}
      {data.weight_est != null && (
        <Text>Cân nặng (ước lượng): {data.weight_est.toFixed(1)} kg</Text>
      )}

      <Text className="text-xs text-gray-500 mt-2">
        Các số đo chỉ mang tính tham khảo để bạn theo dõi cơ thể, không phải đánh giá ngoại hình.
      </Text>
    </View>
  );
}
