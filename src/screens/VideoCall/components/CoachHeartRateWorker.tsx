import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  bpm: number | undefined;
  hrIsConnected: boolean;
}

// Sử dụng React.memo để cô lập việc re-render
const CoachHeartRateMonitor = React.memo(({ bpm, hrIsConnected }: Props) => {
  console.log('[CoachMonitor] Re-rendered với BPM:', bpm);

  return (
    <View style={styles.hrOverlay}>
      <View style={styles.hrCard}>
        <Text style={styles.hrLabel}>HR HỌC VIÊN</Text>
        <Text style={styles.hrValue}>
          {bpm ? bpm : '--'} <Text style={{fontSize: 14}}>bpm</Text>
        </Text>
        <View style={styles.statusRow}>
          <View style={[styles.dot, { backgroundColor: hrIsConnected ? '#4ADE80' : '#EF4444' }]} />
          <Text style={styles.hrDebugText}>
            {hrIsConnected ? 'Đã kết nối' : 'Mất kết nối'}
          </Text>
        </View>
      </View>
    </View>
  );
});

export default CoachHeartRateMonitor;

const styles = StyleSheet.create({
  hrOverlay: { position: 'absolute', top: 100, left: 16, zIndex: 100 },
  hrCard: { 
    backgroundColor: 'rgba(0,0,0,0.7)', 
    padding: 12, 
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)'
  },
  hrLabel: { color: 'rgba(255,255,255,0.8)', fontWeight: '600', fontSize: 12, marginBottom: 4 },
  hrValue: { color: '#fff', fontSize: 28, fontWeight: 'bold' },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  dot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  hrDebugText: { color: 'rgba(255,255,255,0.5)', fontSize: 10 },
});