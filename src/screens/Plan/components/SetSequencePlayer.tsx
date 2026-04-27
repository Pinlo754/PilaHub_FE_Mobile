import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import VideoPlayer from '../../AIPractice/components/VideoPlayer/VideoPlayer';

type Props = {
  source?: string | null | undefined;
  isVideoPlay?: boolean;
  togglePlayButton?: () => void;
  sets?: number; // number of sets to perform
  durationSeconds?: number | null; // how long each set should run (seconds)
  restSeconds?: number | null; // rest between sets (seconds)
  onComplete?: () => void; // called when all sets finished
};

export default function SetSequencePlayer({
  source,
  isVideoPlay = true,
  togglePlayButton,
  sets = 1,
  durationSeconds = null,
  restSeconds = 0,
  onComplete,
}: Props) {
  const [currentSet, setCurrentSet] = useState<number>(0);
  const [isResting, setIsResting] = useState<boolean>(false);
  const [restLeft, setRestLeft] = useState<number>(Number(restSeconds ?? 0));
  const durationTimer = useRef<any>(null);
  const restTimer = useRef<any>(null);

  useEffect(() => {
    // reset when source changes
    setCurrentSet(0);
    setIsResting(false);
    setRestLeft(Number(restSeconds ?? 0));
    clearTimers();
    // auto-start handled by parent via isVideoPlay prop
    return () => clearTimers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source]);

  function clearTimers() {
    if (durationTimer.current) {
      clearTimeout(durationTimer.current);
      durationTimer.current = null;
    }
    if (restTimer.current) {
      clearInterval(restTimer.current);
      restTimer.current = null;
    }
  }

  // Called when a set should start playing
  function startSet() {
    // ensure resting flag off
    setIsResting(false);
    // If durationSeconds provided, schedule a timeout to end this set
    if (durationSeconds && durationSeconds > 0) {
      durationTimer.current = setTimeout(() => {
        onSetFinished();
      }, durationSeconds * 1000);
    }
    // otherwise rely on VideoPlayer onEnd to trigger onSetFinished (parent should wire)
  }

  function onSetFinished() {
    clearTimers();
    const nextSet = currentSet + 1;
    if (nextSet < sets) {
      // start rest period
      const rest = Number(restSeconds ?? 0) || 0;
      if (rest > 0) {
        setIsResting(true);
        setRestLeft(rest);
        let left = rest;
        restTimer.current = setInterval(() => {
          left -= 1;
          setRestLeft(left);
          if (left <= 0) {
            clearTimers();
            setCurrentSet(nextSet);
            setIsResting(false);
            // small tick before starting next set
            setTimeout(() => startSet(), 250);
          }
        }, 1000);
      } else {
        setCurrentSet(nextSet);
        // immediately start next set
        setTimeout(() => startSet(), 100);
      }
    } else {
      // finished all sets
      if (typeof onComplete === 'function') onComplete();
    }
  }

  // Expose handler when underlying video ends (for duration-less flows)
  function handleVideoOnEnd() {
    if (durationSeconds && durationSeconds > 0) {
      // ignore video end, rely on duration timer
      return;
    }
    // otherwise treat as set finished
    onSetFinished();
  }

  // If auto-playing and not resting, and duration-based, ensure set timeout started
  useEffect(() => {
    if (isResting) return;
    if (!source) return;
    // start set when appropriate
    startSet();
    return () => clearTimers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSet, source]);

  return (
    <View style={styles.container}>
      <VideoPlayer
        source={String(source ?? '')}
        isVideoPlay={!isResting && isVideoPlay}
        togglePlayButton={togglePlayButton}
        onEnd={handleVideoOnEnd}
      />

      {/* overlay: show set counter and rest countdown */}
      <View style={styles.overlay} pointerEvents="none">
        <Text style={styles.setText}>Bộ: {Math.min(currentSet + 1, sets)}/{sets}</Text>
        {isResting && (
          <View style={styles.restBox}>
            <Text style={styles.restText}>Nghỉ: {restLeft}s</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, width: '100%' },
  overlay: { position: 'absolute', top: 12, left: 12, right: 12, alignItems: 'flex-start' },
  setText: { color: '#fff', fontWeight: '700', backgroundColor: 'rgba(0,0,0,0.4)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  restBox: { marginTop: 8, backgroundColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  restText: { color: '#fff', fontWeight: '700' },
});
