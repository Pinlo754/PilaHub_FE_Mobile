import React from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';

type Props = {
  label: string;
  value?: number;
  onPress: () => void;
  style?: any;
};

export default function MeasurementTag({ label, value, onPress, style }: Props) {
  return (
    <Pressable onPress={onPress} style={style}>
      <View style={styles.container}>
        <Text style={styles.label}>{label}</Text>
        {value != null && <Text style={styles.value}>{typeof value === 'number' ? value.toFixed(0) + ' cm' : String(value)}</Text>}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 24, elevation: 3, alignItems: 'center', minWidth: 64 },
  label: { fontWeight: '700', color: '#111' },
  value: { fontSize: 12, color: '#666', marginTop: 2 },
});
