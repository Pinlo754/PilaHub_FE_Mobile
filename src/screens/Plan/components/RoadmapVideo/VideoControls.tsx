import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';

type Props = {
  duration: number;
  currentTime: number;
  onSeek: (t: number) => void;
  onSeekBy: (delta: number) => void;
  onFullscreen: () => void;
  isFullscreen: boolean;
  isPracticeTab: boolean;
  onCompleteReached?: () => void;
};

export default function RoadmapVideoControls({ duration: _duration, currentTime: _currentTime, onSeek: _onSeek, onSeekBy, onFullscreen, isFullscreen, isPracticeTab: _isPracticeTab, onCompleteReached: _onCompleteReached }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <TouchableOpacity onPress={() => onSeekBy(-10)} style={styles.iconBtn}>
          <Ionicons name="play-skip-back" size={20} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onSeekBy(10)} style={styles.iconBtn}>
          <Ionicons name="play-skip-forward" size={20} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={onFullscreen} style={styles.iconBtn}>
          <Ionicons name={isFullscreen ? 'close' : 'resize'} size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', padding: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  iconBtn: { padding: 8 },
});
