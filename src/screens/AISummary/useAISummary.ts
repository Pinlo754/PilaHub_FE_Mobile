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
  };
};
