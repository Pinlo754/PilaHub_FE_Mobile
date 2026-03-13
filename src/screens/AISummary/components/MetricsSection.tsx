import { View } from 'react-native';
import RowMetric from './RowMetric';

type Props = {
  formScore?: number | null;
  enduranceScore?: number | null;
};

const MetricsSection = ({ formScore, enduranceScore }: Props) => {
  return (
    <View className="m-4 px-4 pb-6 bg-white border border-background-sub1/30 rounded-xl shadow-md elevation-md">
      <RowMetric label="Tư thế" progress={formScore ?? 0} />

      {enduranceScore !== null && enduranceScore !== undefined && (
        <RowMetric label="Sức bền" progress={enduranceScore} />
      )}
    </View>
  );
};

export default MetricsSection;