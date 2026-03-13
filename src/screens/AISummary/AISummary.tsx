import { ScrollView, StatusBar, View, StyleSheet } from 'react-native';
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
import ErrorSection from './components/ErrorSection';
import VideoPlayer from './components/VideoPlayer/VideoPlayer';
import ImageRecord from './components/ImageRecord';
import ErrorVideoPlayer from './components/VideoPlayer/ErrorVideoPlayer';
import { useState } from 'react';

type Props = NativeStackScreenProps<RootStackParamList, 'AISummary'>;

const AISummary = ({ route, navigation }: Props) => {
  // HOOK
  const {
    activeTab,
    onChangeTab,
    isPass,
    isPointTab,
    isVideoVisible,
    setIsVideoVisible,
    isVideoExpand,
    toggleVideoExpand,
    showVideoError,
    closeErrorVideo,
    isVideoPlay,
    togglePlayButton,
  } = useAISummary();
  // receive heartRateLogs from navigation params
  const { videoUrl, mistakeLog, feedback, heartRateLogs } = route.params;
  const [seekTime, setSeekTime] = useState<number | null>(null);

  // prepare numeric array for chart
  const heartRateData: number[] = (heartRateLogs && heartRateLogs.length > 0)
    ? [...heartRateLogs]
        .sort((a, b) => a.recordedAt - b.recordedAt)
        .map(h => h.heartRate || 0)
    : [];

  const handleSeekToError = (time: number) => {
    if (!isVideoVisible) {
      setIsVideoVisible(true);
    }
    console.log('play video atttt', time);
    // Luôn đảm bảo giá trị mới để trigger useEffect bên trong VideoPlayer
    setSeekTime(time);

    if (!isVideoPlay) {
      togglePlayButton();
    }
  };


  return (
    <View className="flex-1 bg-background ">
      <StatusBar hidden={showVideoError.visible || isVideoExpand} />

      {!isVideoExpand && !showVideoError.visible && (
        <>
          {/* Header */}
          <Header navigation={navigation} />
          {/* Tabs */}
          <Tabs tabId={activeTab} onChange={onChangeTab} />
        </>
      )}

      <ScrollView
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!isVideoExpand && !showVideoError.visible}
      >
        {isPointTab ? (
          <>
            {/* Point Section */}
            <PointSection point={feedback.overallScore} isPass={isPass} />

            {/* Stats Section */}
            <StatsSection feedback={feedback} />

            {/* Heart Rate Chart */}
            <HeartRateChart heartRateData={heartRateData.length ? heartRateData : [56, 100, 90, 78, 70, 60]} />

            {/* Metrics Section */}
            <MetricsSection
              formScore={feedback.formScore}
              enduranceScore={feedback.enduranceScore}
            />

            {/* Advice Section */}
            <AdviceSection
              strengths={feedback.strengths}
              weaknesses={feedback.weaknesses}
              recommendations={feedback.recommendations}
            />
          </>
        ) : (
          <>
            {/* Image / Video Record */}
            {isVideoVisible ? (
              <VideoPlayer
                key="main-video"
                source={videoUrl}
                seekTime={seekTime}
                isVideoPlay={isVideoPlay}
                isVideoExpand={isVideoExpand}
                toggleVideoExpand={toggleVideoExpand}
                togglePlayButton={togglePlayButton}
              />
            ) : (
              <ImageRecord
                img_url={
                  'https://cdn.mos.cms.futurecdn.net/RSRmmWZGBcNnLLynabFD2Z.jpg'
                }
                setIsVideoVisible={setIsVideoVisible}
                togglePlayButton={togglePlayButton}
              />
            )}

            {/* Error Section */}
            {!isVideoExpand && (
              <ErrorSection
                errors={mistakeLog}
                openErrorVideo={handleSeekToError}
              />
            )}
          </>
        )}
      </ScrollView>

      {/* Error Video */}
      {showVideoError.visible && (
        <View className="absolute inset-0 z-50 bg-black">
          <ErrorVideoPlayer
            key={showVideoError.source}
            source={showVideoError.source!}
            onBack={closeErrorVideo}
          />
        </View>
      )}
    </View>
  );
};

export default AISummary;

const styles = StyleSheet.create({
  contentContainer: { paddingBottom: 20 },
});
