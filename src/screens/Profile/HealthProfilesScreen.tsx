import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, Pressable, ActivityIndicator, ScrollView, Alert, StyleSheet } from 'react-native';
import { fetchMyHealthProfiles, fetchHealthProfileById } from '../../services/profile';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import Ionicons from '@react-native-vector-icons/ionicons';

const HealthProfilesScreen: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const navigation = useNavigation<NavigationProp<any>>();

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
      <View className="flex-row items-center justify-between mb-3">
        <Pressable onPress={() => navigation.goBack()} style={styles.headerBtn}><Ionicons name="arrow-back" size={22} color="#333" /></Pressable>
        <Text className="text-xl font-bold text-center flex-1">Thông tin cơ thể</Text>
        <View className="w-8" />
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
                        (navigation as any).navigate('BodyGramResult', { measurements, rawResponse: { entry: data, metadata } });
                        // add action: View AI assessment
                        // show small button to open assessment screen
                        // navigation to HealthProfileAssessment expects healthProfileId
                        // we'll add a navigable text on the right (below 'Mở')
                        // update selected locally so list highlight follows selection
                        setSelected(data);
                        
                      } catch {
                        Alert.alert('Lỗi', 'Không tải được hồ sơ chi tiết');
                      }
                    }} className={`p-3 rounded-lg ${selected === p ? 'bg-amber-50' : 'bg-white'} mb-2 shadow`}>
                    <View className="flex-row justify-between items-center">
                      <View>
                        {/* Title: latest profile shows as 'Hồ sơ hiện tại', others show date */}
                        {(() => {
                          const createdAt = new Date(p.createdAt ?? p.created_at ?? Date.now());
                          // Format like: '17 Tháng 4 2026'
                          const day = createdAt.getDate();
                          const month = createdAt.getMonth() + 1;
                          const year = createdAt.getFullYear();
                          const dateLabel = `${day} Tháng ${month} ${year}`;
                          const titleText = p.isLatest ? 'Hồ sơ hiện tại' : `Hồ sơ ${dateLabel}`;
                          return (
                            <>
                              <Text className="font-semibold">{titleText}</Text>
                              <Text className="text-sm text-gray-500">{new Date(p.createdAt ?? p.created_at ?? Date.now()).toLocaleString()}</Text>
                            </>
                          );
                        })()}
                      </View>
                      <View className="flex-row items-center">
                        {p.isLatest ? (
                          <View className="bg-amber-700 px-2 py-1 rounded-full mr-2">
                            <Text className="text-xs text-white font-semibold">MỚI NHẤT</Text>
                          </View>
                        ) : null}
                        <Text className="text-amber-700">Mở</Text>
                        <Pressable onPress={() => (navigation as any).navigate('HealthProfileAssessment', { healthProfileId: p.healthProfileId ?? p.id })} className="ml-3 px-2 py-1 bg-amber-50 rounded">
                          <Text className="text-amber-700 text-sm">Đánh giá</Text>
                        </Pressable>
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
const styles = StyleSheet.create({
  headerBtn: {
    padding: 8,
  },
});
export default HealthProfilesScreen;
