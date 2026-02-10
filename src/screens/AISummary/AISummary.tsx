import { ScrollView, View } from 'react-native';
import Header from './components/Header';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { useAISummary } from './useAISummary';
import Tabs from './components/Tabs';
import PointSection from './components/PointSection';
import StatsSection from './components/StatsSection';
import HeartRateChart from './components/HeartRateChart';
import MetricsSection from './components/MetricsSection';
import AdviceSection from './components/AdviceSection';
import VideoRecord from './components/VideoRecord';
import ErrorSection from './components/ErrorSection';

type Props = NativeStackScreenProps<RootStackParamList, 'AISummary'>;

const AISummary = (props: Props) => {
  // HOOK
  const { activeTab, onChangeTab, isPass, isPointTab } = useAISummary();

  return (
    <View className="flex-1 bg-background pt-14">
      {/* Header */}
      <Header navigation={props.navigation} />

      {/* Tabs */}
      <Tabs tabId={activeTab} onChange={onChangeTab} />

      <ScrollView
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {isPointTab ? (
          <>
            {/* Point Section */}
            <PointSection point={70} isPass={isPass} />

            {/* Stats Section */}
            <StatsSection />

            {/* Heart Rate Chart */}
            <HeartRateChart heartRateData={[56, 100, 90, 78, 70, 60]} />

            {/* Metrics Section */}
            <MetricsSection />

            {/* Advice Section */}
            <AdviceSection />
          </>
        ) : (
          <>
            {/* Video Record */}
            <VideoRecord />

            {/* Error Section */}
            <ErrorSection />
          </>
        )}
      </ScrollView>
    </View>
  );
};

export default AISummary;
