import { Text, View } from 'react-native';
import CardMetric from './CardMetric';
import RowMetric from './RowMetric';

const MetricsSection = () => {
  return (
    <View className="m-4">
      {/* Cards */}
      <View className="flex-row flex-wrap justify-between gap-2">
        <CardMetric title="Ngực" value={84} diff={8} />
        <CardMetric title="Eo" value={68} diff={-3} />
        <CardMetric title="Hông" value={92} diff={8} />
        <CardMetric title="Bắp tay" value={26} diff={-3} />
        <CardMetric title="Đùi" value={54} diff={8} />
        <CardMetric title="Bắp chân" value={34} diff={-3} />
      </View>

      {/* Upper */}
      <Text className="mt-6 mb-3 text-lg font-bold text-foreground">
        Upper Body & Arms
      </Text>

      <RowMetric label="Cổ" value_1={32} value_2={0} />
      <RowMetric label="Đáy cổ" value_1={36} value_2={0} />
      <RowMetric label="Vai" value_1={38} value_2={39} />
      <RowMetric label="Cổ tay" value_1={16} value_2={0} />
      <RowMetric label="Chiều dài tay" value_1={58} value_2={0} />
      <RowMetric label="Vòng dưới ngực" value_1={78} value_2={75} />
      <RowMetric label="Chiều dài lưng" value_1={42} value_2={0} />

      {/* Lower */}
      <Text className="mt-4 mb-3 text-lg font-bold text-foreground">
        Lower Body & Legs
      </Text>

      <RowMetric label="Hông trên" value_1={32} value_2={0} />
      <RowMetric label="Đùi giữa" value_1={36} value_2={0} />
      <RowMetric label="Gối" value_1={38} value_2={39} />
      <RowMetric label="Chiều dài chân trong" value_1={16} value_2={0} />
      <RowMetric label="Chiều cao mắt cá ngoài" value_1={58} value_2={0} />
    </View>
  );
};

export default MetricsSection;
