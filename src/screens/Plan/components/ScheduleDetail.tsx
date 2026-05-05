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
import { workoutSessionService } from '../../../hooks/workoutSession.service';
import { heartRateService } from '../../../hooks/heartRate.service';
import { mistakeLogService } from '../../../hooks/mistakeLog.service';
import { getProfile } from '../../../services/auth';
import { useNavigation } from '@react-navigation/native';
import Toast from '../../../components/Toast';
import { workoutFeedbackService } from '../../../hooks/workoutFeedback.service';

// Helper: Phân giải URL video
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
  onEditExercise,
}: any) {
  const navigation: any = useNavigation();

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
  const [scheduleCompleted, setScheduleCompleted] = useState<boolean>(
    Boolean(schedule?.completed),
  );

  // Toast state
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>(
    'info',
  );

  const [shouldGoPackage, setShouldGoPackage] = useState(false);

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

  // Lắng nghe sự kiện hoàn thành bài tập/lịch tập để tự động mở khóa theo trình tự
  useEffect(() => {
    const subEx = DeviceEventEmitter.addListener(
      'exerciseCompleted',
      (evt: any) => {
        const id = evt?.personalExerciseId ?? null;
        if (!id) return;

        setLocalExercises(prev => {
          const mapped = prev.map(it => {
            const pid = it.personalExerciseId ?? it.id ?? it.exerciseId ?? null;
            if (pid === id) {
              return { ...it, completed: true };
            }
            return it;
          });

          // Gọi lại normalizeExercises để mở khóa bài tiếp theo
          return normalizeExercises(mapped);
        });

        setToastMessage('Đã hoàn thành động tác');
        setToastType('success');
        setToastVisible(true);
      },
    );

  const showToast = (
    message: string,
    type: 'success' | 'error' | 'info' = 'info',
  ) => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  const goToPackageAfterToast = () => {
    setShouldGoPackage(true);
  };

  const checkCanWorkout = async () => {
    try {
      const me = await getProfile();

      if (!me.ok) {
        showToast('Không thể kiểm tra gói tập. Vui lòng thử lại', 'error');
        return false;
      }

      const activePackageType = me.data?.activePackageType ?? null;

      if (!activePackageType) {
        goToPackageAfterToast();

        showToast(
          'Bạn cần đăng ký gói tập trước khi bắt đầu luyện tập',
          'error',
        );

        return false;
      }

      return true;
    } catch {
      showToast('Không thể kiểm tra gói tập. Vui lòng thử lại', 'error');
      return false;
    }
  };

  useEffect(() => {
    const subEx = DeviceEventEmitter.addListener(
      'exerciseCompleted',
      (evt: any) => {
        const id = evt?.personalExerciseId ?? null;

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

        showToast('Đã hoàn thành động tác', 'success');
      },
    );

    const subSchedule = DeviceEventEmitter.addListener(
      'scheduleCompleted',
      (evt: any) => {
        const sid = evt?.scheduleId ?? null;
        const thisSid =
          schedule?.personalScheduleId ??
          schedule?.id ??
          schedule?.scheduleId ??
          null;

        if (!sid || sid !== thisSid) return;

        setScheduleCompleted(true);
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
  }, [schedule, onVideoModalChange, normalizeExercises]);

  useEffect(() => {
    const current = Number(
      schedule?.progressPercent ?? schedule?.progress ?? NaN,
    );

    const prev = prevProgressRef.current;

    if (!Number.isNaN(current) && prev !== null && current !== prev) {
      showToast(`Tiến độ cập nhật: ${current}%`, 'info');
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

  const getExerciseObject = (ex: any) => {
    return ex?.exercise ?? ex;
  };

  const supportsAI = (ex: any) => {
    const item = getExerciseObject(ex);

    return Boolean(
      item?.haveAIsupported ||
        item?.nameInModelAI ||
        item?.haveAiSupported ||
        item?.name_in_model_ai,
    );
  };

  const buildQueue = async (exercises: any[]) => {
    const queue: any[] = [];

    for (const ex of exercises) {
      const videoSrc = await resolveExerciseVideo(ex);

      queue.push({
        ex,
        videoSrc,
        isAiSupported: supportsAI(ex),
        durationSeconds: Math.max(
          0,
          Number(ex.durationSeconds ?? ex.duration ?? 0) || 0,
        ),
        restSeconds: Math.max(0, Number(ex.restSeconds ?? ex.rest ?? 0) || 0),
      });
    }

    return queue;
  };

  const startAllFree = async () => {
    const canWorkout = await checkCanWorkout();

    if (!canWorkout) {
      return;
    }

    const normalized = normalizeExercises(localExercises);

    // Lọc ra các bài chưa tập và sắp xếp đúng trình tự
    const exercisesToPlay = normalized
      .filter((ex: any) => ex.completed !== true)
      .sort((a: any, b: any) => {
        const orderA = Number(a.exerciseOrder ?? 9999);
        const orderB = Number(b.exerciseOrder ?? 9999);

        return orderA - orderB;
      });

    if (exercisesToPlay.length === 0) {
      showToast('Bạn đã hoàn thành tất cả bài tập hôm nay', 'success');
      return;
    }

    const queue = await buildQueue(exercisesToPlay);
    const scheduleId = getScheduleId();

    if (typeof onVideoModalChange === 'function') {
      onVideoModalChange(false);
    }

    navigation.navigate('SchedulePlayer', {
      queue,
      startIndex: 0,
      scheduleId,
      title: schedule.scheduleName,
      singleMode: false,
    });
  };

  const startSingleExercise = async (ex: any) => {
    if (ex.locked) {
      showToast('Bạn cần hoàn thành bài tập trước đó để mở khóa bài này', 'info');
      return;
    }

    if (ex.completed) {
      showToast('Bài tập này đã hoàn thành', 'info');
      return;
    }

    const canWorkout = await checkCanWorkout();

    if (!canWorkout) {
      return;
    }

    const videoSrc = await resolveExerciseVideo(ex);
    const scheduleId = getScheduleId();

    if (typeof onVideoModalChange === 'function') {
      onVideoModalChange(false);
    }

    navigation.navigate('SchedulePlayer', {
      queue: [{ ex, videoSrc }],
      startIndex: 0,
      scheduleId,
      title: ex.exerciseName ?? schedule.scheduleName,
      singleMode: true,
    });
  };

  const startAiExercise = async (ex: any) => {
    const canWorkout = await checkCanWorkout();

    if (!canWorkout) {
      return;
    }

    if (!aiAllowed) {
      showToast('Tính năng AI chỉ dành cho hội viên VIP', 'error');
      return;
    }

    if (!supportsAI(ex)) {
      await startSingleExercise(ex);
      return;
    }

    const actual = getExerciseObject(ex);
    const exerciseId =
      actual?.exerciseId ??
      actual?.id ??
      actual?.exercise_id ??
      actual?.exerciseIdRaw ??
      null;

    if (!exerciseId) {
      showToast('Không xác định được ID bài tập', 'error');
      return;
    }

    try {
      const session = await workoutSessionService.startRoadmapWorkout({
        personalExerciseId: String(ex.personalExerciseId || exerciseId),
        haveAITracking: true,
        haveIOTDeviceTracking: true,
      });

      const videoUrl = await resolveExerciseVideo(ex);
      const nameAITracking =
        actual?.nameInModelAI ?? actual?.name_in_model_ai ?? '';

      if (!session?.workoutSessionId) {
        throw new Error('Không tạo được phiên AI');
      }

      if (typeof onVideoModalChange === 'function') {
        onVideoModalChange(false);
      }

      const timeout = Math.max(
        5,
        Number(actual?.durationSeconds ?? actual?.duration ?? 0) || 5,
      );

      navigation.navigate('AIPracticeTimeout', {
        exercise_id: String(exerciseId),
        imgUrl: actual?.imageUrl ?? actual?.image ?? '',
        videoUrl: videoUrl ?? '',
        workoutSessionId: session.workoutSessionId,
        nameAITracking,
        timeout,
        autoStart: true,
        skipSummary: true,
      });
    } catch (err) {
      console.warn('[ScheduleDetail] startAiExercise failed', err);
      showToast('Không thể bắt đầu AI Practice. Vui lòng thử lại', 'error');
    }
  };

  const startAllAI = async () => {
    const canWorkout = await checkCanWorkout();

    if (!canWorkout) {
      return;
    }

    if (!aiAllowed) {
      showToast('Tính năng AI chỉ dành cho hội viên VIP', 'error');
      return;
    }

    const normalized = normalizeExercises(localExercises);

    const exercisesToPlay = normalized
      .filter((ex: any) => ex.completed !== true)
      .sort((a: any, b: any) => {
        const orderA = Number(a.exerciseOrder ?? 9999);
        const orderB = Number(b.exerciseOrder ?? 9999);

        return orderA - orderB;
      });

    if (exercisesToPlay.length === 0) {
      showToast('Bạn đã hoàn thành tất cả bài tập hôm nay', 'success');
      return;
    }

    const queue = await buildQueue(exercisesToPlay);
    const scheduleId = getScheduleId();

    const firstEx = exercisesToPlay[0];
    if (firstEx && firstEx.isAiSupported) {
      try {
        await workoutSessionService.startRoadmapWorkout({
          personalExerciseId: String(firstEx.personalExerciseId || firstEx.exerciseId),
          haveAITracking: true,
          haveIOTDeviceTracking: true,
        });
      } catch (err) {
        console.warn('[ScheduleDetail] startAllAI startRoadmapWorkout failed', err);
        setToastMessage('Không thể bắt đầu AI Practice. Vui lòng thử lại');
        setToastType('error');
        setToastVisible(true);
        return;
      }
    }

    if (typeof onVideoModalChange === 'function') onVideoModalChange(false);

    navigation.navigate('SchedulePlayer', {
      queue,
      startIndex: 0,
      scheduleId,
      title: schedule.scheduleName,
      aiFlow: true,
    });
  };

  const viewAIReview = async (ex: any) => {
    if (!ex.completed) {
      setToastMessage('Bài tập chưa hoàn thành');
      setToastType('info');
      setToastVisible(true);
      return;
    }

    if (!supportsAI(ex)) {
      setToastMessage('Bài tập này không hỗ trợ AI');
      setToastType('info');
      setToastVisible(true);
      return;
    }

    const exerciseId = ex.exerciseId ?? ex.id ?? ex.exercise_id ?? ex.exerciseIdRaw ?? null;
    const personalExerciseId = ex.personalExerciseId ?? ex.id ?? null;

    if (!exerciseId) {
      setToastMessage('Không xác định được ID bài tập');
      setToastType('error');
      setToastVisible(true);
      return;
    }

    const fetchAISummary = async (workoutSessionId: string) => {
      try {
        const workout = await workoutSessionService.getById(workoutSessionId);
        const [feedback, mistakeLog, heartRateLogs] = await Promise.all([
          workoutFeedbackService.getByWorkoutSessionId(workoutSessionId),
          mistakeLogService.getByWorkoutSessionId(workoutSessionId),
          heartRateService.getByWorkoutSessionId(workoutSessionId),
        ]);

        navigation.navigate('AISummary', {
          feedback,
          videoUrl: workout.recordUrl,
          mistakeLog,
          heartRateLogs: heartRateLogs.map(h => ({
            heartRate: h.heartRate,
            recordedAt: h.recordedAt,
          })),
        });
      } catch (err) {
        console.error('Fetch AI summary error:', err);
      } finally {
      }
    };

    try {
      // Lấy danh sách workout sessions của bài tập này
      const sessions = await workoutSessionService.getByExerciseId(String(exerciseId), {
        personalExerciseId: personalExerciseId ? String(personalExerciseId) : undefined,
      });
      console.log('Sessions for exercise', exerciseId, sessions);
      // Lọc ra sessions có AI tracking và đã hoàn thành
      const aiSessions = sessions.filter(s => s.haveAITracking === true && s.completed === true);
      console.log('AI sessions completed', aiSessions);
      if (aiSessions.length === 0) {
        setToastMessage('Không tìm thấy phiên tập AI đã hoàn thành');
        setToastType('info');
        setToastVisible(true);
        return;
      }

      // Lấy session gần nhất (theo thời gian kết thúc)
      const latestSession = aiSessions.sort((a, b) => {
        const timeA = new Date(a.endTime || a.startTime).getTime();
        const timeB = new Date(b.endTime || b.startTime).getTime();
        return timeB - timeA;
      })[0];

      // Fetch feedback cho session này
      const feedback = await workoutSessionService.getfeedbackWorkout(latestSession.workoutSessionId);

      // Fetch heart rate logs nếu có
      let heartRateLogs: any[] = [];
      try {
        heartRateLogs = await heartRateService.getByWorkoutSessionId(latestSession.workoutSessionId);
      } catch (err) {
        console.warn('[ScheduleDetail] heart rate logs fetch failed', err);
      }

      // Fetch mistake logs nếu có
      let mistakeLog: any[] = [];
      try {
        mistakeLog = await mistakeLogService.getByWorkoutSessionId(latestSession.workoutSessionId);


      } catch (err) {
        console.warn('[ScheduleDetail] mistake logs fetch failed', err);
      }

      if (typeof onVideoModalChange === 'function') onVideoModalChange(false);

      const formattedMistakes = mistakeLog.map(log => {
        // Trích xuất side từ chuỗi details (vd: lấy chữ "both" từ "Form error at Hips (both)")
        const sideMatch = log.details.match(/\(([^)]+)\)/);
        const side = sideMatch ? sideMatch[1] : "unknown";

        return {
          bodyPart: log.bodyPartName,
          side: side,
          recordedAtSecond: log.recordedAtSecond,
          duration: log.duration,
          imagePath: log.imageUrl
        };
      });

      navigation.navigate('AISummary', {
        feedback,
        videoUrl: latestSession.recordUrl,
        mistakeLog: formattedMistakes,
        heartRateLogs,
      });
    } catch (err) {
      console.warn('[ScheduleDetail] viewAIReview failed', err);
      setToastMessage('Không thể tải đánh giá AI. Vui lòng thử lại');
      setToastType('error');
      setToastVisible(true);
    }
  };

  return (
    <ScrollView>
      <View className="mx-4 mt-3">
        <Toast
          visible={toastVisible}
          message={toastMessage}
          type={toastType}
          onHidden={() => {
            setToastVisible(false);

            if (shouldGoPackage) {
              setShouldGoPackage(false);

              navigation.navigate('UpgradePlan' as never);
            }
          }}
        />

        <View className="bg-white rounded-2xl border border-gray-100 shadow-lg mb-6">
          <View className="p-4">

            {/* Action Buttons */}
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
                  className={`flex-1 ml-2 rounded-lg py-2 items-center ${aiAllowed ? 'bg-[#8B4513]' : 'bg-gray-300'
                    }`}
                  onPress={startAllAI}
                >
                  <Text
                    style={[
                      modalStyles.btnAiTitle,
                      !aiAllowed && modalStyles.btnAiTitleDisabled,
                    ]}
                  >
                    Bắt đầu AI
                  </Text>
                  <Text
                    style={[
                      modalStyles.btnAiSub,
                      !aiAllowed && modalStyles.btnAiSubDisabled,
                    ]}
                  >
                    Tập với AI
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            <View className="flex-row items-center justify-between mt-2">
              <Text className="text-2xl font-extrabold text-[#3A2A1A] flex-1">
                {schedule.scheduleName}
              </Text>

              {scheduleCompleted && (
                <View className="bg-green-100 rounded-full px-3 py-1 ml-2">
                  <Text className="text-green-700 font-semibold text-xs">
                    Hoàn thành
                  </Text>
                </View>
              )}
            </View>

            <Text className="text-gray-500 mt-1">
              {schedule.dayOfWeek} • {schedule.durationMinutes} phút
            </Text>

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

            {/* Danh sách bài tập theo Trình tự */}
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
                    className={`w-16 h-16 rounded-lg bg-gray-100 ${
                      ex.locked ? 'opacity-50' : ''
                    }`}
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
                          navigation.navigate('ExerciseDetail', {
                            exercise_id: eid,
                          });
                        }
                      }}
                    >
                      <Text
                        className={`text-base font-semibold ${
                          ex.locked ? 'text-gray-400' : 'text-[#3A2A1A]'
                        }`}
                      >
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
                          const eid =
                            ex.exerciseId ??
                            ex.id ??
                            ex.exercise_id ??
                            ex.exerciseIdRaw ??
                            null;

                          if (eid) {
                            navigation.navigate('ExerciseDetail', {
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

                      {!isPreview && ex.completed && supportsAI(ex) && (
                        <TouchableOpacity
                          className="px-3 py-1 rounded-md bg-[#10B981] mr-3"
                          activeOpacity={0.8}
                          onPress={() => viewAIReview(ex)}
                        >
                          <Text style={modalStyles.reviewBtnText}>
                            Xem đánh giá
                          </Text>
                        </TouchableOpacity>
                      )}

                      {!isPreview ? (
                        <TouchableOpacity
                          className={`px-3 py-1 rounded-md ${
                            ex.locked ? 'bg-gray-300' : 'bg-[#8B4513]'
                          }`}
                          activeOpacity={0.8}
                          disabled={ex.locked}
                          onPress={() => startAiExercise(ex)}
                        >
                          <Text
                            style={
                              ex.locked
                                ? modalStyles.aiSmallBtnTextDisabled
                                : modalStyles.aiSmallBtnText
                            }
                          >
                            Tập với AI
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
              ))}
            </View>
          </View>
        </View>
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
  editBtnText: { color: '#8B4513', fontWeight: '700' },
  reviewBtnText: { color: '#fff', fontWeight: '600' },
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