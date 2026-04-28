import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, DeviceEventEmitter, ScrollView } from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import api from '../../../hooks/axiosInstance';
import { tutorialService } from '../../../hooks/tutorial.service';
import { getProfile } from '../../../services/auth';
import { useNavigation } from '@react-navigation/native';
import Toast from '../../../components/Toast';

// Helper: resolve possibly-relative video URL to absolute using axios baseURL
function resolveVideoSrc(raw?: string | null) {
  if (!raw) return null;
  const s = String(raw).trim();
  if (!s) return null;
  if (/^https?:\/\//i.test(s)) return s;

  const base = api?.defaults?.baseURL
    ? String(api.defaults.baseURL).replace(/\/api\/?$/, '')
    : '';

  if (s.startsWith('/')) {
    return base ? `${base}${s}` : s;
  }

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

  const [aiAllowed, setAiAllowed] = useState<boolean>(true);
  const [localExercises, setLocalExercises] = useState<any[]>([]);
  const [scheduleCompleted, setScheduleCompleted] = useState<boolean>(Boolean(schedule?.completed));
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');
  const prevProgressRef = useRef<number | null>(null);

  useEffect(() => {
    const exs = Array.isArray(schedule?.exercises)
      ? schedule.exercises.map((e: any) => ({ ...e }))
      : [];

    setLocalExercises(normalizeExercises(exs));
    setScheduleCompleted(Boolean(schedule?.completed));

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

      const thisSid = schedule?.personalScheduleId ?? schedule?.id ?? schedule?.scheduleId ?? null;

      if (!sid || sid !== thisSid) return;

      setScheduleCompleted(true);
      setToastMessage('Hoàn thành lịch tập');
      setToastType('success');
      setToastVisible(true);

      if (typeof onVideoModalChange === 'function') {
        onVideoModalChange(false);
      }
    });

    return () => {
      subEx.remove();
      subSchedule.remove();
    };
  }, [schedule, onVideoModalChange, normalizeExercises]);

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

  const getScheduleId = () => {
    return (
      schedule.personalScheduleId ??
      schedule.id ??
      schedule.scheduleId ??
      schedule.personalScheduleIdRaw ??
      null
    );
  };

  const resolveExerciseVideo = async (ex: any) => {
    const eid = ex.exerciseId ?? ex.id ?? ex.exercise_id ?? ex.exerciseIdRaw ?? null;

    let rawSrc = ex.practice_video_url ?? ex.practiceVideoUrl ?? null;
    let src = resolveVideoSrc(rawSrc);

    if (!src && eid) {
      try {
        const tut = await tutorialService.getById(String(eid));
        rawSrc = tut?.practiceVideoUrl ?? rawSrc;
        src = resolveVideoSrc(rawSrc ?? null);
      } catch (err) {
        console.warn('[ScheduleDetail] tutorial lookup failed', eid, err);
      }
    }

    return src;
  };

  const buildQueue = async (exercises: any[]) => {
    const queue: any[] = [];

    for (const ex of exercises) {
      const videoSrc = await resolveExerciseVideo(ex);

      queue.push({
        ex,
        videoSrc,
      });
    }

    return queue;
  };

  /**
   * Bắt đầu toàn bộ:
   * - Lấy tất cả bài chưa completed.
   * - Không bỏ qua bài locked, vì trong luồng tập toàn bộ, bài sau sẽ được mở tuần tự sau khi bài trước hoàn thành.
   * - Truyền singleMode: false để SchedulePlayer tự chuyển bài.
   */
  const startAllFree = async () => {
    const normalized = normalizeExercises(localExercises);

    const exercisesToPlay = normalized
      .filter((ex: any) => ex.completed !== true)
      .sort((a: any, b: any) => {
        const orderA = Number(a.exerciseOrder ?? 9999);
        const orderB = Number(b.exerciseOrder ?? 9999);
        return orderA - orderB;
      });

    if (exercisesToPlay.length === 0) {
      setToastMessage('Bạn đã hoàn thành tất cả bài tập hôm nay');
      setToastType('success');
      setToastVisible(true);
      return;
    }

    const queue = await buildQueue(exercisesToPlay);

    const scheduleId = getScheduleId();

    if (typeof onVideoModalChange === 'function') {
      onVideoModalChange(false);
    }

    navigation.navigate('SchedulePlayer' as any, {
      queue,
      startIndex: 0,
      scheduleId,
      title: schedule.scheduleName,
      singleMode: false,
    });
  };

  /**
   * Tập từng bài lẻ:
   * - Chỉ truyền 1 bài vào queue.
   * - singleMode: true để tập xong không tự chuyển sang bài khác.
   */
  const startSingleExercise = async (ex: any) => {
    if (ex.locked) {
      setToastMessage('Bạn cần hoàn thành bài trước để mở khóa bài này');
      setToastType('info');
      setToastVisible(true);
      return;
    }

    if (ex.completed) {
      setToastMessage('Bài tập này đã hoàn thành');
      setToastType('info');
      setToastVisible(true);
      return;
    }

    const videoSrc = await resolveExerciseVideo(ex);
    const scheduleId = getScheduleId();

    if (typeof onVideoModalChange === 'function') {
      onVideoModalChange(false);
    }

    navigation.navigate('SchedulePlayer' as any, {
      queue: [{ ex, videoSrc }],
      startIndex: 0,
      scheduleId,
      title: ex.exerciseName ?? schedule.scheduleName,
      singleMode: true,
    });
  };

  const startAllAI = async () => {
    if (!aiAllowed) {
      setToastMessage('Tính năng AI chỉ dành cho VIP');
      setToastType('error');
      setToastVisible(true);
      return;
    }

    const firstEx = (localExercises || []).find(
      (ex: any) => !ex.locked && !ex.completed && (ex.exerciseId ?? ex.id ?? ex.exercise_id)
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
    <ScrollView> 
      <View className="mx-4 mt-3">
      <Toast
        visible={toastVisible}
        message={toastMessage}
        type={toastType}
        onHidden={() => setToastVisible(false)}
      />

      <View className="bg-white rounded-2xl border border-gray-100 shadow-lg">
        <View className="p-4">
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
                      {ex.sets ? `${ex.sets} set` : ''}
                      {ex.durationSeconds ? ` • ${ex.durationSeconds}s` : ''}
                      {ex.restSeconds ? ` • nghỉ ${ex.restSeconds}s` : ''}
                    </Text>
                  </TouchableOpacity>

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
                    <View style={modalStyles.controlBtnLocked}>
                      <Ionicons
                        name="lock-closed"
                        size={20}
                        color={modalStyles.controlIconLocked.color}
                      />
                    </View>
                  ) : ex.completed ? (
                    <View style={modalStyles.controlBtnCompleted}>
                      <Ionicons name="checkmark" size={18} color="#fff" />
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={modalStyles.controlBtnPlay}
                      activeOpacity={0.8}
                      onPress={() => startSingleExercise(ex)}
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

      <Toast
        visible={toastVisible}
        message={toastMessage}
        type={toastType}
        onHidden={() => setToastVisible(false)}
      />
    </View>
    </ScrollView>
   
  );
}

const modalStyles = StyleSheet.create({
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