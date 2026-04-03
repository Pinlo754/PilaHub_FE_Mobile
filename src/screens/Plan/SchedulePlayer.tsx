import React, { useState, useEffect, useMemo } from 'react';
import { SafeAreaView, View, Text, TouchableOpacity, StyleSheet, Alert, DeviceEventEmitter } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import VideoPlayer from '../ExerciseDetail/components/VideoPlayer/VideoPlayer';
import api from '../../hooks/axiosInstance';
import { markPersonalExerciseCompleted } from '../../services/personalExercise.service';
import { markPersonalScheduleCompleted } from '../../services/personalSchedule.service';
import Ionicons from '@react-native-vector-icons/ionicons';
import Toast from '../../components/Toast';

// Screen wrapper to play a queue of exercises sequentially (free-play mode)
// Params expected: queue: Array<{ exercise: any, videoSrc?: string }>, startIndex?: number

export default function SchedulePlayer() {
  const route: any = useRoute();
  const navigation: any = useNavigation();

  const queue = useMemo(() => (Array.isArray(route.params?.queue) ? route.params.queue : []), [route.params?.queue]);
  const startIndex = Number(route.params?.startIndex ?? 0);

  const [index, setIndex] = useState(startIndex);
  const [current, setCurrent] = useState<any>(queue[startIndex] ?? null);
  const [isVideoPlay, setIsVideoPlay] = useState<boolean>(true);
  // start not-expanded so bottom controls are accessible
  const [isVideoExpand, setIsVideoExpand] = useState<boolean>(false);
  const [isPracticeTab] = useState<boolean>(true);
  const [duration, setDuration] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  // debug toast state
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');

  // progress fraction (0..1) computed as a hook and placed before any early return
  const progressFraction = useMemo(() => {
    return duration > 0 ? Math.max(0, Math.min(1, (currentTime / duration))) : 0;
  }, [currentTime, duration]);

  // helper to navigate to a specific index and reset playback state
  const goTo = (idx: number) => {
    const clamped = Math.max(0, Math.min(queue.length - 1, idx));
    console.log('[SchedulePlayer] goTo', clamped);
    setIndex(clamped);
    const nextItem = queue[clamped] ?? null;
    setCurrent(nextItem);
    // reset timers
    setDuration(0);
    setCurrentTime(0);
    // start playing if there is a video source
    setIsVideoPlay(Boolean(nextItem?.videoSrc));
  };

  useEffect(() => {
    // keep current in sync if queue changes externally
    const item = queue[index] ?? null;
    setCurrent(item);
    // ensure play state follows the available source
    setIsVideoPlay(Boolean(item?.videoSrc));
    // reset timers when item changes
    setDuration(0);
    setCurrentTime(0);
  }, [index, queue]);

  if (!current) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={28} color="#3A2A1A" />
          </TouchableOpacity>
        </View>
        <View style={styles.center}>
          <Text>Không có bài nào để phát</Text>
        </View>
      </SafeAreaView>
    );
  }

  const onEnd = async () => {
    console.log('[SchedulePlayer] onEnd index', index, 'queueLen', queue.length);
    const personalId = current?.ex?.personalExerciseId ?? current?.ex?.id ?? current?.ex?.exerciseId ?? null;
    console.log('[SchedulePlayer] current personalId', personalId, 'current item', current);

    // Optimistic: emit exercise completed and advance to next immediately
    if (personalId) {
      console.log('[SchedulePlayer] emitting exerciseCompleted', personalId);
      DeviceEventEmitter.emit('exerciseCompleted', { personalExerciseId: personalId });
      setToastMessage('Hoàn thành động tác');
      setToastType('success');
      setToastVisible(true);
    }

    const next = index + 1;
    if (next < queue.length) {
      // advance immediately so UI shows next video and ticks update
      goTo(next);

      // call API in background (do not block navigation)
      if (personalId) {
        console.log('[SchedulePlayer] calling markPersonalExerciseCompleted', personalId);
        markPersonalExerciseCompleted(personalId)
          .then((r) => console.log('[SchedulePlayer] markPersonalExerciseCompleted response', r))
          .catch((e) => {
            console.warn('markPersonalExerciseCompleted failed', e);
            setToastMessage('Không thể cập nhật trạng thái bài tập');
            setToastType('error');
            setToastVisible(true);
          });
      }
      return;
    }

    // finished all: optimistic schedule complete + notify
    const scheduleId = route.params?.scheduleId ?? null;
    if (scheduleId) {
      console.log('[SchedulePlayer] emitting scheduleCompleted', scheduleId);
      DeviceEventEmitter.emit('scheduleCompleted', { scheduleId });
      // call API in background
      markPersonalScheduleCompleted(scheduleId)
        .then((r) => console.log('[SchedulePlayer] markPersonalScheduleCompleted response', r))
        .catch((e) => {
          console.warn('markPersonalScheduleCompleted failed', e);
          setToastMessage('Không thể cập nhật lịch tập');
          setToastType('error');
          setToastVisible(true);
        });
    }

    // Reconcile with server: ensure all personal exercises in the queue are marked,
    // then fetch latest server state and emit events so ScheduleDetail updates reliably.
    (async () => {
      try {
        if (!scheduleId) return;

        // fetch current server state for exercises in this schedule
        console.log('[SchedulePlayer] reconcile: fetching server exercises for schedule', scheduleId);
        const res = await api.get(`/personal-exercises/schedule/${scheduleId}`);
        console.log('[SchedulePlayer] reconcile: server response', res?.data);
        const serverExercises = Array.isArray(res?.data?.data) ? res.data.data : [];

        // collect ids already marked on server
        const doneSet = new Set(serverExercises.filter((e: any) => e.completed === true).map((e: any) => e.personalExerciseId ?? e.id ?? e.exerciseId));

        // determine which ids from the original queue still need marking
        const queueIds = queue.map((it: any) => it.ex?.personalExerciseId ?? it.ex?.id ?? null).filter(Boolean);
        const toMark = queueIds.filter((id: any) => !doneSet.has(id));
        console.log('[SchedulePlayer] reconcile: queueIds', queueIds, 'doneSet', Array.from(doneSet), 'toMark', toMark);

        if (toMark.length) {
          // try mark them in parallel
          const results = await Promise.allSettled(toMark.map((id: string) => markPersonalExerciseCompleted(id)));
          console.log('[SchedulePlayer] reconcile: mark results', results);
        }

        // refetch server state to be sure
        const res2 = await api.get(`/personal-exercises/schedule/${scheduleId}`);
        console.log('[SchedulePlayer] reconcile: refetch response', res2?.data);
        const serverAfter = Array.isArray(res2?.data?.data) ? res2.data.data : [];

        // emit exerciseCompleted for any server exercise marked complete
        serverAfter.forEach((se: any) => {
          const pid = se.personalExerciseId ?? se.id ?? se.exerciseId ?? null;
          if (pid && (se.completed === true)) {
            console.log('[SchedulePlayer] reconcile: emitting exerciseCompleted for', pid);
            DeviceEventEmitter.emit('exerciseCompleted', { personalExerciseId: pid });
          }
        });

        // if server says all done, emit scheduleCompleted
        const allDoneServer = serverAfter.length === 0 ? true : serverAfter.every((e: any) => e.completed === true);
        if (allDoneServer) {
          console.log('[SchedulePlayer] reconcile: all done on server, emitting scheduleCompleted');
          DeviceEventEmitter.emit('scheduleCompleted', { scheduleId });
        }
      } catch (err) {
        console.warn('[SchedulePlayer] reconcile failed', err);
        setToastMessage('Lỗi khi đồng bộ trạng thái bài tập');
        setToastType('error');
        setToastVisible(true);
      }
    })();

    Alert.alert('Hoàn thành', 'Đã hoàn thành tất cả bài trong lịch');
    if (navigation.canGoBack()) navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* debug toast */}
      <Toast visible={toastVisible} message={toastMessage} type={toastType} onHidden={() => setToastVisible(false)} />
      {/* header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>{route.params?.title ?? 'Lịch tập'}</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* video + controls */}
      <View style={styles.videoWrap}>
        <VideoPlayer
          key={current?.ex?.personalExerciseId ?? index}
          source={current.videoSrc ?? undefined}
          isVideoPlay={isVideoPlay}
          isVideoExpand={isVideoExpand}
          toggleVideoExpand={() => setIsVideoExpand((v) => !v)}
          isPracticeTab={isPracticeTab}
          setIsShowFlag={() => {}}
          hideControls={true}
          personalExerciseId={current.ex?.personalExerciseId}
          personalScheduleId={route.params?.scheduleId}
          onEnd={onEnd}
          onLoad={(d) => setDuration(d)}
          onProgress={(t) => setCurrentTime(t)}
        />
      </View>

      {/* bottom curved controls card */}
      <View style={styles.bottomCardWrap} pointerEvents="box-none">
        <View style={styles.bottomCard}>
          <View style={styles.rowTop}>
            <TouchableOpacity style={styles.prevBtn} onPress={() => { if (index > 0) goTo(index - 1); }}>
              <Ionicons name="caret-back" size={20} color="#3A2A1A" />
              <Text style={styles.prevNextText}>Động tác trước</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.nextBtn} onPress={() => { if (index < queue.length - 1) goTo(index + 1); }}>
              <Text style={styles.prevNextText}>Động tác sau</Text>
              <Ionicons name="caret-forward" size={20} color="#3A2A1A" />
            </TouchableOpacity>
          </View>

          <View style={styles.progressRowAlt}>
            <View style={styles.heartBlock}>
              <Ionicons name="heart" size={18} color="#D9532F" />
              <Text style={styles.heartText}>100 bpm</Text>
            </View>

            <View style={styles.playCenter}>
              <TouchableOpacity
                onPress={() => setIsVideoPlay((v) => !v)}
                style={[styles.playButton, isVideoPlay ? styles.playing : {}]}
              >
                <Ionicons name={isVideoPlay ? 'pause' : 'play'} size={28} color="#8B4513" />
              </TouchableOpacity>
              <Text style={styles.repCountBelow}>10 rep</Text>
            </View>

            <View style={styles.rightSpacer} />
          </View>

          {/* linear progress/time */}
          <View style={styles.timeRow}>
            <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
            <View style={styles.timeBarBg}>
              <View style={[styles.timeBarFill, { flex: progressFraction }]} />
              <View style={[styles.timeBarEmpty, { flex: Math.max(0, 1 - progressFraction) }]} />
            </View>
            <Text style={styles.timeTextLeft}>-{formatTime(Math.max(0, duration - currentTime))}</Text>
          </View>

          <View style={styles.controlsRow}>
            <TouchableOpacity onPress={() => { if (index > 0) goTo(index - 1); }} style={styles.iconControl}>
              <Ionicons name="play-skip-back" size={22} color="#3A2A1A" />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => { if (index < queue.length - 1) goTo(index + 1); }} style={styles.iconControl}>
              <Ionicons name="play-skip-forward" size={22} color="#3A2A1A" />
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
  header: { height: 56, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', position: 'absolute', left: 0, right: 0, top: 0, zIndex: 20, paddingTop: 6 },
  title: { fontSize: 16, fontWeight: '700', color: '#fff' },
  headerSpacer: { width: 40 },
  videoWrap: { height: '58%', backgroundColor: '#000' },
  bottomCardWrap: { flex: 1, justifyContent: 'flex-end' },
  bottomCard: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingVertical: 16, paddingHorizontal: 20, shadowColor: '#000', shadowOpacity: 0.08, shadowOffset: { width: 0, height: -4 }, shadowRadius: 12, elevation: 8 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  prevBtn: { flexDirection: 'row', alignItems: 'center' },
  nextBtn: { flexDirection: 'row', alignItems: 'center' },
  prevNextText: { color: '#3A2A1A', fontSize: 14, marginHorizontal: 6 },
  progressRowAlt: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },
  heartBlock: { flexDirection: 'row', alignItems: 'center' },
  heartText: { color: '#D9532F', marginLeft: 8, fontWeight: '700' },
  progressCenter: { flex: 1, alignItems: 'center' },
  repCount: { fontSize: 34, color: '#E06B3A', fontWeight: '800' },
  repCountBelow: { fontSize: 20, color: '#E06B3A', fontWeight: '800', marginTop: 8 },
  rightSpacer: { width: 40 },
  controlsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
  iconControl: { padding: 8 },
  playButtonWrap: { flex: 1, alignItems: 'center' },
  playButton: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#F3EDE3' },
  playing: { backgroundColor: '#FBEAD8' },
  playCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  timeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  timeText: { color: '#3A2A1A', width: 48 },
  timeTextLeft: { color: '#3A2A1A', width: 48, textAlign: 'right' },
  timeBarBg: { flex: 1, height: 4, backgroundColor: '#EEE', borderRadius: 2, marginHorizontal: 8, flexDirection: 'row', overflow: 'hidden' },
  timeBarFill: { height: 4, backgroundColor: '#8B4513' },
  timeBarEmpty: { height: 4, backgroundColor: 'transparent' },
});

function formatTime(s: number) {
  const sec = Math.floor(s || 0);
  const mm = Math.floor(sec / 60).toString().padStart(2, '0');
  const ss = (sec % 60).toString().padStart(2, '0');
  return `${mm}:${ss}`;
}

// compute progressWidth earlier in the component
