import React, { useMemo, useRef, useState } from 'react';
import { View, Text, ScrollView, FlatList, TouchableOpacity, Image, Pressable, StyleSheet } from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { useRoadmapStore } from '../../store/roadmap.store';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { SafeAreaView } from 'react-native-safe-area-context';

type RouteProps = RouteProp<RootStackParamList, 'PlanDetail'>;

const placeholderThumb = 'https://via.placeholder.com/80x80.png?text=Exercise';

const PlanDetailScreen: React.FC = () => {
  const route = useRoute<RouteProps>();
  const storeList = useRoadmapStore((s) => s.list);
  const paramRoadmap = (route.params as any)?.roadmap;
  const paramStages = (route.params as any)?.stages;

  const roadmap = paramRoadmap ?? storeList?.[0]?.roadmap ?? null;
  const stages = useMemo(() => (paramStages ?? storeList?.[0]?.stages ?? []), [paramStages, storeList]);

  const [selectedStageIndex, setSelectedStageIndex] = useState(0);
  const [openStages, setOpenStages] = useState<Record<number, boolean>>({});
  const scrollRef = useRef<ScrollView | null>(null);
  const stageListRef = useRef<FlatList<any> | null>(null);
  const ITEM_WIDTH = 140; // estimated width for each stage item in horizontal list

  const totals = useMemo(() => {
    let totalWeeks = 0;
    let totalSessions = 0;
    let totalMinutes = 0;
    if (Array.isArray(stages)) {
      stages.forEach((st: any) => {
        totalWeeks += Number(st.durationWeeks ?? 0);
        const schedules = Array.isArray(st.schedules) ? st.schedules : [];
        totalSessions += schedules.length;
        schedules.forEach((sch: any) => { totalMinutes += Number(sch.durationMinutes ?? 0); });
      });
    }
    return { totalWeeks, totalSessions, totalMinutes };
  }, [stages]);

  if (!roadmap) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 justify-center items-center p-6">
          <Text className="text-lg font-semibold">Không có lộ trình để hiển thị</Text>
          <Text className="text-sm text-secondaryText mt-2 text-center">Bạn có thể tạo lộ trình mới hoặc quay lại trang Lộ trình.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const onSelectStage = (index: number) => {
    // guard index bounds
    const maxIndex = Array.isArray(stages) ? stages.length - 1 : -1;
    if (index < 0 || index > maxIndex) return;

    setSelectedStageIndex(index);
    // scroll main view to the stage card roughly by estimating offset
    const approxY = index * 260;
    try {
      scrollRef.current?.scrollTo({ y: approxY, animated: true });
    } catch (e) {
      // ignore scroll failures
      console.warn('scrollRef.scrollTo failed', e);
    }

    // try to scroll horizontal FlatList safely
    try {
      if (stageListRef.current && typeof stageListRef.current.scrollToIndex === 'function') {
        stageListRef.current.scrollToIndex({ index, animated: true, viewPosition: 0.5 });
      }
    } catch (e) {
      console.warn('scrollToIndex failed, attempting fallback scrollToOffset', e);
      try {
        const offset = Math.max(0, index * ITEM_WIDTH - ITEM_WIDTH);
        stageListRef.current?.scrollToOffset?.({ offset, animated: true });
      } catch (err) {
        console.warn('fallback scrollToOffset also failed', err);
      }
    }
  };

  const toggleStageOpen = (index: number) => {
    setOpenStages(prev => ({ ...prev, [index]: !prev[index] }));
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="p-4">
        {/* Hero header */}
        <View className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <View className="flex-row items-center">
            <View className="flex-1">
              <Text className="text-2xl font-bold">{roadmap.title ?? roadmap.name ?? 'Lộ trình của bạn'}</Text>
              {roadmap.description ? <Text className="text-sm text-secondaryText mt-1">{roadmap.description}</Text> : null}
            </View>
            <View className="ml-4 items-end">
              <Text className="text-xs text-secondaryText">Confidence</Text>
              <View className="mt-1 bg-foreground px-2 py-1 rounded-full">
                <Text className="text-white text-sm font-semibold">{roadmap.confidenceScore ? `${Math.round(roadmap.confidenceScore * 100)}%` : '—'}</Text>
              </View>
            </View>
          </View>

          <View className="flex-row justify-between mt-4">
            <View className="items-center">
              <Text className="text-lg font-semibold">{totals.totalWeeks}</Text>
              <Text className="text-xs text-secondaryText">Tuần</Text>
            </View>
            <View className="items-center">
              <Text className="text-lg font-semibold">{totals.totalSessions}</Text>
              <Text className="text-xs text-secondaryText">Buổi</Text>
            </View>
            <View className="items-center">
              <Text className="text-lg font-semibold">{totals.totalMinutes}</Text>
              <Text className="text-xs text-secondaryText">Phút</Text>
            </View>
          </View>

          {Array.isArray(roadmap.supplementRecommendations) && roadmap.supplementRecommendations.length > 0 && (
            <View className="mt-4 bg-gray-50 p-3 rounded-lg border border-gray-100">
              <Text className="font-semibold">Gợi ý bổ sung</Text>
              {roadmap.supplementRecommendations.map((s: any, i: number) => (
                <View key={i} className="mt-3 flex-row justify-between items-start">
                  <View className="flex-1">
                    <Text className="font-medium">{s.supplementName ?? s.name ?? 'Supplement'}</Text>
                    <Text className="text-xs text-secondaryText mt-1">{s.dosage ? s.dosage + (s.recommendedTiming ? ' • ' + s.recommendedTiming : '') : (s.recommendedTiming ?? '')}</Text>
                    {s.reason ? <Text className="text-sm text-muted mt-1">{s.reason}</Text> : null}
                  </View>
                  <View className="ml-3">
                    <View className={`px-2 py-1 rounded-full ${s.priority === 'HIGH' ? 'bg-red-500' : s.priority === 'MEDIUM' ? 'bg-yellow-500' : 'bg-gray-300'}`}>
                      <Text className="text-white text-xs">{(s.priority ?? '').toString()}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Stage timeline (horizontal) */}
        <View className="mt-4">
          <Text className="text-sm text-secondaryText mb-2">Giai đoạn</Text>
          <FlatList
            ref={stageListRef}
            data={stages}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(_, idx) => String(idx)}
            getItemLayout={(_, index) => ({ length: ITEM_WIDTH, offset: ITEM_WIDTH * index, index })}
            renderItem={({ item, index }) => (
              <TouchableOpacity onPress={() => onSelectStage(index)} className={`mr-3 p-3 rounded-xl border ${selectedStageIndex === index ? 'bg-foreground border-foreground' : 'bg-white border-gray-200'}`}>
                <Text className={`${selectedStageIndex === index ? 'text-white font-semibold' : 'text-black font-medium'}`}>{item.stageName ?? item.name ?? `Giai đoạn ${index + 1}`}</Text>
                <Text className={`${selectedStageIndex === index ? 'text-white' : 'text-secondaryText'} text-xs mt-1`}>{item.durationWeeks ?? '-'} tuần</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </View>

      {/* Main scroll with stage cards */}
      <ScrollView ref={scrollRef} className="px-4" contentContainerStyle={styles.contentContainer}>
        <View className="space-y-4">
          {Array.isArray(stages) && stages.map((st: any, idx: number) => (
            <View key={idx} className={`bg-white rounded-xl p-4 border border-gray-200 ${selectedStageIndex === idx ? 'ring-2 ring-foreground' : ''}`}>
              <View className="flex-row justify-between items-center">
                <View>
                  <Text className="text-lg font-semibold">{st.stageName ?? st.name ?? `Giai đoạn ${idx + 1}`}</Text>
                  <Text className="text-xs text-secondaryText mt-1">{st.durationWeeks ?? '-'} tuần</Text>
                </View>
                <View className="flex-row items-center">
                  <Pressable onPress={() => toggleStageOpen(idx)} className="px-3 py-2 bg-gray-100 rounded-full">
                    <Text className="text-sm">{openStages[idx] ? 'Ẩn' : 'Xem'}</Text>
                  </Pressable>
                </View>
              </View>

              {openStages[idx] && Array.isArray(st.schedules) && st.schedules.map((sch: any, sidx: number) => (
                <View key={sidx} className="mt-3 p-3 bg-gray-50 rounded">
                  <View className="flex-row justify-between items-center">
                    <View>
                      <Text className="font-medium">{sch.scheduleName ?? sch.name ?? `Buổi ${sidx + 1}`}</Text>
                      <Text className="text-xs text-secondaryText">{(sch.dayOfWeek ?? '')}{sch.durationMinutes ? ' • ' + sch.durationMinutes + ' phút' : ''}</Text>
                    </View>
                    <View className="text-right">
                      <Text className="text-xs text-secondaryText">{sch.sets ? `${sch.sets} set` : ''}</Text>
                    </View>
                  </View>

                  {/* exercises */}
                  {Array.isArray(sch.exercises) && sch.exercises.map((ex: any, eidx: number) => (
                    <View key={eidx} className="mt-3 flex-row items-center">
                      <Image source={{ uri: ex.thumbnail ?? ex.image ?? placeholderThumb }} style={styles.thumb} />
                      <View className="ml-3 flex-1">
                        <Text className="font-semibold">{ex.exerciseName ?? ex.name ?? 'Bài tập'}</Text>
                        <Text className="text-xs text-secondaryText mt-1">{(ex.sets ?? '-') + ' x ' + (ex.reps ?? '-')}{ex.durationSeconds ? ` • ${ex.durationSeconds}s` : ''}</Text>
                      </View>
                      <TouchableOpacity className="ml-3 bg-foreground px-3 py-2 rounded-lg">
                        <Text className="text-white">Bắt đầu</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              ))}

            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  contentContainer: { paddingBottom: 120 },
  thumb: { width: 72, height: 72, borderRadius: 8 },
});

export default PlanDetailScreen;
