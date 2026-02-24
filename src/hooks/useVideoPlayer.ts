import { useEffect, useRef, useState } from 'react';
import { VideoRef } from 'react-native-video';

type Props = {
  isVideoPlay?: boolean;
  setIsShowControls?: (v: boolean) => void;
};

export const useVideoPlayer = ({ isVideoPlay, setIsShowControls }: Props) => {
  // REF
  const videoRef = useRef<VideoRef>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // STATE
  const [paused, setPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // CHECK
  const isPlaying = isVideoPlay ?? !paused;

  // HANDLERS
  const clearHideTimer = () => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
  };

  const startHideTimer = () => {
    if (!isPlaying) return;
    clearHideTimer();
    hideTimer.current = setTimeout(() => setShowControls(false), 3000);
  };

  const onTouchPlayer = () => {
    if (showControls) {
      setShowControls(false);
      clearHideTimer();
    } else {
      setShowControls(true);
      if (isPlaying) {
        startHideTimer();
      }
    }
  };

  const togglePlay = () => {
    setPaused(p => !p);

    if (!isPlaying) {
      startHideTimer();
    } else {
      clearHideTimer();
    }
  };

  const seek = (time: number) => {
    videoRef.current?.seek(time);
    setCurrentTime(time);
    startHideTimer();
  };

  const seekBy = (sec: number) => {
    seek(Math.max(0, currentTime + sec));
  };

  const reset = () => {
    setPaused(true);
    setCurrentTime(0);
    setDuration(0);
  };

  // USE EFFECT
  useEffect(() => {
    if (!isPlaying) {
      setShowControls(true);
      clearHideTimer();
    }
  }, [isPlaying]);

  useEffect(() => {
    return () => {
      clearHideTimer();
    };
  }, []);

  useEffect(() => {
    if (!setIsShowControls) return;
    setIsShowControls(isPlaying && showControls);
  }, [isPlaying, showControls, setIsShowControls]);

  return {
    videoRef,
    paused,
    duration,
    currentTime,
    showControls,
    isFullscreen,
    setIsFullscreen,
    setDuration,
    setCurrentTime,
    onTouchPlayer,
    togglePlay,
    seek,
    seekBy,
    reset,
  };
};
