import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, ActivityIndicator, ScrollView, Pressable, StyleSheet, TouchableOpacity } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { fetchHealthProfileAssessment } from '../../services/profile';
import ProgressCircle from '../../components/ProgressCircle';
import IconInfo from './components/IconInfo';

type RouteParams = { healthProfileId: string };

function ScoreCard({ score, level }: { score: number | null; level?:string | null }) {
  const s = typeof score === 'number' && !isNaN(score) ? Math.max(0, Math.min(100, Math.round(score))) : null;
  return (
    <View className="bg-white rounded-3xl p-5 shadow">
      <View className="items-center">
        <View style={styles.circleWrap}>
          <ProgressCircle size={110} strokeWidth={10} bgColor="#f3f4f6" progressColor="#b5651d" percent={s ?? 0} />
          <View style={styles.circleOverlay} pointerEvents="none">
            <Text className="text-2xl font-extrabold text-foreground">{s ?? '-'}</Text>
            <Text className="text-sm text-gray-500">/ 100</Text>
          </View>
        </View>
<Text className="text-md text-gray-500 mt-3">
  {level ?? "Mức chung"}
</Text>

      </View>
    </View>
  );
}

// MiniBarChart removed because it was defined but never used.

export default function HealthProfileAssessmentScreen() {
  const route = useRoute();
  const navigation = useNavigation<any>();
  const { healthProfileId } = (route.params || {}) as RouteParams;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const res = await fetchHealthProfileAssessment(healthProfileId);
        if (!mounted) return;
        if (res.ok) {
          setData(res.data ?? res);
        } else {
          setError(res.error?.message ?? JSON.stringify(res.error ?? 'Lỗi'));
        }
      } catch (e: any) {
        setError(e?.message ?? String(e));
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [healthProfileId]);
  const level = data ? (data.healthProfileLevel?? data.data?.healthProfileLevel?? null): null;
  const score = data ? (data.score ?? data.data?.score ?? null) : null;
  const highlights = data ? (data.data?.highlights ?? data.highlights ?? []) : [];
  const risks = data ? (data.data?.risks ?? data.risks ?? []) : [];
  const recommendations = data ? (data.data?.recommendations ?? data.recommendations ?? {}) : {};

  return (
    <SafeAreaView className="flex-1 bg-background">
  <View className="flex-row items-center px-4 py-4 bg-white border-b border-gray-100">

  {/* Back button */}
  <Pressable
    onPress={() => navigation.goBack()}
    className="w-10 items-center justify-center"
  >
    <Text className="text-xl">‹</Text>
  </Pressable>

  {/* Title */}
  <Text
    numberOfLines={1}
    className="flex-1 text-lg font-semibold text-center"
  >
    Đánh giá hồ sơ
  </Text>

  {/* placeholder */}
  <View className="w-10" />

</View>


      <ScrollView contentContainerStyle={styles.container}>
        {loading ? (
          <View className="p-6 items-center"><ActivityIndicator size="large" color="#b5651d" /></View>
        ) : error ? (
          <View className="p-6"><Text className="text-red-600">{error}</Text></View>
        ) : data ? (
          <View className="p-4 space-y-5">
            <ScoreCard score={typeof score === 'string' ? Number(score) : score} level={level}/>
            <View className="bg-amber-50 rounded-3xl p-5 mt-3 shadow">
              <Text className="font-semibold text-yellow-400">Điểm nổi bật</Text>
              <View className="mt-3 space-y-3">
                {highlights.map((h: any) => (
                    <IconInfo
                      title={h.title}
                      description={h.description}
                    />

                ))}
              </View>
            </View>

            <View className="bg-red-300 rounded-3xl p-5 mt-3 shadow">
              <Text className="font-semibold text-red-600">Rủi ro</Text>
              <View className="mt-3 space-y-3">
                {risks.length === 0 ? <Text className="text-sm text-gray-600">Không phát hiện rủi ro lớn.</Text> : risks.map((r: any) => (
                  <IconInfo
                    title={`${r.riskType} — ${r.severity}`}
                    description={r.description}
                  />

                ))}
              </View>
            </View>

            <View className="bg-emerald-50 rounded-3xl p-5 mt-3 shadow">
              <Text className="font-semibold text-emerald-700">Khuyến nghị</Text>
              <View className="mt-3 space-y-2">
                {Object.entries(recommendations).length === 0 ? (
                  <Text className="text-sm text-gray-600">Không có khuyến nghị cụ thể.</Text>
                ) : (
                  Object.entries(recommendations).map(([k, arr]: any) => (
                    <View key={k} className="p-3 mt-2 bg-white rounded-lg shadow-sm border border-emerald-100">
                      <Text className="font-bold text-sm text-emerald-900">{k}</Text>
                      {(arr ?? []).map((s: string, idx: number) => (
                        <Text key={idx} className="text-sm text-gray-600 mt-1">• {s}</Text>
                      ))}
                    </View>
                  ))
                )}
              </View>
            </View>

            <View className="h-16" />
            {/* Footer action: go to Home tab */}
            <View style={{ paddingHorizontal: 16, marginTop: 12 }}>
              <TouchableOpacity
                onPress={() => {
                  try {
                    (navigation as any).reset({ index: 0, routes: [{ name: 'MainTabs', params: { screen: 'Home' } }] });
                  } catch (e) {
                    try { navigation.navigate('MainTabs' as any, { screen: 'Home' }); } catch {} }
                }}
                style={styles.okBtn}
              >
                <Text style={styles.okBtnText}>OK — Về trang chính</Text>
              </TouchableOpacity>
            </View>
           </View>
         ) : (
          <View className="p-6"><Text>Không có dữ liệu đánh giá.</Text></View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 120 },
  circleWrap: { width: 110, height: 110 },
  circleOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' },
  okBtn: { backgroundColor: '#A0522D', paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  okBtnText: { color: '#fff', fontWeight: '700' },
});



