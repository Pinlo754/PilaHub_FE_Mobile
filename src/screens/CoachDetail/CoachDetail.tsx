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
  const { coachDetail, coachFeedbacks, scrollY, onPressBtn, sendRequestRoadmap } = useCoachDetail({
    route,
    navigation,
  });

  // CALC
  const dynamicPaddingBottom = coachFeedbacks.length > 0 ? 320 : 0;

  // LOADING
  if (!coachDetail) return null;

  return (
    <View className="w-full flex-1  bg-background">
      {/* Header */}
      <Header
        navigation={navigation}
        scrollY={scrollY}
        coachId={coachDetail.coachId}
      />

      <Animated.ScrollView
        contentContainerStyle={{ paddingBottom: dynamicPaddingBottom }}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true },
        )}
        scrollEventThrottle={16}
      >
        {/* Image */}
        <ImageCoach
          avatarUrl={coachDetail?. avatarUrl}
          coachName={coachDetail?.fullName}
        />

        {/* Stats Card */}
        <StatsCard
          rate={coachDetail?.avgRating || 5}
          experienceYears={coachDetail?.yearsOfExperience}
        />

        {/* Overview Section */}
        <OverviewSection
          coachDetail={coachDetail}
          coachFeedbacks={coachFeedbacks}
        />
        <OverviewSection
          coachDetail={coachDetail}
          coachFeedbacks={coachFeedbacks}
        />
      </Animated.ScrollView>

      <View className="pt-2 px-4 pb-6 flex-row justify-center gap-4">
        <Button
          text="Đăng ký lịch"
          onPress={onPressBtn}
          colorType="sub1"
          rounded="full"
          iconName="today-outline"
          iconSize={26}
        />
        <Button
          text="Đăng ký Roadmap"
          onPress={sendRequestRoadmap}
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
