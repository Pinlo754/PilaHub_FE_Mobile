import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import axios from '../../hooks/axiosInstance';
import { fetchFitnessGoals } from '../../services/profile';
import { useOnboardingStore } from '../../store/onboarding.store';
import { useRoadmapStore } from '../../store/roadmap.store';

type Goal = { id: string; vietnameseName?: string; name?: string };

const WEEKDAY_LABELS_VN: Record<string, string> = {
  MONDAY: 'Thứ 2',
  TUESDAY: 'Thứ 3',
  WEDNESDAY: 'Thứ 4',
  THURSDAY: 'Thứ 5',
  FRIDAY: 'Thứ 6',
  SATURDAY: 'Thứ 7',
  SUNDAY: 'Chủ nhật',
};

const CreateRoadmapScreen: React.FC = () => {
  const nav: any = useNavigation();
  const onboarding = useOnboardingStore(s => s.data);
  const addRoadmap = useRoadmapStore(s => s.addRoadmap);

  // prefer explicit primary/secondary saved by onboarding step; fallback to targets[0]
  const [primaryGoalId] = useState<string | null>(
    onboarding.primaryGoalId ?? onboarding.targets?.[0] ?? null
  );
  const [primaryGoalName, setPrimaryGoalName] = useState<string | null>(null);

  const [secondaryGoalIds, setSecondaryGoalIds] = useState<string[]>(
    onboarding.secondaryGoalIds ?? []
  );
  const [secondaryGoalNames, setSecondaryGoalNames] = useState<string[]>([]);
  // workout level must come from onboarding (read-only here)
  const workoutLevelFromOnboarding = (onboarding.workoutLevel as 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | undefined) ?? 'INTERMEDIATE';
  const [workoutLevel] = useState<typeof workoutLevelFromOnboarding>(workoutLevelFromOnboarding);
  const [trainingDays, setTrainingDays] = useState<string[]>(['MONDAY','WEDNESDAY','FRIDAY']);
  const [durationWeeks, setDurationWeeks] = useState<string>('5');

  const [loadingGoals, setLoadingGoals] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!primaryGoalId) return;
    let mounted = true;
    const load = async () => {
      setLoadingGoals(true);
      try {
        const res: any = await fetchFitnessGoals();
        const list = (res && res.data) ? res.data : (res && res.ok && res.result ? res.result : res);
        const arr: Goal[] = Array.isArray(list) ? list : [];
        const found = arr.find(g => (g.id ?? String((g as any).goalId)) === primaryGoalId);
        if (mounted) setPrimaryGoalName(found?.vietnameseName ?? found?.name ?? primaryGoalId);
        // map secondaryGoalIds to readable names
        if (mounted && Array.isArray(secondaryGoalIds) && secondaryGoalIds.length > 0) {
          const names = secondaryGoalIds.map(id => {
            const f = arr.find(g => (g.id ?? String((g as any).goalId)) === id);
            return f?.vietnameseName ?? f?.name ?? id;
          }).filter(Boolean);
          setSecondaryGoalNames(names);
        }
      } catch {
        if (mounted) setPrimaryGoalName(primaryGoalId);
      } finally {
        if (mounted) setLoadingGoals(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [primaryGoalId, secondaryGoalIds]);

  // update names if ids change later
  useEffect(() => {
    if (!secondaryGoalIds || secondaryGoalIds.length === 0) {
      setSecondaryGoalNames([]);
      return;
    }
    // if goals were loaded earlier, try to resolve using fetch again
    let mounted = true;
    (async () => {
      try {
        const res: any = await fetchFitnessGoals();
        const list = (res && res.data) ? res.data : (res && res.ok && res.result ? res.result : res);
        const arr: Goal[] = Array.isArray(list) ? list : [];
        if (!mounted) return;
        const names = secondaryGoalIds.map(id => {
          const f = arr.find(g => (g.id ?? String((g as any).goalId)) === id);
          return f?.vietnameseName ?? f?.name ?? id;
        }).filter(Boolean);
        setSecondaryGoalNames(names);
      } catch {
        // ignore
      }
    })();
    return () => { mounted = false; };
  }, [secondaryGoalIds]);

  const toggleDay = (d: string) => setTrainingDays(prev => prev.includes(d) ? prev.filter(x=>x!==d) : [...prev, d]);

  const onSubmit = async () => {
    console.log('CreateRoadmap onSubmit invoked, primaryGoalId:', primaryGoalId, 'workoutLevel:', workoutLevel);
    if (!primaryGoalId) {
      Alert.alert('Lỗi', 'Không có mục tiêu chính. Vui lòng hoàn thành onboarding.');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        primaryGoalId,
        secondaryGoalIds,
        workoutLevel,
        trainingDays,
        durationWeeks: parseInt(durationWeeks, 10) || 4,
      };
      console.log('CreateRoadmap payload:', JSON.stringify(payload));

      const { data } = await axios.post('/roadmaps/ai-generate', payload);

      // normalize and tolerate various response shapes
      const resp = data ?? {};
      const safeStringify = (obj: any) => {
        const seen = new WeakSet();
        return JSON.stringify(obj, (k, v) => {
          if (typeof v === 'string' && v.length > 200) return v.slice(0, 200) + '...[TRUNCATED]';
          if (v && typeof v === 'object') {
            if (seen.has(v)) return '[Circular]';
            seen.add(v);
          }
          return v;
        }, 2);
      };
      console.log('AI roadmap full response (safe):', safeStringify(resp));

      // the backend may wrap the useful object under `data` (sample: { success, message, data: { title, stages } })
      const inner = resp?.data ?? resp ?? {};

      // normalize roadmap metadata
      const roadmapObj: any = {
        title: inner.title ?? inner.name ?? `Lộ trình ${new Date().toISOString()}`,
        description: inner.description ?? inner.summary ?? null,
        confidenceScore: inner.confidenceScore ?? null,
        aiModel: inner.aiModel ?? null,
        generatedAt: inner.generatedAt ?? inner.generated_at ?? null,
        notes: inner.notes ?? null,
        supplementRecommendations: inner.supplementRecommendations ?? [],
        raw: inner, // keep original payload for debugging
      };

      const stages = Array.isArray(inner.stages) ? inner.stages : (inner.stages ? [inner.stages] : []);

      if (!stages || stages.length === 0) {
        console.warn('CreateRoadmap: no stages found in AI response. Response keys:', Object.keys(inner));
      }

      // persist normalized object and navigate to PlanDetail
      addRoadmap({ roadmap: roadmapObj, stages, createdAt: Date.now() });
      // navigate to Plan screen and pass the newly added roadmap so Plan can show it
      nav.navigate('Plan', { addedRoadmap: { roadmap: roadmapObj, stages } });
    } catch (err: any) {
      console.error('CreateRoadmap error:', err);
      const message = err?.response?.data?.message || err?.message || 'Tạo lộ trình thất bại.';
      Alert.alert('Lỗi', message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center px-4 py-3">
        
        <Text className="flex-1 text-center text-lg font-semibold">Tạo Lộ Trình AI</Text>
        <View className="w-7" />
      </View>

      <ScrollView className="px-4 pb-36">
        <View className="bg-white rounded-lg p-4 border border-gray-200">
          <Text className="font-semibold">Mục tiêu chính</Text>
          <View className="mt-2 p-3 bg-gray-100 rounded-lg border border-gray-200">
            {loadingGoals ? <ActivityIndicator /> : <Text>{primaryGoalName ?? primaryGoalId ?? 'Không có'}</Text>}
          </View>

          <Text className="font-semibold mt-4">Mục tiêu phụ (nếu có)</Text>
          <Text className="text-xs text-secondaryText mt-1">(Bạn có thể thêm mục tiêu phụ, hoặc để trống)</Text>
          {/* display resolved names as chips */}
          <View className="mt-2 flex-row flex-wrap">
            {secondaryGoalNames.length > 0 ? (
              secondaryGoalNames.map((n, i) => (
                <View key={i} className="px-3 py-1 mr-2 mb-2 bg-gray-100 rounded-full border border-gray-200">
                  <Text className="text-sm">{n}</Text>
                </View>
              ))
            ) : (
              <Text className="text-xs text-secondaryText">Không có mục tiêu phụ</Text>
            )}
          </View>
          {/* fallback manual input for advanced users to edit by id */}
          <TextInput className="border border-gray-200 rounded-lg px-3 py-2 mt-2" value={secondaryGoalIds.join(',')} onChangeText={t => setSecondaryGoalIds(t.split(',').map(s=>s.trim()).filter(Boolean))} placeholder="Nhập các goalId, cách nhau bằng dấu ," />

          <Text className="font-semibold mt-4">Mức độ (theo onboarding)</Text>
          <View className="mt-2 p-3 bg-gray-100 rounded-lg border border-gray-200">
            <Text>{workoutLevel === 'BEGINNER' ? 'Mới' : workoutLevel === 'INTERMEDIATE' ? 'Trung bình' : 'Nâng cao'}</Text>
          </View>

          <Text className="font-semibold mt-4">Ngày tập</Text>
          <View className="flex-row flex-wrap mt-2">
            {Object.keys(WEEKDAY_LABELS_VN).map(d => (
              <TouchableOpacity key={d} onPress={() => toggleDay(d)} className={`px-3 py-2 rounded-xl mr-2 mb-2 border ${trainingDays.includes(d) ? 'bg-foreground border-foreground' : 'bg-white border-gray-200'}`}>
                <Text className={`${trainingDays.includes(d) ? 'text-white' : 'text-black'}`}>{WEEKDAY_LABELS_VN[d]}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text className="font-semibold mt-4">Số tuần</Text>
          <TextInput className="border border-gray-200 rounded-lg px-3 py-2 mt-2" value={durationWeeks} onChangeText={setDurationWeeks} keyboardType="numeric" />

          <TouchableOpacity onPress={onSubmit} className="h-12 bg-foreground rounded-lg items-center justify-center mt-4">
            {submitting ? <ActivityIndicator color="#fff" /> : <Text className="text-white text-lg font-semibold">Tạo ngay</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default CreateRoadmapScreen;
