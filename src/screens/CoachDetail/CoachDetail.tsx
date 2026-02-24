import React from 'react';
import { Animated, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { useCoachDetail } from './useCoachDetail';
import ImageCoach from './components/ImageCoach';
import Header from './components/Header';
import Button from '../../components/Button';
import StatsCard from './components/StatsCard';
import OverviewSection from './components/OverviewSection';

type Props = NativeStackScreenProps<RootStackParamList, 'CoachDetail'>;

const CoachDetail: React.FC<Props> = ({ route, navigation }) => {
  // HOOK
  const { coachDetail, scrollY, onPressBtn } = useCoachDetail({
    route,
    navigation,
  });

  // LOADING
  if (!coachDetail) return null;

  return (
    <View className="w-full flex-1 relative bg-background">
      {/* Header */}
      <Header
        navigation={navigation}
        scrollY={scrollY}
        coachId={coachDetail.coach_id}
      />

      <Animated.ScrollView
        contentContainerStyle={{ paddingBottom: 320 }}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true },
        )}
        scrollEventThrottle={16}
      >
        {/* Image */}
        <ImageCoach
          imgUrl={coachDetail?.avatar}
          coachName={coachDetail?.full_name}
        />

        {/* Stats Card */}
        <StatsCard
          rate={coachDetail?.rating_avg}
          experienceYears={coachDetail?.experience_years}
        />

        {/* Overview Section */}
        <OverviewSection coachDetail={coachDetail} />
      </Animated.ScrollView>

      <View className="pt-2 px-4 pb-6">
        <Button
          text="Đăng ký lịch"
          onPress={onPressBtn}
          colorType="sub1"
          rounded="full"
          iconName="today-outline"
          iconSize={26}
        />
      </View>
    </View>
  );
};

export default CoachDetail;
