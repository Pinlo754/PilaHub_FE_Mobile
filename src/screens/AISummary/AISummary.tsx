import { ScrollView, StatusBar, View } from 'react-native';
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

type Props = NativeStackScreenProps<RootStackParamList, 'AISummary'>;

const AISummary = (props: Props) => {
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
    openErrorVideo,
    closeErrorVideo,
    isVideoPlay,
    togglePlayButton,
  } = useAISummary();

  return (
    <View className="flex-1 bg-background ">
      <StatusBar hidden={showVideoError.visible || isVideoExpand} />

      {!isVideoExpand && !showVideoError.visible && (
        <>
          {/* Header */}
          <Header navigation={props.navigation} />
          {/* Tabs */}
          <Tabs tabId={activeTab} onChange={onChangeTab} />
        </>
      )}

      <ScrollView
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!isVideoExpand && !showVideoError.visible}
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
            {/* Image / Video Record */}
            {isVideoVisible ? (
              <VideoPlayer
                key="main-video"
                source="https://www.w3schools.com/html/mov_bbb.mp4"
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
            {!isVideoExpand && <ErrorSection openErrorVideo={openErrorVideo} />}
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
