import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, SafeAreaView } from 'react-native';
import { fetchMyInjuries } from '../../services/profile';

const MyInjuriesScreen: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [injuries, setInjuries] = useState<any[]>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetchMyInjuries();
        if (mounted && res.ok) {
          setInjuries(res.data ?? []);
        }
      } catch (e) {
        // ignore
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  if (loading) return (
    <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator />
    </SafeAreaView>
  );

  if (!injuries || injuries.length === 0) return (
    <SafeAreaView style={{ flex: 1, padding: 20 }}>
      <Text>Bạn chưa có chấn thương cá nhân nào.</Text>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <FlatList
        data={injuries}
        keyExtractor={(i) => i.personalInjuryId ?? i.id}
        renderItem={({ item }) => (
          <View style={{ padding: 16, borderBottomWidth: 1, borderColor: '#eee' }}>
            <Text style={{ fontWeight: '600' }}>{item.injury?.name ?? item.injuryName ?? 'Chấn thương'}</Text>
            {item.notes ? <Text style={{ marginTop: 8 }}>{item.notes}</Text> : null}
            <Text style={{ marginTop: 8, color: '#666' }}>Trạng thái: {item.status ?? item.injuryStatus}</Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
};

export default MyInjuriesScreen;
