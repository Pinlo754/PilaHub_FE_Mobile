import { useEffect, useState } from 'react';
import { SummaryTab } from '../../constants/summaryTab';

export const useAISummary = () => {
  // CONSTANT
  const PASS = 60;

  // STATE
  const [activeTab, setActiveTab] = useState<SummaryTab>(SummaryTab.Point);
  const [isVideoVisible, setIsVideoVisible] = useState<boolean>(false);
  const [isVideoExpand, setIsVideoExpand] = useState<boolean>(false);
  const [isVideoPlay, setIsVideoPlay] = useState<boolean>(false);
  const [showVideoError, setShowVideoError] = useState<{
    visible: boolean;
    source?: string;
  }>({
    visible: false,
  });

  // LIST VIEW STATE
  const [viewMode, setViewMode] = useState<'overview' | 'list' | 'detail'>('overview');
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [aiSessionsList, setAiSessionsList] = useState<any[]>([]);

  // CHECK
  const isPointTab = activeTab === SummaryTab.Point;
  const isPass = 70 > PASS;

  // HANDLERS
  const toggleVideoExpand = () => {
    setIsVideoExpand(prev => !prev);
  };

  const openErrorVideo = (source: string) => {
    setShowVideoError({ visible: true, source });
  };

  const closeErrorVideo = () => {
    setShowVideoError({ visible: false });
  };

  const togglePlayButton = () => {
    setIsVideoPlay(prev => !prev);
  };

  const viewSessionDetail = (session: any) => {
    setSelectedSession(session);
    setViewMode('detail');
  };

  const backToList = () => {
    setSelectedSession(null);
    setViewMode('list');
  };

  const backToOverview = () => {
    setSelectedSession(null);
    setViewMode('overview');
  };

  // USE EFFECT
  useEffect(() => {
    if (showVideoError.visible) {
      setIsVideoPlay(false);
    }
  }, [showVideoError.visible]);

  return {
    activeTab,
    onChangeTab: setActiveTab,
    isPass,
    isPointTab,
    isVideoVisible,
    setIsVideoVisible,
    isVideoExpand,
    isVideoPlay,
    toggleVideoExpand,
    showVideoError,
    setShowVideoError,
    openErrorVideo,
    closeErrorVideo,
    togglePlayButton,
    // List view state
    viewMode,
    setViewMode,
    selectedSession,
    setSelectedSession,
    aiSessionsList,
    setAiSessionsList,
    viewSessionDetail,
    backToList,
    backToOverview,
  };
};
