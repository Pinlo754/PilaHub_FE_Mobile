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
import AISessionListView from './components/AISessionListView';
import { useState, useEffect } from 'react';

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
    viewMode,
    setViewMode,
    selectedSession,
    setSelectedSession,
    aiSessionsList,
    setAiSessionsList,
    viewSessionDetail,
    backToList,
    backToOverview,
  } = useAISummary();

  // receive params from navigation
  const {
    videoUrl,
    mistakeLog,
    feedback,
    heartRateLogs,
    aiSessionsList: listFromParams,
    showListView,
  } = route.params as any || {};

  const [seekTime, setSeekTime] = useState<number | null>(null);

  // Initialize sessions list when component mounts
  useEffect(() => {
    if (listFromParams && Array.isArray(listFromParams)) {
      setAiSessionsList(listFromParams);
      if (showListView) {
        setViewMode('list');
      }
    }
  }, [listFromParams, showListView, setAiSessionsList, setViewMode]);

  // Use selected session data if available, otherwise use route params
  const currentFeedback = selectedSession?.feedback || feedback;
  const currentVideoUrl = selectedSession?.recordUrl || videoUrl;
  const currentMistakeLog = selectedSession?.mistakeLog || mistakeLog;
  const currentHeartRateLogs = selectedSession?.heartRateLogs || heartRateLogs;

  // prepare numeric array for chart
  const heartRateData: number[] =
    currentHeartRateLogs && currentHeartRateLogs.length > 0
      ? [...currentHeartRateLogs]
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

  const handleSelectSession = (session: any) => {
    // Set selected session data for overview mode
    setSelectedSession(session);
    // Switch to overview mode but with selected session data
    setViewMode('overview');
  };

  // RENDER LIST VIEW
  if (viewMode === 'list' && aiSessionsList.length > 0) {
    return (
      <View className="flex-1 bg-background">
        <StatusBar hidden={false} />

        {/* Header */}
        <Header navigation={navigation} />

        <AISessionListView
          sessions={aiSessionsList}
          onSelectSession={handleSelectSession}
        />
      </View>
    );
  }

  // RENDER OVERVIEW VIEW (DEFAULT)
  return (
    <View className="flex-1 bg-background ">
      <StatusBar hidden={showVideoError.visible || isVideoExpand} />

      {!isVideoExpand && !showVideoError.visible && (
        <>
          {/* Header */}
          <Header
            navigation={navigation}
            showBackToList={!!selectedSession}
            onBackToList={() => setViewMode('list')}
            title={selectedSession ? selectedSession.exerciseName : 'Tổng kết'}
          />
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
            <PointSection point={currentFeedback?.overallScore || 0} isPass={isPass} />

            {/* Stats Section */}
            <StatsSection feedback={currentFeedback} />

            {/* Heart Rate Chart */}
            <HeartRateChart
              heartRateData={
                heartRateData.length ? heartRateData : [56, 100, 90, 78, 70, 60]
              }
            />

            {/* Metrics Section */}
            <MetricsSection
              formScore={currentFeedback?.formScore || 0}
              enduranceScore={currentFeedback?.enduranceScore || 0}
            />

            {/* Advice Section */}
            <AdviceSection
              strengths={currentFeedback?.strengths}
              weaknesses={currentFeedback?.weaknesses}
              recommendations={currentFeedback?.recommendations}
            />
          </>
        ) : (
          <>
            {/* Image / Video Record */}
            {isVideoVisible ? (
              <VideoPlayer
                key="main-video"
                source={currentVideoUrl ?? ''}
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
                errors={currentMistakeLog}
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
