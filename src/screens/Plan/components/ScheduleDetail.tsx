import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, Image, TouchableOpacity, Modal, StyleSheet, DeviceEventEmitter } from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import api from '../../../hooks/axiosInstance';
import { getPersonalExercisesBySchedule } from '../../../services/personalExercise.service';
import { tutorialService } from '../../../hooks/tutorial.service';
import VideoPlayer from '../../AIPractice/components/VideoPlayer/VideoPlayer';
import { markPersonalExerciseCompleted } from '../../../services/personalExercise.service';
import { markPersonalScheduleCompleted } from '../../../services/personalSchedule.service';
import { getProfile } from '../../../services/auth';
import { useNavigation } from '@react-navigation/native';
import Toast from '../../../components/Toast';

// Helper: resolve possibly-relative video URL to absolute using axios baseURL
function resolveVideoSrc(raw?: string | null) {
  if (!raw) return null;
  const s = String(raw).trim();
  if (!s) return null;
  if (/^https?:\/\//i.test(s)) return s;

  // if starts with '/', join with host (strip trailing /api)
  const base = api?.defaults?.baseURL
    ? String(api.defaults.baseURL).replace(/\/api\/?$/, '')
    : '';

  if (s.startsWith('/')) {
    return base ? `${base}${s}` : s;
  }

  // otherwise assume relative path
  return base ? `${base}/${s}` : s;
}

export default function ScheduleDetail({ schedule, onVideoModalChange, isPreview = false }: any) {
  const navigationRaw = useNavigation();
  const navigation: any = navigationRaw;

  /**
   * Frontend tự tính locked.
   *
   * Rule:
   * - Bài đầu tiên luôn mở.
   * - Bài hiện tại chỉ mở nếu bài liền trước đã completed.
   * - Nếu gặp 1 bài chưa completed thì toàn bộ bài phía sau bị locked.
   *
   * Backend không cần trả locked.
   */
  const normalizeExercises = useCallback((arr: any[]) => {
    if (!Array.isArray(arr)) return [];

    const sorted = [...arr]
      .map((it: any) => ({ ...it }))
      .sort((a: any, b: any) => {
        const orderA = Number(a.exerciseOrder ?? 9999);
        const orderB = Number(b.exerciseOrder ?? 9999);
        return orderA - orderB;
      });

    let previousCompleted = true;

    return sorted.map((exercise: any, index: number) => {
      const isCompleted = exercise.completed === true;

      const locked = index === 0 ? false : !previousCompleted;

      previousCompleted = isCompleted;

      return {
        ...exercise,
        locked,
      };
    });
  }, []);

  const [isVideoVisible, setIsVideoVisible] = useState(false);
  const [isVideoPlay, setIsVideoPlay] = useState(true);
  const [videoSource, setVideoSource] = useState<string | null>(null);
  const [playingAll, setPlayingAll] = useState<boolean>(false);
  const [playQueue, setPlayQueue] = useState<any[]>([]);
  const [currentQueueIndex, setCurrentQueueIndex] = useState<number>(0);
  const [aiAllowed, setAiAllowed] = useState<boolean>(true);
  const [localExercises, setLocalExercises] = useState<any[]>([]);
  const [currentExercise, setCurrentExercise] = useState<any | null>(null);
  const [scheduleCompleted, setScheduleCompleted] = useState<boolean>(Boolean(schedule?.completed));
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');
  const prevProgressRef = useRef<number | null>(null);

  // initialize local exercises state whenever schedule prop changes
  useEffect(() => {
    const exs = Array.isArray(schedule?.exercises)
      ? schedule.exercises.map((e: any) => ({ ...e }))
      : [];

    setLocalExercises(normalizeExercises(exs));
    setScheduleCompleted(Boolean(schedule?.completed));

    console.log('[ScheduleDetail] normalized exercises', normalizeExercises(exs).map((e: any) => ({
      name: e.exerciseName,
      order: e.exerciseOrder,
      completed: e.completed,
      locked: e.locked,
      personalExerciseId: e.personalExerciseId,
    })));

    // check user package for AI permission
    (async () => {
      try {
        const me = await getProfile();
        const activePackage = me.ok ? me.data?.activePackageType ?? null : null;
        setAiAllowed(activePackage === 'VIP_MEMBER');
      } catch {
        setAiAllowed(false);
      }
    })();
  }, [schedule, normalizeExercises]);

  // Listen to events from SchedulePlayer so UI updates when exercises/schedule complete
  useEffect(() => {
    const subEx = DeviceEventEmitter.addListener('exerciseCompleted', (evt: any) => {
      const id = evt?.personalExerciseId ?? null;
      console.log('[ScheduleDetail] received exerciseCompleted', evt);

      if (!id) return;

      setLocalExercises(prev => {
        const mapped = prev.map(it => {
          const pid = it.personalExerciseId ?? it.id ?? it.exerciseId ?? null;

          if (pid === id) {
            return { ...it, completed: true };
          }

          return it;
        });

        return normalizeExercises(mapped);
      });

      setToastMessage('Đã hoàn thành động tác');
      setToastType('success');
      setToastVisible(true);
    });

    const subSchedule = DeviceEventEmitter.addListener('scheduleCompleted', (evt: any) => {
      const sid = evt?.scheduleId ?? null;
      console.log('[ScheduleDetail] received scheduleCompleted', evt);

      // only react if this modal's schedule matches
      const thisSid = schedule?.personalScheduleId ?? schedule?.id ?? schedule?.scheduleId ?? null;

      if (!sid || sid !== thisSid) return;

      setScheduleCompleted(true);
      setToastMessage('Hoàn thành lịch tập');
      setToastType('success');
      setToastVisible(true);

      // close any open video modal
      setIsVideoVisible(false);
      setIsVideoPlay(false);
      setVideoSource(null);

      if (typeof onVideoModalChange === 'function') {
        onVideoModalChange(false);
      }
    });

    return () => {
      subEx.remove();
      subSchedule.remove();
    };
  }, [schedule, onVideoModalChange, normalizeExercises]);

  // notify when schedule progress changes
  useEffect(() => {
    const current = Number(schedule?.progressPercent ?? schedule?.progress ?? NaN);
    const prev = prevProgressRef.current;

    if (!Number.isNaN(current) && prev !== null && current !== prev) {
      setToastMessage(`Tiến độ cập nhật: ${current}%`);
      setToastType('info');
      setToastVisible(true);
    }

    if (!Number.isNaN(current)) {
      prevProgressRef.current = current;
    }
  }, [schedule?.progressPercent, schedule?.progress]);

  if (!schedule) return null;

  const handleVideoEnd = async () => {
    console.log('[ScheduleDetail] handleVideoEnd currentExercise', currentExercise);

    // close modal first
    setIsVideoVisible(false);
    setIsVideoPlay(false);
    setVideoSource(null);

    if (typeof onVideoModalChange === 'function') {
      onVideoModalChange(false);
    }

    if (!currentExercise) return;

    // determine personalExercise id
    const personalId =
      currentExercise.personalExerciseId ??
      currentExercise.personalExerciseIdRaw ??
      currentExercise.id ??
      currentExercise.exerciseId ??
      null;

    console.log('[ScheduleDetail] marking personalExerciseId', personalId);

    // mark personal exercise complete if available
    if (personalId) {
      try {
        const resp = await markPersonalExerciseCompleted(personalId);
        console.log('[ScheduleDetail] markPersonalExerciseCompleted response', resp);

        setToastMessage('Đã đánh dấu bài tập hoàn thành');
        setToastType('success');
        setToastVisible(true);

        // update local state immediately
        const updated = localExercises.map(it => {
          const id = it.personalExerciseId ?? it.id ?? it.exerciseId ?? null;

          if (id === personalId) {
            return { ...it, completed: true };
          }

          return it;
        });

        const normalizedUpdated = normalizeExercises(updated);
        setLocalExercises(normalizedUpdated);

        console.log('[ScheduleDetail] local after completed', normalizedUpdated.map((e: any) => ({
          name: e.exerciseName,
          order: e.exerciseOrder,
          completed: e.completed,
          locked: e.locked,
        })));

        // Before marking schedule complete, re-fetch exercises from server to avoid stale state
        const scheduleId =
          schedule.personalScheduleId ??
          schedule.id ??
          schedule.scheduleId ??
          schedule.personalScheduleIdRaw ??
          null;

        if (scheduleId) {
          try {
            console.log('[ScheduleDetail] fetching personal-exercises for schedule', scheduleId);

            const serverExercises = await getPersonalExercisesBySchedule(scheduleId);
            console.log('[ScheduleDetail] server response', serverExercises);

            const normalizedServerExercises = normalizeExercises(
              Array.isArray(serverExercises)
                ? serverExercises.map((se: any) => ({ ...se }))
                : []
            );

            setLocalExercises(normalizedServerExercises);

            console.log('[ScheduleDetail] server normalized exercises', normalizedServerExercises.map((e: any) => ({
              name: e.exerciseName,
              order: e.exerciseOrder,
              completed: e.completed,
              locked: e.locked,
            })));

            const allDoneServer =
              Array.isArray(serverExercises) &&
              serverExercises.length > 0 &&
              serverExercises.every((e: any) => e.completed === true);

            if (allDoneServer) {
              try {
                await markPersonalScheduleCompleted(scheduleId);
                setScheduleCompleted(true);
                setToastMessage('Hoàn thành lịch tập');
                setToastType('success');
                setToastVisible(true);
              } catch (err) {
                console.warn('[ScheduleDetail] mark schedule complete failed', err);
                setToastMessage('Không thể cập nhật lịch tập');
                setToastType('error');
                setToastVisible(true);
              }
            }
          } catch (err) {
            console.warn('[ScheduleDetail] failed to refetch exercises before marking schedule', err);

            // fallback: use updated local array
            const finalLocal = normalizeExercises(updated);
            const allDone =
              finalLocal.length > 0 &&
              finalLocal.every(e => e.completed === true);

            if (allDone) {
              try {
                await markPersonalScheduleCompleted(scheduleId);
                setScheduleCompleted(true);
                setToastMessage('Hoàn thành lịch tập');
                setToastType('success');
                setToastVisible(true);
              } catch {
                console.warn('[ScheduleDetail] mark schedule complete failed', err);
                setToastMessage('Không thể cập nhật lịch tập');
                setToastType('error');
                setToastVisible(true);
              }
            }
          }
        }
      } catch (err) {
        console.warn('[ScheduleDetail] mark exercise complete failed', err);
        setToastMessage('Không thể cập nhật bài tập');
        setToastType('error');
        setToastVisible(true);
      }
    }
  };

  // Start sequential autoplay for all exercises with available videos
  const startAllFree = async () => {
    if (!Array.isArray(localExercises) || localExercises.length === 0) {
      setToastMessage('Không có bài tập trong lịch');
      setToastType('info');
      setToastVisible(true);
      return;
    }

    // build queue of exercises with resolved videoSrc (may be null)
    const queue: any[] = [];

    for (const ex of localExercises) {
      if (ex.locked) continue;

      // prefer practice_video_url on the exercise record, but if missing try tutorial lookup
      let rawSrc = ex.practice_video_url ?? ex.practiceVideoUrl ?? null;
      let src = resolveVideoSrc(rawSrc);

      if (!src) {
        const eid = ex.exerciseId ?? ex.id ?? ex.exercise_id ?? null;

        if (eid) {
          try {
            const tut = await tutorialService.getById(String(eid));
            rawSrc = tut?.practiceVideoUrl ?? rawSrc;
            src = resolveVideoSrc(rawSrc ?? null);
          } catch (err) {
            console.warn('[ScheduleDetail] tutorial lookup failed for startAllFree', eid, err);
          }
        }
      }

      if (src) {
        queue.push({ ex, videoSrc: src });
      }
    }

    if (queue.length === 0) {
      setToastMessage('Không có video để phát trong lịch này');
      setToastType('info');
      setToastVisible(true);
      return;
    }

    const scheduleId =
      schedule.personalScheduleId ??
      schedule.id ??
      schedule.scheduleId ??
      schedule.personalScheduleIdRaw ??
      null;

    // navigate to SchedulePlayer to play queue sequentially
    // close parent modal if provided to avoid overlapping modal + stack
    if (typeof onVideoModalChange === 'function') {
      onVideoModalChange(false);
    }

    navigation.navigate('SchedulePlayer' as any, {
      queue,
      startIndex: 0,
      scheduleId,
      title: schedule.scheduleName,
    });
  };

  // Start AI workflow for all exercises: must be VIP_MEMBER
  const startAllAI = async () => {
    if (!aiAllowed) {
      setToastMessage('Tính năng AI chỉ dành cho VIP');
      setToastType('error');
      setToastVisible(true);
      return;
    }

    // Find first unlocked exercise and navigate to ExerciseDetail so user can run AI per exercise
    const firstEx = (localExercises || []).find(
      (ex: any) => !ex.locked && (ex.exerciseId ?? ex.id ?? ex.exercise_id)
    );

    if (!firstEx) {
      setToastMessage('Không có bài tập khả dụng để tập với AI');
      setToastType('info');
      setToastVisible(true);
      return;
    }

    const eid = firstEx.exerciseId ?? firstEx.id ?? firstEx.exercise_id;
    navigation.navigate('ExerciseDetail' as any, { exercise_id: eid });
  };

  return (
    <View className="mx-4 mt-3">
      <Toast
        visible={toastVisible}
        message={toastMessage}
        type={toastType}
        onHidden={() => setToastVisible(false)}
      />

      {/* Card (no banner) */}
      <View className="bg-white rounded-2xl border border-gray-100 shadow-lg">
        <View className="p-4">
          {/* Action buttons: start all free vs start all AI (hidden in preview mode) */}
          {!isPreview && (
            <View className="flex-row justify-between mb-3">
              <TouchableOpacity
                className="flex-1 mr-2 bg-[#F3EDE3] rounded-lg py-2 items-center"
                onPress={startAllFree}
              >
                <Text style={modalStyles.btnPrimaryTitle}>Bắt đầu toàn bộ</Text>
                <Text style={modalStyles.btnPrimarySub}>Tự tập</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className={`flex-1 ml-2 rounded-lg py-2 items-center ${
                  aiAllowed ? 'bg-[#8B4513]' : 'bg-gray-300'
                }`}
                onPress={startAllAI}
                disabled={!aiAllowed}
              >
                <Text style={[modalStyles.btnAiTitle, !aiAllowed && modalStyles.btnAiTitleDisabled]}>
                  Bắt đầu AI
                </Text>
                <Text style={[modalStyles.btnAiSub, !aiAllowed && modalStyles.btnAiSubDisabled]}>
                  Tập với AI
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <View className="flex-row items-center justify-between">
            <Text className="text-2xl font-extrabold text-[#3A2A1A]">
              {schedule.scheduleName}
            </Text>

            {scheduleCompleted && (
              <View className="bg-green-100 rounded-full px-3 py-1">
                <Text className="text-green-700 font-semibold">Hoàn thành</Text>
              </View>
            )}
          </View>

          <Text className="text-gray-500 mt-1">
            {schedule.dayOfWeek} • {schedule.durationMinutes} phút
          </Text>

          {/* Pills */}
          <View className="flex-row flex-wrap mt-3">
            <View className="flex-row items-start bg-[#F3EDE3] px-3 py-3 rounded-xl w-full">
              <Ionicons name="information-circle-outline" size={18} color="#3A2A1A" />
              <Text
                className="text-[#8B4513] font-semibold ml-3 flex-1"
                numberOfLines={3}
                ellipsizeMode="tail"
              >
                {schedule.description ?? 'Không có mô tả'}
              </Text>
            </View>
          </View>

          {/* Exercises list */}
          <View className="mt-4">
            {localExercises.map((ex: any, idx: number) => (
              <View
                key={ex.personalExerciseId ?? ex.id ?? ex.exerciseId ?? idx}
                className="flex-row items-center py-3 border-b border-[#F3EDE3]"
              >
                <Image
                  source={{
                    uri:
                      ex.thumbnailUrl ??
                      ex.imageUrl ??
                      ex.image ??
                      ex.imageUrl ??
                      'https://via.placeholder.com/72',
                  }}
                  className="w-16 h-16 rounded-lg bg-gray-100"
                  resizeMode="cover"
                />

                <View className="flex-1 ml-3">
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => {
                      const eid = ex.exerciseId ?? ex.id ?? ex.exercise_id ?? ex.exerciseIdRaw ?? null;

                      if (eid) {
                        navigation.navigate('ExerciseDetail' as any, { exercise_id: eid });
                      }
                    }}
                  >
                    <Text className="text-base font-semibold text-[#3A2A1A]">
                      {idx + 1}. {ex.exerciseName}
                    </Text>

                    <Text className="text-sm text-gray-400 mt-1">
                      {ex.points
                        ? `${ex.points}p`
                        : ex.durationSeconds
                          ? `${Math.ceil((ex.durationSeconds ?? 0) / 60)}p`
                          : ''}
                    </Text>
                  </TouchableOpacity>

                  {/* Action buttons: detail + AI practice */}
                  <View className="flex-row mt-3">
                    <TouchableOpacity
                      className="px-3 py-1 rounded-md bg-[#F3EDE3] mr-3"
                      activeOpacity={0.8}
                      onPress={() => {
                        const eid = ex.exerciseId ?? ex.id ?? ex.exercise_id ?? ex.exerciseIdRaw ?? null;

                        if (eid) {
                          navigation.navigate('ExerciseDetail' as any, { exercise_id: eid });
                        }
                      }}
                    >
                      <Text style={modalStyles.detailBtnText}>Chi tiết</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      className={`px-3 py-1 rounded-md ${ex.locked ? 'bg-gray-300' : 'bg-[#8B4513]'}`}
                      activeOpacity={0.8}
                      disabled={ex.locked}
                      onPress={() => {
                        const eid = ex.exerciseId ?? ex.id ?? ex.exercise_id ?? ex.exerciseIdRaw ?? null;

                        if (eid) {
                          navigation.navigate('ExerciseDetail' as any, { exercise_id: eid });
                        }
                      }}
                    >
                      <Text style={ex.locked ? modalStyles.aiSmallBtnTextDisabled : modalStyles.aiSmallBtnText}>
                        Tập với AI
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={modalStyles.controlWrapper}>
                  {isPreview ? null : ex.locked ? (
                    // locked: grey circular background with lock icon
                    <View style={modalStyles.controlBtnLocked}>
                      <Ionicons
                        name="lock-closed"
                        size={20}
                        color={modalStyles.controlIconLocked.color}
                      />
                    </View>
                  ) : ex.completed ? (
                    // completed: green check badge
                    <View style={modalStyles.controlBtnCompleted}>
                      <Ionicons name="checkmark" size={18} color="#fff" />
                    </View>
                  ) : (
                    // available: pale circle with play icon (dark)
                    <TouchableOpacity
                      style={modalStyles.controlBtnPlay}
                      activeOpacity={0.8}
                      onPress={async () => {
                        // set current exercise so onEnd can reference
                        setCurrentExercise(ex);

                        // If there was an existing "play all" session, reset it because user opened a single exercise
                        setPlayingAll(false);
                        setPlayQueue([]);
                        setCurrentQueueIndex(0);

                        // notify any running SchedulePlayer to stop
                        try {
                          DeviceEventEmitter.emit('stopPlayingAll', {
                            scheduleId:
                              schedule?.personalScheduleId ??
                              schedule?.id ??
                              schedule?.scheduleId ??
                              null,
                          });
                        } catch {
                          // ignore
                        }

                        // Always open modal and prevent automatic navigation to ExerciseDetail
                        setIsVideoVisible(true);

                        if (typeof onVideoModalChange === 'function') {
                          onVideoModalChange(true);
                        }

                        // prefer practice_video_url on the exercise record, fall back to tutorial lookup when needed
                        const eid = ex.exerciseId ?? ex.id ?? ex.exercise_id ?? null;
                        let rawSrc = ex.practice_video_url ?? ex.practiceVideoUrl ?? null;
                        let src = resolveVideoSrc(rawSrc);

                        if (!src && eid) {
                          try {
                            const tut = await tutorialService.getById(String(eid));
                            rawSrc = tut?.practiceVideoUrl ?? rawSrc;
                            src = resolveVideoSrc(rawSrc ?? null);
                          } catch (err) {
                            console.warn('[ScheduleDetail] tutorial lookup failed on play', eid, err);
                          }
                        }

                        // debug log: show raw field and resolved URL and basic type checks
                        try {
                          const srcStr = String(src ?? '');
                          const isYouTube = /youtube\.com|youtu\.be/i.test(srcStr);
                          const isMp4 = /\.mp4(\?|$)/i.test(srcStr);
                          const isHls = /\.m3u8(\?|$)/i.test(srcStr);

                          console.log('[ScheduleDetail] play pressed', {
                            exerciseName: ex.exerciseName,
                            order: ex.exerciseOrder,
                            completed: ex.completed,
                            locked: ex.locked,
                            rawField: rawSrc,
                            resolvedUrl: src,
                            isYouTube,
                            isMp4,
                            isHls,
                            playingAll: false,
                          });
                        } catch (err) {
                          console.log('[ScheduleDetail] play pressed - log failed', err);
                        }

                        if (src) {
                          setVideoSource(src);
                          setIsVideoPlay(true);
                        } else {
                          // no video available — show modal with message (user can close)
                          setVideoSource(null);
                          setIsVideoPlay(false);
                        }
                      }}
                    >
                      <Ionicons name="play" size={18} color="#A0522D" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* Video modal */}
      <Modal
        visible={isVideoVisible}
        animationType="slide"
        onRequestClose={() => {
          setIsVideoVisible(false);
          setIsVideoPlay(false);
          setVideoSource(null);

          if (typeof onVideoModalChange === 'function') {
            onVideoModalChange(false);
          }
        }}
      >
        <View style={modalStyles.container}>
          <View style={modalStyles.header}>
            <TouchableOpacity
              onPress={() => {
                setIsVideoVisible(false);
                setIsVideoPlay(false);
                setVideoSource(null);

                if (typeof onVideoModalChange === 'function') {
                  onVideoModalChange(false);
                }
              }}
            >
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
          </View>

          {videoSource ? (
            <View style={modalStyles.playerWrap}>
              <VideoPlayer
                source={videoSource}
                isVideoPlay={isVideoPlay}
                togglePlayButton={() => setIsVideoPlay((v) => !v)}
                onEnd={async () => {
                  console.log('[ScheduleDetail] modal onEnd playingAll', playingAll);

                  await handleVideoEnd();

                  // if playingAll, advance queue
                  if (playingAll) {
                    const next = currentQueueIndex + 1;

                    if (next < playQueue.length) {
                      const item = playQueue[next];

                      setCurrentQueueIndex(next);
                      setCurrentExercise(item.ex);
                      setVideoSource(item.videoSrc);
                      setIsVideoPlay(Boolean(item.videoSrc));
                      setIsVideoVisible(true);

                      if (typeof onVideoModalChange === 'function') {
                        onVideoModalChange(true);
                      }

                      return;
                    }

                    // finished queue
                    setPlayingAll(false);
                    setPlayQueue([]);
                    setCurrentQueueIndex(0);
                    setToastMessage('Đã hoàn thành tất cả bài trong lịch');
                    setToastType('success');
                    setToastVisible(true);

                    // attempt mark schedule complete if possible
                    const scheduleId =
                      schedule.personalScheduleId ??
                      schedule.id ??
                      schedule.scheduleId ??
                      schedule.personalScheduleIdRaw ??
                      null;

                    if (scheduleId) {
                      try {
                        await markPersonalScheduleCompleted(scheduleId);
                        setScheduleCompleted(true);
                      } catch {
                        // ignore
                      }
                    }
                  }
                }}
              />
            </View>
          ) : (
            <View style={modalStyles.center}>
              <Text>Không có video</Text>
            </View>
          )}
        </View>
      </Modal>

      {/* Toast */}
      <Toast
        visible={toastVisible}
        message={toastMessage}
        type={toastType}
        onHidden={() => setToastVisible(false)}
      />
    </View>
  );
}

const modalStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: {
    height: 56,
    paddingHorizontal: 16,
    alignItems: 'flex-end',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  playerWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // button text styles
  btnPrimaryTitle: { color: '#8B4513', fontWeight: '700' },
  btnPrimarySub: { color: '#6B6B6B', fontSize: 12 },
  btnAiTitle: { color: '#fff', fontWeight: '700' },
  btnAiSub: { color: '#fff', fontSize: 12 },
  btnAiTitleDisabled: { color: '#9CA3AF' },
  btnAiSubDisabled: { color: '#9CA3AF' },
  detailBtnText: { color: '#8B4513', fontWeight: '600' },
  aiSmallBtnText: { color: '#fff', fontWeight: '600' },
  aiSmallBtnTextDisabled: { color: '#6B7280', fontWeight: '600' },

  controlBtnPlay: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FCEBD9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlBtnLocked: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E6EAF0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlBtnCompleted: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlIconLocked: { color: '#6B7280' },
  controlWrapper: {
    width: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
});