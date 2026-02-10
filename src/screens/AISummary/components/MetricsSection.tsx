import { View } from 'react-native';
import RowMetric from './RowMetric';

const MetricsSection = () => {
  return (
    <View className="m-4 px-4 pb-6 bg-white border border-background-sub1/30 rounded-xl shadow-md elevation-md">
      <RowMetric label="Tư thế" progress={90} />
      <RowMetric label="Hơi thở" progress={70} />
      <RowMetric label="Linh hoạt" progress={50} />
    </View>
  );
};

export default MetricsSection;
