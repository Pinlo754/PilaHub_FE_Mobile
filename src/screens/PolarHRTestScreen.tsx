import React from 'react';
import { SafeAreaView, View, Text, Pressable, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import PolarHeartRate from '../components/PolarHeartRate';
import Ionicons from '@react-native-vector-icons/ionicons';
import { colors } from '../theme/colors';

export default function PolarHRTestScreen() {
  const navigation = useNavigation<any>();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={28} color={colors.foreground} />
        </Pressable>
        <Text style={styles.title}>Polar H10 Test</Text>
      </View>

      <View style={styles.content}>
        <PolarHeartRate />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background.DEFAULT },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  backBtn: { marginRight: 8 },
  title: { fontSize: 18, fontWeight: '700', color: colors.foreground },
  content: { flex: 1, justifyContent: 'center', padding: 16 },
});
