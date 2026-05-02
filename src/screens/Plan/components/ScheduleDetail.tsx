import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  DeviceEventEmitter,
  ScrollView,
} from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import api from '../../../hooks/axiosInstance';
import { tutorialService } from '../../../hooks/tutorial.service';
import { getProfile } from '../../../services/auth';
import { useNavigation } from '@react-navigation/native';
import Toast from '../../../components/Toast';
import { workoutSessionService } from '../../../hooks/workoutSession.service';

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

export default function ScheduleDetail({
  schedule,
  onVideoModalChange,
  isPreview = false,
  onScheduleCompleted,
  onEditExercise,
}: any) {
  const navigationRaw = useNavigation();
  const navigation: any = navigationRaw;

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

  const isExerciseAISupported = (ex: any) => {
    return ex?.haveAIsupported === true || ex?.haveAISupported === true;
  };

  const [aiAllowed, setAiAllowed] = useState<boolean>(true);
  const [localExercises, setLocalExercises] = useState<any[]>([]);
  const [scheduleCompleted, setScheduleCompleted] = useState<boolean>(
    Boolean(schedule?.completed),
  );
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>(
    'info',
  );

  const prevProgressRef = useRef<number | null>(null);

  useEffect(() => {
    console.log('[ScheduleDetail sync schedule]', {
      scheduleName: schedule?.scheduleName,
      scheduledDate: schedule?.scheduledDate,
      dayOfWeek: schedule?.dayOfWeek,
      personalScheduleId: schedule?.personalScheduleId,
      completed: schedule?.completed,
      exercisesLength: schedule?.exercises?.length,
    });

    const exs = Array.isArray(schedule?.exercises)
      ? schedule.exercises.map((e: any) => ({ ...e }))
      : [];

    setLocalExercises(normalizeExercises(exs));
    setScheduleCompleted(Boolean(schedule?.completed));

    let mounted = true;

    (async () => {
      try {
        const me = await getProfile();
        const activePackage = me.ok ? me.data?.activePackageType ?? null : null;

        if (mounted) {
          setAiAllowed(activePackage === 'VIP_MEMBER');
        }
      } catch {
        if (mounted) {
          setAiAllowed(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [
    schedule?.personalScheduleId,
    schedule?.scheduledDate,
    schedule?.completed,
    schedule?.exercises,
    normalizeExercises,
  ]);

  useEffect(() => {
    const subEx = DeviceEventEmitter.addListener(
      'exerciseCompleted',
      (evt: any) => {
        const id = evt?.personalExerciseId ?? null;

        console.log('[ScheduleDetail] received exerciseCompleted', evt);

        if (!id) return;

        setLocalExercises(prev => {
          const mapped = prev.map(it => {
            const pid = it.personalExerciseId ?? it.id ?? it.exerciseId ?? null;

            if (String(pid) === String(id)) {
              return { ...it, completed: true };
            }

            return it;
          });

          return normalizeExercises(mapped);
        });

        setToastMessage('Đã hoàn thành động tác');
        setToastType('success');
        setToastVisible(true);
      },
    );

    const subSchedule = DeviceEventEmitter.addListener(
      'scheduleCompleted',
      (evt: any) => {
        const sid = evt?.scheduleId ?? null;

        console.log('[ScheduleDetail] received scheduleCompleted', evt);

        const thisSid =
          schedule?.personalScheduleId ??
          schedule?.id ??
          schedule?.scheduleId ??
          null;

        if (!sid || String(sid) !== String(thisSid)) return;

        setScheduleCompleted(true);

        if (typeof onScheduleCompleted === 'function') {
          onScheduleCompleted();
        }

        setToastMessage('Hoàn thành lịch tập');
        setToastType('success');
        setToastVisible(true);

        if (typeof onVideoModalChange === 'function') {
          onVideoModalChange(false);
        }
      },
    );

    return () => {
      subEx.remove();
      subSchedule.remove();
    };
  }, [
    schedule?.personalScheduleId,
    schedule?.id,
    schedule?.scheduleId,
    onVideoModalChange,
    onScheduleCompleted,
    normalizeExercises,
  ]);

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
    const eid =
      ex.exerciseId ?? ex.id ?? ex.exercise_id ?? ex.exerciseIdRaw ?? null;

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
      (ex: any) =>
        !ex.locked &&
        !ex.completed &&
        isExerciseAISupported(ex) &&
        (ex.exerciseId ?? ex.id ?? ex.exercise_id),
    );

    if (!firstEx) {
      setToastMessage('Không có bài tập khả dụng để tập với AI');
      setToastType('info');
      setToastVisible(true);
      return;
    }

    await startAIForExercise(firstEx);
  };

  const startAIForExercise = async (ex: any) => {
    if (!aiAllowed) {
      setToastMessage('Tính năng AI chỉ dành cho VIP');
      setToastType('error');
      setToastVisible(true);
      return;
    }

    if (!isExerciseAISupported(ex)) {
      setToastMessage('Bài tập này chưa hỗ trợ AI');
      setToastType('info');
      setToastVisible(true);
      return;
    }

    const eid = ex.exerciseId ?? ex.id ?? ex.exercise_id ?? null;

    if (!eid) {
      setToastMessage('Không thể xác định bài tập');
      setToastType('error');
      setToastVisible(true);
      return;
    }

    try {
      const videoUrl = await resolveExerciseVideo(ex);
      const imgUrl = ex.thumbnailUrl ?? ex.imageUrl ?? ex.image ?? null;

      const payload = {
        exerciseId: String(eid),
        haveAITracking: true,
        haveIOTDeviceTracking: false,
      };

      const session = await workoutSessionService.startFreeWorkout(payload);

      const sessionId = session?.workoutSessionId ?? session?.id ?? null;

      if (!sessionId) {
        setToastMessage('Không thể bắt đầu buổi tập, thử lại sau');
        setToastType('error');
        setToastVisible(true);
        return;
      }

      navigation.navigate('AIPractice' as any, {
        exercise_id: String(eid),
        imgUrl: imgUrl ?? null,
        videoUrl: videoUrl ?? null,
        workoutSessionId: sessionId,
        nameAITracking: ex.nameInModelAI ?? ex.nameAITracking ?? '',
      });
    } catch (err) {
      console.error('[ScheduleDetail] startAIForExercise error', err);
      setToastMessage('Bắt đầu AI thất bại. Vui lòng thử lại');
      setToastType('error');
      setToastVisible(true);
    }
  };

  const hasAvailableAIExercise = (localExercises || []).some(
    (ex: any) =>
      !ex.locked &&
      !ex.completed &&
      isExerciseAISupported(ex) &&
      (ex.exerciseId ?? ex.id ?? ex.exercise_id),
  );

  const aiMainDisabled = !aiAllowed || !hasAvailableAIExercise;

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
                  <Text style={modalStyles.btnPrimaryTitle}>
                    Bắt đầu toàn bộ
                  </Text>

                  <Text style={modalStyles.btnPrimarySub}>Tự tập</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className={`flex-1 ml-2 rounded-lg py-2 items-center ${
                    aiMainDisabled ? 'bg-gray-300' : 'bg-[#8B4513]'
                  }`}
                  onPress={startAllAI}
                  disabled={aiMainDisabled}
                >
                  <Text
                    style={[
                      modalStyles.btnAiTitle,
                      aiMainDisabled && modalStyles.btnAiTitleDisabled,
                    ]}
                  >
                    Bắt đầu AI
                  </Text>

                  <Text
                    style={[
                      modalStyles.btnAiSub,
                      aiMainDisabled && modalStyles.btnAiSubDisabled,
                    ]}
                  >
                    Tập với AI
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            <View className="mt-1">
              <Text
                className="text-2xl font-extrabold text-[#3A2A1A]"
                numberOfLines={3}
              >
                {schedule.scheduleName}
              </Text>

              <Text className="text-gray-500 mt-1">
                {schedule.dayOfWeek} • {schedule.durationMinutes} phút
              </Text>

              {scheduleCompleted && (
                <View className="bg-green-100 rounded-full px-3 py-1 mt-2 self-start">
                  <Text className="text-green-700 font-semibold">
                    Hoàn thành
                  </Text>
                </View>
              )}
            </View>

            <View className="flex-row flex-wrap mt-3">
              <View className="flex-row items-start bg-[#F3EDE3] px-3 py-3 rounded-xl w-full">
                <Ionicons
                  name="information-circle-outline"
                  size={18}
                  color="#3A2A1A"
                />

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
              {localExercises.map((ex: any, idx: number) => {
                const aiSupported = isExerciseAISupported(ex);
                const aiDisabled = ex.locked || !aiSupported || !aiAllowed;

                return (
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
                          const eid =
                            ex.exerciseId ??
                            ex.id ??
                            ex.exercise_id ??
                            ex.exerciseIdRaw ??
                            null;

                          if (eid) {
                            navigation.navigate('ExerciseDetail' as any, {
                              exercise_id: eid,
                            });
                          }
                        }}
                      >
                        <Text className="text-base font-semibold text-[#3A2A1A]">
                          {idx + 1}. {ex.exerciseName}
                        </Text>

                        <Text className="text-sm text-gray-400 mt-1">
                          {ex.sets ? `${ex.sets} set` : ''}
                          {ex.reps ? ` • ${ex.reps} reps` : ''}
                          {ex.durationSeconds ? ` • ${ex.durationSeconds}s` : ''}
                          {ex.restSeconds ? ` • nghỉ ${ex.restSeconds}s` : ''}
                        </Text>
                      </TouchableOpacity>

                      <View className="flex-row mt-3">
                        <TouchableOpacity
                          className="px-3 py-1 rounded-md bg-[#F3EDE3] mr-3"
                          activeOpacity={0.8}
                          onPress={() => {
                            const eid =
                              ex.exerciseId ??
                              ex.id ??
                              ex.exercise_id ??
                              ex.exerciseIdRaw ??
                              null;

                            if (eid) {
                              navigation.navigate('ExerciseDetail' as any, {
                                exercise_id: eid,
                              });
                            }
                          }}
                        >
                          <Text style={modalStyles.detailBtnText}>Chi tiết</Text>
                        </TouchableOpacity>

                        {isPreview && typeof onEditExercise === 'function' ? (
                          <TouchableOpacity
                            className="px-3 py-1 rounded-md bg-[#E7D7C6] mr-3"
                            activeOpacity={0.8}
                            onPress={() => onEditExercise(idx, ex)}
                          >
                            <Text style={modalStyles.editBtnText}>Sửa</Text>
                          </TouchableOpacity>
                        ) : null}

                        {!isPreview ? (
                          <TouchableOpacity
                            className={`px-3 py-1 rounded-md ${
                              aiDisabled ? 'bg-gray-300' : 'bg-[#8B4513]'
                            }`}
                            activeOpacity={0.8}
                            disabled={aiDisabled}
                            onPress={() => startAIForExercise(ex)}
                          >
                            <Text
                              style={
                                aiDisabled
                                  ? modalStyles.aiSmallBtnTextDisabled
                                  : modalStyles.aiSmallBtnText
                              }
                            >
                              {aiSupported ? 'Tập với AI' : 'Chưa hỗ trợ AI'}
                            </Text>
                          </TouchableOpacity>
                        ) : null}
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
                );
              })}
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
  btnPrimaryTitle: {
    color: '#8B4513',
    fontWeight: '700',
  },

  btnPrimarySub: {
    color: '#6B6B6B',
    fontSize: 12,
  },

  btnAiTitle: {
    color: '#fff',
    fontWeight: '700',
  },

  btnAiSub: {
    color: '#fff',
    fontSize: 12,
  },

  btnAiTitleDisabled: {
    color: '#9CA3AF',
  },

  btnAiSubDisabled: {
    color: '#9CA3AF',
  },

  detailBtnText: {
    color: '#8B4513',
    fontWeight: '600',
  },

  editBtnText: {
    color: '#8B4513',
    fontWeight: '700',
  },

  aiSmallBtnText: {
    color: '#fff',
    fontWeight: '600',
  },

  aiSmallBtnTextDisabled: {
    color: '#6B7280',
    fontWeight: '600',
  },

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

  controlIconLocked: {
    color: '#6B7280',
  },

  controlWrapper: {
    width: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
});