import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useBle } from "../../../services/BleProvider";

const TraineeHeartRateDisplay = React.memo(() => {
  const { hr, isIotDeviceConnected } = useBle();

  return (
    <View style={styles.bleContainer}>
      <View style={styles.hrBadge}>
        <Text style={styles.hrBadgeText}>
          {isIotDeviceConnected ? '❤️ Nhịp tim' : ''}
        </Text>
      </View>
      <View style={{ marginTop: 8, alignItems: 'center' }}>
        <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>
          {hr ? `${hr} bpm` : ''}
        </Text>
      </View>
    </View>
  );
});

export default TraineeHeartRateDisplay;
const styles = StyleSheet.create({
  remoteSurface: { flex: 1 },
  hrOverlay: { position: 'absolute', top: 100, left: 12, zIndex: 50 },
  hrCard: { backgroundColor: 'rgba(0,0,0,0.6)', padding: 8, borderRadius: 8 },
  hrLabel: { color: '#fff', fontWeight: '700', fontSize: 18 },
  hrValue: { color: '#fff', fontSize: 20 },
  localVideoContainer: {
    position: 'absolute',
    width: 120,
    height: 180,
    top: 145,
    right: 10,
    borderRadius: 10,
    overflow: 'hidden',
    zIndex: 10,
  },
  localVideoSurface: { width: '100%', height: '100%' },
  bleContainer: { position: 'absolute', left: 8, bottom: 8 },
  hrBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  hrBadgeText: { color: '#fff', fontSize: 10, fontWeight: '600' },
});