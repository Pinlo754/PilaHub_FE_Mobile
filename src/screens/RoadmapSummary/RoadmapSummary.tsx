import React from 'react';
import { ScrollView, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import Header from './components/Header';
import InfoSection from './components/InfoSection';
import StatsSection from './components/StatsSection';
import MetricsSection from './components/MetricsSection';
import HeartRateChart from './components/HeartRateChart';

type Props = NativeStackScreenProps<RootStackParamList, 'RoadmapSummary'>;

const RoadmapSummary: React.FC<Props> = ({ navigation }) => {
  return (
    <View className="flex-1 bg-background-sub1 pt-14">
      {/* Header */}
      <Header navigation={navigation} />

      <View className="bg-background rounded-t-3xl overflow-hidden pb-10">
        <ScrollView
          contentContainerStyle={{ paddingBottom: 10 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Info Section */}
          <InfoSection
            percent={30}
            dayCompleted={5}
            weight_1={48}
            weight_2={45}
          />

          {/* Stats Section */}
          <StatsSection />

          {/* Heart Rate Chart */}
          <HeartRateChart />

          {/* Metrics Section */}
          <MetricsSection />
        </ScrollView>
      </View>
    </View>
  );
};

export default RoadmapSummary;
