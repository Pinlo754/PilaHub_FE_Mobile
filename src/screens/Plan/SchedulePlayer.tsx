import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  DeviceEventEmitter,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import api from '../../hooks/axiosInstance';
import { workoutSessionService } from '../../hooks/workoutSession.service';
import { markPersonalExerciseCompleted } from '../../services/personalExercise.service';
import { markPersonalScheduleCompleted } from '../../services/personalSchedule.service';
import Ionicons from '@react-native-vector-icons/ionicons';
import Toast from '../../components/Toast';
import VideoPlayer from './components/RoadmapVideo/VideoPlayer';
import { SafeAreaView } from 'react-native-safe-area-context';

const MemoRoadmapVideoPlayer = React.memo(function MemoRoadmapVideoPlayer({
  videoKey,
  source,
  isVideoPlay,
  isVideoExpand,
  toggleVideoExpand,
  onEnd,
}: any) {
  return (
    <VideoPlayer
      key={videoKey}
      source={source ?? undefined}
      isVideoPlay={isVideoPlay}
      isVideoExpand={isVideoExpand}
      toggleVideoExpand={toggleVideoExpand}
      isPracticeTab={true}
      setIsShowFlag={() => {}}
      hideControls={true}
      onEnd={onEnd}
      onLoad={() => {}}
      onProgress={() => {}}
      repeat={true}
    />
  );
});

export default function SchedulePlayer() {
  const route: any = useRoute();
  const navigation: any = useNavigation();

  const queue = useMemo(
    () => (Array.isArray(route.params?.queue) ? route.params.queue : []),
    [route.params?.queue],
  );

  const startIndex = Number(route.params?.startIndex ?? 0);
  const scheduleIdParam = route.params?.scheduleId ?? null;
  const singleMode = route.params?.singleMode === true || queue.length === 1;
  const aiFlow = route.params?.aiFlow === true;

  const [index, setIndex] = useState(startIndex);
  const [current, setCurrent] = useState<any>(queue[startIndex] ?? null);
  const aiLaunchIndexRef = useRef<number | null>(null);

  const [phase, setPhase] = useState<
    'idle' | 'exercise' | 'rest' | 'completed'
  >('idle');
  const [currentSet, setCurrentSet] = useState<number>(1);
  const [phaseDuration, setPhaseDuration] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);

  const [isVideoExpand, setIsVideoExpand] = useState<boolean>(false);
  const [isVideoPlay, setIsVideoPlay] = useState<boolean>(false);

  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>(
    'info',
  );

  const markedRef = useRef<Set<string>>(new Set());
  const intervalRef = useRef<any>(null);
  const processingPhaseRef = useRef(false);
  const goBackTimeoutRef = useRef<any>(null);

  /**
   * Khi bấm "Tới 5s cuối", ref này sẽ báo cho handlePhaseFinished biết:
   * Hết 5s thì hoàn thành bài luôn, không đi qua rest/set tiếp theo nữa.
   */
  const jumpToFinishRef = useRef(false);

  const exercise = current?.ex ?? current?.exercise ?? null;

  const progressFraction = useMemo(() => {
    if (phaseDuration <= 0) return 0;

    return Math.max(
      0,
      Math.min(1, (phaseDuration - timeLeft) / phaseDuration),
    );
  }, [phaseDuration, timeLeft]);

  const elapsedTime = useMemo(() => {
    if (phaseDuration <= 0) return 0;
    return Math.max(0, phaseDuration - timeLeft);
  }, [phaseDuration, timeLeft]);

  const showToastMessage = useCallback(
    (message: string, type: 'success' | 'error' | 'info' = 'info') => {
      setToastMessage(message);
      setToastType(type);
      setToastVisible(true);
    },
    [],
  );

  const resetToast = useCallback(() => {
    setToastVisible(false);
    setToastMessage('');
    setToastType('info');
  }, []);

  const clearGoBackTimeout = useCallback(() => {
    if (goBackTimeoutRef.current) {
      clearTimeout(goBackTimeoutRef.current);
      goBackTimeoutRef.current = null;
    }
  }, []);

  const safeGoBack = useCallback(
    (delayMs: number = 300) => {
      clearGoBackTimeout();

      goBackTimeoutRef.current = setTimeout(() => {
        if (navigation.canGoBack()) {
          navigation.goBack();
        }

        goBackTimeoutRef.current = null;
      }, delayMs);
    },
    [clearGoBackTimeout, navigation],
  );

  const getExerciseInfo = useCallback((item: any) => {
    const ex = item?.ex ?? item?.exercise ?? null;

    const sets = Math.max(1, Number(ex?.sets ?? ex?.totalSets ?? 1) || 1);

    const durationSeconds = Math.max(
      0,
      Number(item?.durationSeconds ?? ex?.durationSeconds ?? ex?.duration ?? 0) ||
        0,
    );

    const restSeconds = Math.max(
      0,
      Number(item?.restSeconds ?? ex?.restSeconds ?? ex?.rest ?? 0) || 0,
    );

    return {
      ex,
      sets,
      durationSeconds,
      restSeconds,
    };
  }, []);

  const getPersonalId = useCallback((item: any) => {
    return (
      item?.ex?.personalExerciseId ??
      item?.ex?.id ??
      item?.ex?.exerciseId ??
      item?.exercise?.personalExerciseId ??
      item?.exercise?.id ??
      item?.exercise?.exerciseId ??
      null
    );
  }, []);

  const stopTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const initializeExercise = useCallback(
    (item: any) => {
      if (!item) return;

      const info = getExerciseInfo(item);

      jumpToFinishRef.current = false;

      setCurrentSet(1);
      setPhase('exercise');
      setPhaseDuration(info.durationSeconds);
      setTimeLeft(info.durationSeconds);
      setIsRunning(true);
      setIsVideoPlay(Boolean(item?.videoSrc));

      processingPhaseRef.current = false;
    },
    [getExerciseInfo],
  );

  const goTo = useCallback(
    (idx: number) => {
      const clamped = Math.max(0, Math.min(queue.length - 1, idx));
      const nextItem = queue[clamped] ?? null;

      stopTimer();
      resetToast();
      clearGoBackTimeout();

      jumpToFinishRef.current = false;

      setIndex(clamped);
      setCurrent(nextItem);
      setPhase('idle');
      setCurrentSet(1);
      setPhaseDuration(0);
      setTimeLeft(0);
      setIsRunning(false);
      setIsVideoPlay(false);

      setTimeout(() => {
        if (nextItem) {
          initializeExercise(nextItem);
        }
      }, 0);
    },
    [queue, stopTimer, initializeExercise, resetToast, clearGoBackTimeout],
  );

  const markAndEmitExercise = useCallback(
    async (personalId: string | null) => {
      if (!personalId) return;

      const id = String(personalId);

      if (markedRef.current.has(id)) {
        return;
      }

      markedRef.current.add(id);

      try {
        await markPersonalExerciseCompleted(id);
      } catch (err) {
        console.warn(
          '[SchedulePlayer] markPersonalExerciseCompleted failed',
          id,
          err,
        );

        showToastMessage('Không thể cập nhật trạng thái bài tập', 'error');
      }

      try {
        DeviceEventEmitter.emit('exerciseCompleted', {
          personalExerciseId: id,
        });
      } catch {
        // ignore
      }
    },
    [showToastMessage],
  );

  const reconcileServerAfterScheduleComplete = useCallback(
    async (scheduleId: string) => {
      try {
        const res = await api.get(`/personal-exercises/schedule/${scheduleId}`);
        const serverExercises = Array.isArray(res?.data?.data)
          ? res.data.data
          : [];

        const doneSet = new Set(
          serverExercises
            .filter((e: any) => e.completed === true)
            .map((e: any) =>
              String(e.personalExerciseId ?? e.id ?? e.exerciseId),
            ),
        );

        const queueIds = queue
          .map((it: any) => getPersonalId(it))
          .filter(Boolean)
          .map((id: any) => String(id));

        const toMark = queueIds.filter((id: string) => !doneSet.has(id));

        if (toMark.length) {
          await Promise.allSettled(
            toMark.map((id: string) => markPersonalExerciseCompleted(id)),
          );
        }

        const res2 = await api.get(`/personal-exercises/schedule/${scheduleId}`);
        const serverAfter = Array.isArray(res2?.data?.data)
          ? res2.data.data
          : [];

        serverAfter.forEach((se: any) => {
          const pid = se.personalExerciseId ?? se.id ?? se.exerciseId ?? null;

          if (pid && se.completed === true) {
            try {
              DeviceEventEmitter.emit('exerciseCompleted', {
                personalExerciseId: String(pid),
              });
            } catch {
              // ignore
            }
          }
        });

        const allDoneServer =
          serverAfter.length > 0 &&
          serverAfter.every((e: any) => e.completed === true);

        if (allDoneServer) {
          try {
            DeviceEventEmitter.emit('scheduleCompleted', { scheduleId });
          } catch {
            // ignore
          }
        }
      } catch (err) {
        console.warn('[SchedulePlayer] reconcile failed', err);
      }
    },
    [queue, getPersonalId],
  );

  const completeSchedule = useCallback(async () => {
    const scheduleId = scheduleIdParam ?? null;

    if (!scheduleId) {
      showToastMessage('Đã hoàn thành tất cả bài trong lịch', 'success');
      safeGoBack(300);
      return;
    }

    try {
      await markPersonalScheduleCompleted(scheduleId);

      try {
        DeviceEventEmitter.emit('scheduleCompleted', { scheduleId });
      } catch {
        // ignore
      }

      showToastMessage('Hoàn thành lịch tập', 'success');

      await reconcileServerAfterScheduleComplete(scheduleId);
    } catch (err) {
      console.warn('[SchedulePlayer] markPersonalScheduleCompleted failed', err);

      showToastMessage('Không thể cập nhật lịch tập', 'error');
      return;
    }

    showToastMessage('Đã hoàn thành tất cả bài trong lịch', 'success');
    safeGoBack(300);
  }, [
    scheduleIdParam,
    reconcileServerAfterScheduleComplete,
    showToastMessage,
    safeGoBack,
  ]);

  const completeCurrentExerciseAndMaybeAdvance = useCallback(async () => {
    if (!current) return;

    stopTimer();

    jumpToFinishRef.current = false;

    setIsRunning(false);
    setIsVideoPlay(false);

    const personalId = getPersonalId(current);
    const next = index + 1;
    const hasNextExercise = !singleMode && next < queue.length;

    if (personalId) {
      if (!hasNextExercise) {
        showToastMessage('Đã hoàn thành động tác', 'success');
      }

      await markAndEmitExercise(String(personalId));
    }

    if (singleMode) {
      setPhase('completed');

      showToastMessage('Đã hoàn thành bài tập', 'success');
      safeGoBack(300);

      return;
    }

    if (next < queue.length) {
      goTo(next);
      return;
    }

    setPhase('completed');
    await completeSchedule();
  }, [
    current,
    index,
    queue.length,
    singleMode,
    stopTimer,
    getPersonalId,
    markAndEmitExercise,
    goTo,
    completeSchedule,
    showToastMessage,
    safeGoBack,
  ]);

  const launchAiSession = useCallback(
    async (item: any, itemIndex: number) => {
      if (!item || !aiFlow || !item?.isAiSupported) return;
      if (aiLaunchIndexRef.current === itemIndex) return;

      const exercise = item.ex ?? null;

      const exerciseId =
        exercise?.exerciseId ??
        exercise?.id ??
        exercise?.exercise_id ??
        exercise?.exerciseIdRaw ??
        null;

      if (!exerciseId) {
        showToastMessage('Không xác định được ID bài tập AI', 'error');
        return;
      }

      aiLaunchIndexRef.current = itemIndex;

      try {
        const session = await workoutSessionService.startFreeWorkout({
          exerciseId: String(exerciseId),
          haveAITracking: true,
          haveIOTDeviceTracking: true,
        });

        if (!session?.workoutSessionId) {
          throw new Error('Không tạo được phiên AI');
        }

        const nameAITracking =
          exercise?.nameInModelAI ?? exercise?.name_in_model_ai ?? '';

        const timeout = Math.max(
          5,
          Number(
            item.durationSeconds ??
              item?.ex?.durationSeconds ??
              item?.ex?.duration ??
              0,
          ) || 5,
        );

        navigation.navigate('AIPracticeTimeout', {
          exercise_id: String(exerciseId),
          imgUrl: exercise?.imageUrl ?? exercise?.image ?? '',
          videoUrl: item.videoSrc ?? '',
          workoutSessionId: session.workoutSessionId,
          nameAITracking,
          timeout,
          autoStart: true,
          skipSummary: true,
          scheduleFlowIndex: itemIndex,
          scheduleFlowPersonalExerciseId: String(getPersonalId(item) ?? ''),
        });
      } catch (error) {
        console.warn('[SchedulePlayer] start AI session failed', error);

        showToastMessage('Không thể bắt đầu bài AI. Vui lòng thử lại', 'error');

        aiLaunchIndexRef.current = null;
      }
    },
    [aiFlow, getPersonalId, navigation, showToastMessage],
  );

  const handleAiSetCompleted = useCallback(
    async (evt: any) => {
      if (!evt || evt.scheduleFlowIndex !== index) return;
      if (!current) return;

      const info = getExerciseInfo(current);

      if (currentSet < info.sets) {
        if (info.restSeconds > 0) {
          setPhase('rest');
          setPhaseDuration(info.restSeconds);
          setTimeLeft(info.restSeconds);
          setIsRunning(true);
          setIsVideoPlay(false);
        } else {
          DeviceEventEmitter.emit('resumeAiSession', {
            scheduleFlowIndex: index,
          });
        }
      } else {
        setIsRunning(false);

        DeviceEventEmitter.emit('endAiSession', {
          scheduleFlowIndex: index,
        });
      }
    },
    [current, getExerciseInfo, index, currentSet],
  );

  const handleAiFlowCompletion = useCallback(
    async (evt: any) => {
      if (!evt || evt.scheduleFlowIndex !== index) return;
      if (!current) return;

      aiLaunchIndexRef.current = null;
      await completeCurrentExerciseAndMaybeAdvance();
    },
    [current, index, completeCurrentExerciseAndMaybeAdvance],
  );

  const handlePhaseFinished = useCallback(async () => {
    if (!current) return;
    if (processingPhaseRef.current) return;

    processingPhaseRef.current = true;

    const info = getExerciseInfo(current);

    if (phase === 'exercise') {
      /**
       * Case đặc biệt:
       * User bấm "Tới 5s cuối" => app nhảy tới set cuối.
       * Khi timeLeft về 0 thì hoàn thành bài luôn.
       * Không chạy rest, không chạy các set còn lại.
       */
      if (jumpToFinishRef.current && currentSet >= info.sets) {
        jumpToFinishRef.current = false;

        await completeCurrentExerciseAndMaybeAdvance();

        processingPhaseRef.current = false;
        return;
      }

      if (info.restSeconds > 0) {
        setPhase('rest');
        setPhaseDuration(info.restSeconds);
        setTimeLeft(info.restSeconds);
        setIsRunning(true);
        setIsVideoPlay(false);
        processingPhaseRef.current = false;
        return;
      }

      if (currentSet < info.sets) {
        const nextSet = currentSet + 1;

        setCurrentSet(nextSet);
        setPhase('exercise');
        setPhaseDuration(info.durationSeconds);
        setTimeLeft(info.durationSeconds);
        setIsRunning(true);
        setIsVideoPlay(Boolean(current?.videoSrc));

        processingPhaseRef.current = false;
        return;
      }

      await completeCurrentExerciseAndMaybeAdvance();
      processingPhaseRef.current = false;
      return;
    }

    if (phase === 'rest') {
      if (currentSet < info.sets) {
        const nextSet = currentSet + 1;

        setCurrentSet(nextSet);

        if (aiFlow && current?.isAiSupported) {
          DeviceEventEmitter.emit('resumeAiSession', {
            scheduleFlowIndex: index,
          });
        } else {
          setPhase('exercise');
          setPhaseDuration(info.durationSeconds);
          setTimeLeft(info.durationSeconds);
          setIsRunning(true);
          setIsVideoPlay(Boolean(current?.videoSrc));
        }

        processingPhaseRef.current = false;
        return;
      }

      await completeCurrentExerciseAndMaybeAdvance();
      processingPhaseRef.current = false;
      return;
    }

    processingPhaseRef.current = false;
  }, [
    current,
    phase,
    currentSet,
    getExerciseInfo,
    completeCurrentExerciseAndMaybeAdvance,
    aiFlow,
    index,
  ]);

  useEffect(() => {
    const item = queue[index] ?? null;

    setCurrent(item);

    stopTimer();
    resetToast();
    clearGoBackTimeout();

    jumpToFinishRef.current = false;

    setPhase('idle');
    setCurrentSet(1);
    setPhaseDuration(0);
    setTimeLeft(0);
    setIsRunning(false);
    setIsVideoPlay(false);

    if (item) {
      if (aiFlow && item.isAiSupported) {
        setTimeout(() => {
          launchAiSession(item, index);
        }, 0);
      } else {
        initializeExercise(item);
      }
    }
  }, [
    index,
    queue,
    initializeExercise,
    launchAiSession,
    stopTimer,
    aiFlow,
    resetToast,
    clearGoBackTimeout,
  ]);

  useEffect(() => {
    const setSub = DeviceEventEmitter.addListener(
      'aiSetCompleted',
      handleAiSetCompleted,
    );

    const endSub = DeviceEventEmitter.addListener(
      'scheduleFlowAIExerciseCompleted',
      handleAiFlowCompletion,
    );

    return () => {
      setSub.remove();
      endSub.remove();
    };
  }, [handleAiSetCompleted, handleAiFlowCompletion]);

  useEffect(() => {
    stopTimer();

    if (!isRunning || phase === 'idle' || phase === 'completed' || !current) {
      return;
    }

    intervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        const next = Math.max(0, Number(prev ?? 0) - 1);
        return next;
      });
    }, 1000);

    return () => {
      stopTimer();
    };
  }, [isRunning, phase, current, stopTimer]);

  useEffect(() => {
    if (!current) return;
    if (phase === 'idle' || phase === 'completed') return;
    if (timeLeft > 0) return;

    handlePhaseFinished();
  }, [timeLeft, phase, current, handlePhaseFinished]);

  useEffect(() => {
    return () => {
      stopTimer();
      clearGoBackTimeout();
    };
  }, [stopTimer, clearGoBackTimeout]);

  const handleBack = () => {
    stopTimer();
    resetToast();
    clearGoBackTimeout();

    jumpToFinishRef.current = false;

    setIsRunning(false);
    setIsVideoPlay(false);

    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  const handleTogglePlay = () => {
    setIsRunning(prev => {
      const next = !prev;

      if (phase === 'exercise') {
        setIsVideoPlay(next && Boolean(current?.videoSrc));
      } else {
        setIsVideoPlay(false);
      }

      return next;
    });
  };

  const handleToggleVideoExpand = useCallback(() => {
    setIsVideoExpand(v => !v);
  }, []);

  const handleVideoOnEndFallback = useCallback(async () => {
    const info = getExerciseInfo(current);

    if (info.durationSeconds > 0) {
      return;
    }

    setTimeLeft(0);
  }, [current, getExerciseInfo]);

  const handleSeekBy = useCallback(
    (deltaSeconds: number) => {
      if (!current) return;
      if (phase === 'idle' || phase === 'completed') return;
      if (phaseDuration <= 0) return;

      setTimeLeft(prev => {
        const safePrev = Number(prev ?? 0);
        const currentElapsed = Math.max(0, phaseDuration - safePrev);

        const nextElapsed = Math.max(
          0,
          Math.min(phaseDuration, currentElapsed + deltaSeconds),
        );

        const nextLeft = Math.max(0, phaseDuration - nextElapsed);

        return nextLeft;
      });
    },
    [current, phase, phaseDuration],
  );

  /**
   * Bấm 1 phát:
   * - Bỏ qua tất cả set còn lại
   * - Nhảy tới set cuối
   * - Còn 5 giây
   * - Hết 5 giây thì hoàn thành bài luôn
   */
  const handleJumpToLast5Seconds = useCallback(() => {
    if (!current) return;
    if (phase === 'idle' || phase === 'completed') return;

    const info = getExerciseInfo(current);

    const lastSet = Math.max(1, Number(info.sets ?? 1) || 1);
    const finalDuration = Math.max(1, Number(info.durationSeconds ?? 0) || 1);

    jumpToFinishRef.current = true;

    setCurrentSet(lastSet);
    setPhase('exercise');
    setPhaseDuration(finalDuration);
    setTimeLeft(finalDuration <= 5 ? 1 : 5);
    setIsRunning(true);
    setIsVideoPlay(Boolean(current?.videoSrc));
  }, [current, phase, getExerciseInfo]);

  if (!current) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack}>
            <Ionicons name="chevron-back" size={28} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.center}>
          <Text style={styles.emptyText}>Không có bài nào để phát</Text>
        </View>
      </SafeAreaView>
    );
  }

  const info = getExerciseInfo(current);
  const exerciseName = exercise?.exerciseName ?? exercise?.name ?? 'Động tác';
  const totalSets = info.sets;
  const restSeconds = info.restSeconds;
  const displayIndex = index + 1;
  const totalExercises = queue.length;

  const videoKey =
    current?.ex?.personalExerciseId ?? current?.ex?.exerciseId ?? index;

  const shouldPlayVideo = isRunning && phase === 'exercise' && isVideoPlay;

  const isSeekDisabled =
    phase === 'idle' || phase === 'completed' || phaseDuration <= 0;

  return (
    <SafeAreaView style={styles.container}>
      <Toast
        visible={toastVisible}
        message={toastMessage}
        type={toastType}
        onHidden={() => setToastVisible(false)}
      />

      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack}>
          <Ionicons name="chevron-back" size={28} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.title} numberOfLines={1}>
          {route.params?.title ?? 'Lịch tập'}
        </Text>

        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.videoWrap}>
        <MemoRoadmapVideoPlayer
          videoKey={videoKey}
          source={current.videoSrc}
          isVideoPlay={shouldPlayVideo}
          isVideoExpand={isVideoExpand}
          toggleVideoExpand={handleToggleVideoExpand}
          personalExerciseId={current.ex?.personalExerciseId}
          personalScheduleId={route.params?.scheduleId}
          onEnd={handleVideoOnEndFallback}
        />
      </View>

      <View style={styles.bottomCardWrap} pointerEvents="box-none">
        <View style={styles.bottomCard}>
          <View style={styles.rowTop}>
            <TouchableOpacity
              style={[styles.prevBtn, index <= 0 && styles.disabledControl]}
              disabled={index <= 0}
              onPress={() => {
                if (index > 0) {
                  goTo(index - 1);
                }
              }}
            >
              <Ionicons name="caret-back" size={20} color="#3A2A1A" />
              <Text style={styles.prevNextText}>Động tác trước</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.nextBtn,
                (index >= queue.length - 1 || singleMode) &&
                  styles.disabledControl,
              ]}
              disabled={index >= queue.length - 1 || singleMode}
              onPress={() => {
                if (!singleMode && index < queue.length - 1) {
                  goTo(index + 1);
                }
              }}
            >
              <Text style={styles.prevNextText}>Động tác sau</Text>
              <Ionicons name="caret-forward" size={20} color="#3A2A1A" />
            </TouchableOpacity>
          </View>

          <View style={styles.exerciseInfo}>
            <Text style={styles.exerciseName} numberOfLines={1}>
              {exerciseName}
            </Text>

            <Text style={styles.exerciseMeta}>
              Bài {displayIndex}/{totalExercises}
              {' • '}
              Set {currentSet}/{totalSets}
            </Text>
          </View>

          <View style={styles.phaseBox}>
            <Text style={styles.phaseText}>
              {phase === 'rest'
                ? 'Nghỉ giữa set'
                : phase === 'completed'
                  ? 'Hoàn thành'
                  : 'Đang tập'}
            </Text>

            <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>

            <Text style={styles.restText}>
              {phase === 'rest'
                ? currentSet < totalSets
                  ? 'Chuẩn bị set tiếp theo'
                  : 'Nghỉ cuối trước khi chuyển bài'
                : restSeconds > 0
                  ? `Nghỉ ${restSeconds}s sau mỗi set`
                  : 'Không có thời gian nghỉ'}
            </Text>
          </View>

          <View style={styles.progressRowAlt}>
            <View style={styles.leftSideControl}>
              <TouchableOpacity
                onPress={() => handleSeekBy(-5)}
                style={[
                  styles.seekButton,
                  isSeekDisabled && styles.disabledControl,
                ]}
                disabled={isSeekDisabled}
              >
                <Ionicons name="play-back-outline" size={24} color="#8B4513" />
                <Text style={styles.seekButtonText}>5s</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.playCenter}>
              <TouchableOpacity
                onPress={handleTogglePlay}
                style={[styles.playButton, isRunning ? styles.playing : {}]}
              >
                <Ionicons
                  name={isRunning ? 'pause' : 'play'}
                  size={28}
                  color="#8B4513"
                />
              </TouchableOpacity>
            </View>

            <View style={styles.rightSideControl}>
              <TouchableOpacity
                onPress={() => handleSeekBy(5)}
                style={[
                  styles.seekButton,
                  isSeekDisabled && styles.disabledControl,
                ]}
                disabled={isSeekDisabled}
              >
                <Text style={styles.seekButtonText}>5s</Text>
                <Ionicons
                  name="play-forward-outline"
                  size={24}
                  color="#8B4513"
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.jumpRow}>
            <TouchableOpacity
              onPress={handleJumpToLast5Seconds}
              disabled={isSeekDisabled}
              style={[
                styles.jumpLastButton,
                isSeekDisabled && styles.disabledControl,
              ]}
            >
              <Ionicons name="play-skip-forward" size={20} color="#FFFFFF" />
              <Text style={styles.jumpLastButtonText}>Tới 5s cuối</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.timeRow}>
            <Text style={styles.timeText}>{formatTime(elapsedTime)}</Text>

            <View style={styles.timeBarBg}>
              <View style={[styles.timeBarFill, { flex: progressFraction }]} />

              <View
                style={[
                  styles.timeBarEmpty,
                  {
                    flex: Math.max(0, 1 - progressFraction),
                  },
                ]}
              />
            </View>

            <Text style={styles.timeTextLeft}>-{formatTime(timeLeft)}</Text>
          </View>

          <View style={styles.controlsRow}>
            <TouchableOpacity
              onPress={() => handleSeekBy(-5)}
              disabled={isSeekDisabled}
              style={[
                styles.iconControl,
                isSeekDisabled && styles.disabledControl,
              ]}
            >
              <Ionicons name="play-back-outline" size={24} color="#3A2A1A" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleSeekBy(5)}
              disabled={isSeekDisabled}
              style={[
                styles.iconControl,
                isSeekDisabled && styles.disabledControl,
              ]}
            >
              <Ionicons name="play-forward-outline" size={24} color="#3A2A1A" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: '#fff' },

  header: {
    height: 56,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    zIndex: 20,
    paddingTop: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: { width: 40 },

  videoWrap: {
    height: '50%',
    backgroundColor: '#000',
  },

  bottomCardWrap: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  bottomCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingVertical: 16,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: -4 },
    shadowRadius: 12,
    elevation: 8,
  },

  rowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  prevBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  prevNextText: {
    color: '#3A2A1A',
    fontSize: 14,
    marginHorizontal: 6,
  },
  disabledControl: {
    opacity: 0.35,
  },

  exerciseInfo: {
    marginTop: 4,
    marginBottom: 10,
    alignItems: 'center',
  },
  exerciseName: {
    color: '#3A2A1A',
    fontSize: 18,
    fontWeight: '800',
  },
  exerciseMeta: {
    color: '#6B7280',
    fontSize: 13,
    marginTop: 2,
  },

  phaseBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  phaseText: {
    color: '#8B4513',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  timerText: {
    color: '#3A2A1A',
    fontSize: 44,
    fontWeight: '900',
  },
  restText: {
    color: '#6B7280',
    fontSize: 13,
    marginTop: 2,
  },

  progressRowAlt: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },

  leftSideControl: {
    width: 72,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  rightSideControl: {
    width: 72,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  seekButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  seekButtonText: {
    color: '#8B4513',
    fontSize: 14,
    fontWeight: '700',
    marginHorizontal: 4,
  },

  playButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#F3EDE3',
  },
  playing: {
    backgroundColor: '#FBEAD8',
  },
  playCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  jumpRow: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    marginBottom: 6,
  },
  jumpLastButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8B4513',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 999,
    minWidth: 150,
  },
  jumpLastButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    marginLeft: 6,
  },

  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  timeText: {
    color: '#3A2A1A',
    width: 52,
    fontSize: 16,
    fontWeight: '600',
  },
  timeTextLeft: {
    color: '#3A2A1A',
    width: 58,
    textAlign: 'right',
    fontSize: 16,
    fontWeight: '600',
  },
  timeBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: '#EEE',
    borderRadius: 999,
    marginHorizontal: 8,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  timeBarFill: {
    height: 6,
    backgroundColor: '#8B4513',
  },
  timeBarEmpty: {
    height: 6,
    backgroundColor: 'transparent',
  },

  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  iconControl: {
    padding: 8,
  },
});

function formatTime(s: number) {
  const sec = Math.max(0, Math.floor(s || 0));
  const mm = Math.floor(sec / 60)
    .toString()
    .padStart(2, '0');
  const ss = (sec % 60).toString().padStart(2, '0');

  return `${mm}:${ss}`;
}