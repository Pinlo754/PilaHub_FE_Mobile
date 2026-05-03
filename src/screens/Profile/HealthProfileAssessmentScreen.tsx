import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { fetchHealthProfileAssessment } from '../../services/profile';
import ProgressCircle from '../../components/ProgressCircle';
import IconInfo from './components/IconInfo';

const RISK_TYPE_MAP: Record<string, string> = {
  INJURY: 'Chấn thương',
  HEALTH: 'Sức khỏe',
  PERFORMANCE: 'Hiệu suất tập luyện',
};

const SEVERITY_MAP: Record<string, string> = {
  LOW: 'Thấp',
  MODERATE: 'Trung bình',
  HIGH: 'Cao',
  CRITICAL: 'Cấp thiết',
};

const RECOMM_KEY_MAP: Record<string, string> = {
  training: 'Tập luyện',
  nutrition: 'Dinh dưỡng',
  lifestyle: 'Lối sống',
  injuryPrevention: 'Phòng tránh chấn thương',
};

const LEVEL_MAP: Record<string, string> = {
  POOR: 'Cần cải thiện',
  AVERAGE: 'Trung bình',
  GOOD: 'Tốt',
  EXCELLENT: 'Xuất sắc',
};

type ReturnToAfterAssessment =
  | string
  | {
      root: string;
      screen?: string;
      params?: any;
    };

type RouteParams = {
  healthProfileId: string;
  returnToAfterAssessment?: ReturnToAfterAssessment;
};

function translateAssessment(raw: any) {
  const d = raw?.data ?? raw ?? {};

  const score = d?.score ?? null;

  const level =
    LEVEL_MAP[String(d?.healthProfileLevel)] ??
    d?.healthProfileLevel ??
    null;

  const highlights = (d?.highlights ?? []).map((h: any) => ({
    title: h?.title ?? '',
    description: h?.description ?? '',
    relatedMetrics: h?.relatedMetrics ?? [],
  }));

  const risks = (d?.risks ?? []).map((r: any) => ({
    riskType: RISK_TYPE_MAP[String(r?.riskType)] ?? r?.riskType ?? '',
    severity: SEVERITY_MAP[String(r?.severity)] ?? r?.severity ?? '',
    description: r?.description ?? '',
    affectedBodyParts: r?.affectedBodyParts ?? [],
  }));

  const recommendationsRaw = d?.recommendations ?? {};
  const recommendations: Record<string, any[]> = {};

  Object.keys(recommendationsRaw || {}).forEach((k) => {
    const vk = RECOMM_KEY_MAP[k] ?? k;

    recommendations[vk] = Array.isArray(recommendationsRaw[k])
      ? recommendationsRaw[k]
      : [];
  });

  return {
    score,
    level,
    highlights,
    risks,
    recommendations,
    explanations: d?.explanations ?? null,
    confidenceScore: d?.confidenceScore ?? null,
    aiModel: d?.aiModel ?? null,
    assessedAt: d?.assessedAt ?? null,
  };
}

function ScoreCard({
  score,
  level,
}: {
  score: number | null;
  level?: string | null;
}) {
  const s =
    typeof score === 'number' && !isNaN(score)
      ? Math.max(0, Math.min(100, Math.round(score)))
      : null;

  return (
    <View className="bg-white rounded-3xl p-5 shadow">
      <View className="items-center">
        <View style={styles.circleWrap}>
          <ProgressCircle
            size={110}
            strokeWidth={10}
            bgColor="#f3f4f6"
            progressColor="#b5651d"
            percent={s ?? 0}
          />

          <View style={styles.circleOverlay} pointerEvents="none">
            <Text className="text-2xl font-extrabold text-foreground">
              {s ?? '-'}
            </Text>
            <Text className="text-sm text-gray-500">/ 100</Text>
          </View>
        </View>

        <Text className="text-md text-gray-500 mt-3">
          {level ?? 'Mức chung'}
        </Text>
      </View>
    </View>
  );
}

export default function HealthProfileAssessmentScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();

  const { healthProfileId, returnToAfterAssessment } =
    (route.params || {}) as RouteParams;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const goAfterAssessment = () => {
    try {
      console.log(
        'HealthProfileAssessment returnToAfterAssessment:',
        returnToAfterAssessment,
      );

      if (returnToAfterAssessment) {
        /**
         * Case 1:
         * returnToAfterAssessment = 'BodyMetricDetails'
         */
        if (typeof returnToAfterAssessment === 'string') {
          (navigation as any).reset({
            index: 0,
            routes: [{ name: returnToAfterAssessment }],
          });
          return;
        }

        /**
         * Case 2:
         * returnToAfterAssessment = {
         *   root: 'MainTabs',
         *   screen: 'Roadmap',
         *   params: ...
         * }
         */
        if (
          typeof returnToAfterAssessment === 'object' &&
          returnToAfterAssessment.root
        ) {
          (navigation as any).reset({
            index: 0,
            routes: [
              {
                name: returnToAfterAssessment.root,
                params: {
                  screen: returnToAfterAssessment.screen ?? 'Home',
                  params: returnToAfterAssessment.params ?? undefined,
                },
              },
            ],
          });
          return;
        }
      }

      /**
       * Default:
       * không có return target thì về Home tab
       */
      (navigation as any).reset({
        index: 0,
        routes: [
          {
            name: 'MainTabs',
            params: { screen: 'Home' },
          },
        ],
      });
    } catch (err) {
      console.log('goAfterAssessment error:', err);

      try {
        if (
          returnToAfterAssessment &&
          typeof returnToAfterAssessment === 'object' &&
          returnToAfterAssessment.root
        ) {
          navigation.navigate(returnToAfterAssessment.root as any, {
            screen: returnToAfterAssessment.screen ?? 'Home',
            params: returnToAfterAssessment.params ?? undefined,
          });
          return;
        }

        if (
          returnToAfterAssessment &&
          typeof returnToAfterAssessment === 'string'
        ) {
          navigation.navigate(returnToAfterAssessment as any);
          return;
        }

        navigation.navigate('MainTabs' as any, { screen: 'Home' });
      } catch {
        // noop
      }
    }
  };

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

    return () => {
      mounted = false;
    };
  }, [healthProfileId]);

  const translated = translateAssessment(data);
  const level = translated?.level ?? null;
  const score = translated?.score ?? null;
  const highlights = translated?.highlights ?? [];
  const risks = translated?.risks ?? [];
  const recommendations = translated?.recommendations ?? {};

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center px-4 py-4 bg-white border-b border-gray-100">
        <View className="w-10" />

        <Text
          numberOfLines={1}
          className="flex-1 text-lg font-semibold text-center"
        >
          Đánh giá hồ sơ
        </Text>

        <View className="w-10" />
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        {loading ? (
          <View className="p-6 items-center">
            <ActivityIndicator size="large" color="#b5651d" />
          </View>
        ) : error ? (
          <View className="p-6">
            <Text className="text-red-600">{error}</Text>
          </View>
        ) : data ? (
          <View className="p-4 space-y-5">
            <ScoreCard
              score={typeof score === 'string' ? Number(score) : score}
              level={level}
            />

            <View className="bg-amber-50 rounded-3xl p-5 mt-3 shadow">
              <Text className="font-semibold text-yellow-400">
                Điểm nổi bật
              </Text>

              <View className="mt-3 space-y-3">
                {highlights.map((h: any, idx: number) => (
                  <IconInfo
                    key={h?.id ?? h?.title ?? `highlight-${idx}`}
                    title={h.title}
                    description={h.description}
                  />
                ))}
              </View>
            </View>

            <View className="bg-red-300 rounded-3xl p-5 mt-3 shadow">
              <Text className="font-semibold text-red-600">Rủi ro</Text>

              <View className="mt-3 space-y-3">
                {risks.length === 0 ? (
                  <Text className="text-sm text-gray-600">
                    Không phát hiện rủi ro lớn.
                  </Text>
                ) : (
                  risks.map((r: any, idx: number) => (
                    <IconInfo
                      key={
                        r?.id ??
                        `${r?.riskType ?? 'risk'}-${r?.severity ?? idx}`
                      }
                      title={`${r.riskType} — ${r.severity}`}
                      description={r.description}
                    />
                  ))
                )}
              </View>
            </View>

            <View className="bg-emerald-50 rounded-3xl p-5 mt-3 shadow">
              <Text className="font-semibold text-emerald-700">
                Khuyến nghị
              </Text>

              <View className="mt-3 space-y-2">
                {Object.entries(recommendations).length === 0 ? (
                  <Text className="text-sm text-gray-600">
                    Không có khuyến nghị cụ thể.
                  </Text>
                ) : (
                  Object.entries(recommendations).map(([k, arr]: any) => (
                    <View
                      key={k}
                      className="p-3 mt-2 bg-white rounded-lg shadow-sm border border-emerald-100"
                    >
                      <Text className="font-bold text-sm text-emerald-900">
                        {k}
                      </Text>

                      {(arr ?? []).map((s: string, idx: number) => (
                        <Text key={idx} className="text-sm text-gray-600 mt-1">
                          • {s}
                        </Text>
                      ))}
                    </View>
                  ))
                )}
              </View>
            </View>

            <View className="h-16" />

            <View className="px-4 mt-3">
              <TouchableOpacity onPress={goAfterAssessment} style={styles.okBtn}>
                <Text style={styles.okBtnText}>
                  {returnToAfterAssessment ? 'Tiếp tục' : 'Về trang chính'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View className="p-6">
            <Text>Không có dữ liệu đánh giá.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 120 },
  circleWrap: { width: 110, height: 110 },
  circleOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  okBtn: {
    backgroundColor: '#A0522D',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  okBtnText: { color: '#fff', fontWeight: '700' },
});