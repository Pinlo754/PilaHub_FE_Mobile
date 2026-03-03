import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, Pressable, ActivityIndicator, ScrollView, Alert } from 'react-native';
import { fetchMyHealthProfiles, fetchHealthProfileById } from '../../services/profile';
import { useNavigation } from '@react-navigation/native';

const HealthProfilesScreen: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const navigation = useNavigation();

  // details are shown in ResultScreen when user opens a profile

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const res = await fetchMyHealthProfiles();
        if (res.ok) {
          const data = Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
          if (mounted) {
            setProfiles(data || []);
            setSelected((data && data.length > 0) ? data[0] : null);
          }
        } else {
          if (mounted) setProfiles([]);
        }
      } catch {
        if (mounted) setProfiles([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-background p-4">
      <View className="flex-row justify-between items-center mb-3">
        <Text className="text-xl font-bold">Thông tin cơ thể</Text>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
        </View>
      ) : (
        <ScrollView>
          {profiles.length === 0 ? (
            <View className="py-6">
              <Text className="text-center text-gray-500">Không tìm thấy hồ sơ sức khỏe nào.</Text>
            </View>
          ) : (
            <View>
              <View className="mb-3">
                {profiles.map((p, idx) => (
                  <Pressable key={p.healthProfileId ?? p.id ?? idx} onPress={async () => {
                      try {
                        const res = await fetchHealthProfileById(p.healthProfileId ?? p.id);
                        if (!res.ok) {
                          Alert.alert('Lỗi', 'Không tải được hồ sơ chi tiết');
                          return;
                        }
                        const data = res.data ?? res;
                        let metadata: any = {};
                        try { if (typeof data.metadata === 'string') metadata = JSON.parse(data.metadata); else metadata = data.metadata ?? {}; } catch { metadata = {}; }
                        const measurements = data.measurements ?? metadata.measurements ?? [];
                        (navigation as any).navigate('Result', { measurements, rawResponse: { entry: data, metadata } });
                        // update selected locally so list highlight follows selection
                        setSelected(data);
                      } catch {
                        Alert.alert('Lỗi', 'Không tải được hồ sơ chi tiết');
                      }
                    }} className={`p-3 rounded-lg ${selected === p ? 'bg-amber-50' : 'bg-white'} mb-2 shadow`}>
                    <View className="flex-row justify-between items-center">
                      <View>
                        <Text className="font-semibold">{p.name ?? `Hồ sơ ${idx+1}`}</Text>
                        <Text className="text-sm text-gray-500">{new Date(p.createdAt ?? p.created_at ?? Date.now()).toLocaleString()}</Text>
                      </View>
                      <View className="flex-row items-center">
                        {p.isLatest ? (
                          <View className="bg-amber-700 px-2 py-1 rounded-full mr-2">
                            <Text className="text-xs text-white font-semibold">MỚI NHẤT</Text>
                          </View>
                        ) : null}
                        <Text className="text-amber-700">Mở</Text>
                      </View>
                    </View>
                  </Pressable>
                ))}
              </View>

              <View className="mt-4">
                <Text className="text-sm text-gray-500">Chọn một hồ sơ để xem chi tiết đầy đủ.</Text>
              </View>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

export default HealthProfilesScreen;
