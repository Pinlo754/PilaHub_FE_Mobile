import React, { useEffect, useState } from 'react';
import { SafeAreaView, View, Text, ActivityIndicator, Pressable, StyleSheet, Alert } from 'react-native';
import { fetchPersonalInjuryById } from '../../services/profile';
import { useRoute, useNavigation } from '@react-navigation/native';

// This detail screen expects personalInjuryId passed via route params
const PersonalInjuryDetail: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { personalInjuryId } = (route.params as any) ?? {};
  const [loading, setLoading] = useState(true);
  const [injury, setInjury] = useState<any>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // For now backend does not expose a dedicated endpoint to fetch personal injury by id at client (there is GET /personal-injuries/{id})
        // We'll attempt to call it via profile service if available; otherwise fallback to navigation params
        if (personalInjuryId) {
          const r = await fetchPersonalInjuryById(personalInjuryId);
          if (mounted && r.ok) setInjury(r.data ?? r);
        } else {
          Alert.alert('Lỗi', 'Không có ID chấn thương');
        }
      } catch (e) {
        // ignore
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [personalInjuryId]);

  if (loading) return (
    <SafeAreaView style={styles.center}>
      <ActivityIndicator />
    </SafeAreaView>
  );

  if (!injury) return (
    <SafeAreaView style={styles.container}>
      <Text>Không tìm thấy chấn thương</Text>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        <Text style={styles.title}>{injury.injury?.name ?? injury.injuryName}</Text>
        <Text style={styles.paragraph}>{injury.injury?.description ?? injury.description}</Text>
        {injury.notes ? <Text style={styles.notes}>Ghi chú: {injury.notes}</Text> : null}

        <View style={{ marginTop: 24 }}>
          <Pressable onPress={() => (navigation as any).goBack()}>
            <Text style={styles.close}>Đóng</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1, padding: 20 },
  inner: { padding: 20 },
  title: { fontSize: 20, fontWeight: '700' },
  paragraph: { marginTop: 12 },
  notes: { marginTop: 12, fontStyle: 'italic' },
  close: { color: '#007AFF' },
});

export default PersonalInjuryDetail;
