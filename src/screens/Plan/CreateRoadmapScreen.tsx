import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, Alert, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import axios from '../../hooks/axiosInstance';
import { useOnboardingStore } from '../../store/onboarding.store';
import { useRoadmapStore } from '../../store/roadmap.store';
import GoalPicker from './components/GoalPicker';
import Ionicons from '@react-native-vector-icons/ionicons';

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

  // Do not prefill goals from onboarding — require manual selection here
  const [primaryGoalIdState, setPrimaryGoalIdState] = useState<string | null>(null);
  const [secondaryGoalIdsState, setSecondaryGoalIdsState] = useState<string[]>([]);
  // workout level must come from onboarding (read-only here)
  const workoutLevelFromOnboarding = (onboarding.workoutLevel as 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | undefined) ?? 'INTERMEDIATE';
  const [workoutLevel] = useState<typeof workoutLevelFromOnboarding>(workoutLevelFromOnboarding);
  const [trainingDays, setTrainingDays] = useState<string[]>(['MONDAY','WEDNESDAY','FRIDAY']);
  const [durationWeeks, setDurationWeeks] = useState<string>('5');

  const [submitting, setSubmitting] = useState(false);

  const toggleDay = (d: string) => setTrainingDays(prev => prev.includes(d) ? prev.filter(x=>x!==d) : [...prev, d]);

  const onSubmit = async () => {
    console.log('CreateRoadmap onSubmit invoked, primaryGoalId:', primaryGoalIdState, 'workoutLevel:', workoutLevel);
    if (!primaryGoalIdState) {
      Alert.alert('Lỗi', 'Vui lòng chọn mục tiêu chính trước khi tạo lộ trình.');
      return;
    }
    if (trainingDays.length === 0) {
      Alert.alert('Lỗi', 'Vui lòng chọn ít nhất một ngày trong tuần để tập luyện.');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        primaryGoalId: primaryGoalIdState,
        secondaryGoalIds: secondaryGoalIdsState,
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
        // include the user-selected goals so later save-to-server requests can provide them
        primaryGoalId: primaryGoalIdState,
        secondaryGoalIds: secondaryGoalIdsState,
      };

      const stages = Array.isArray(inner.stages) ? inner.stages : (inner.stages ? [inner.stages] : []);

      if (!stages || stages.length === 0) {
        console.warn('CreateRoadmap: no stages found in AI response. Response keys:', Object.keys(inner));
      }

      // Persist locally and navigate immediately to Plan so user can review the generated roadmap.
      addRoadmap({ roadmap: roadmapObj, stages, createdAt: Date.now() });
      nav.navigate('Plan', { addedRoadmap: { roadmap: roadmapObj, stages, primaryGoalId: primaryGoalIdState, secondaryGoalIds: secondaryGoalIdsState } });
      setSubmitting(false);
      return;

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
      <View className="flex-row items-center px-4 py-3 bg-white border-b border-gray-200">
        <TouchableOpacity onPress={() => nav.goBack()} className="w-7 items-center justify-center">
          <Ionicons name="arrow-back" size={22} color="#333" />
        </TouchableOpacity>

        <Text className="flex-1 text-center text-lg font-semibold">Tạo Lộ Trình AI</Text>
        <View className="w-7" />
      </View>

      <ScrollView className="px-4" contentContainerStyle={styles.scrollContent}>
        <View className="bg-white rounded-lg p-6 border border-gray-200 mt-4">
          
          <GoalPicker
            initialPrimaryId={primaryGoalIdState ?? undefined}
            initialSecondaryIds={secondaryGoalIdsState}
            initialOpenPrimary={true}
            initialOpenSecondary={false}
            onChange={(p, s) => {
              setPrimaryGoalIdState(p ?? null);
              setSecondaryGoalIdsState(s ?? []);
            }}
          />

          

          <Text className="font-semibold mt-6">Mức độ (theo onboarding)</Text>
          <View className="mt-2 p-4 bg-gray-100 rounded-lg border border-gray-200">
            <Text className="text-base">{workoutLevel === 'BEGINNER' ? 'Mới' : workoutLevel === 'INTERMEDIATE' ? 'Trung bình' : 'Nâng cao'}</Text>
          </View>

          <Text className="font-semibold mt-6">Ngày tập</Text>
          <View className="flex-row flex-wrap mt-3">
            {Object.keys(WEEKDAY_LABELS_VN).map(d => (
              <TouchableOpacity key={d} onPress={() => toggleDay(d)} className={`px-4 py-3 rounded-xl mr-2 mb-2 border ${trainingDays.includes(d) ? 'bg-foreground border-foreground' : 'bg-white border-gray-200'}`}>
                <Text className={`${trainingDays.includes(d) ? 'text-white' : 'text-black'}`}>{WEEKDAY_LABELS_VN[d]}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text className="font-semibold mt-6">Số tuần</Text>
          <TextInput className="border border-gray-200 rounded-lg px-4 py-3 mt-2 text-base" value={durationWeeks} onChangeText={setDurationWeeks} keyboardType="numeric" />

          {/* Restore original position of Create button inside content card */}
          <TouchableOpacity onPress={onSubmit} className="h-12 bg-foreground rounded-lg items-center justify-center mt-4">
            {submitting ? <ActivityIndicator color="#fff" /> : <Text className="text-white text-lg font-semibold">Tạo ngay</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  scrollContent: { paddingBottom: 40 },
});

export default CreateRoadmapScreen;
