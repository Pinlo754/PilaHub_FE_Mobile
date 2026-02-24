import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, TextInput, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import axios from '../../hooks/axiosInstance';
import { fetchFitnessGoals } from '../../services/profile';
import { useOnboardingStore } from '../../store/onboarding.store';

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

  const [goals, setGoals] = useState<Goal[]>([]);
  const [primaryGoalId, setPrimaryGoalId] = useState<string | null>(onboarding.targets?.[0] || null);
  const [secondaryGoalIds, setSecondaryGoalIds] = useState<string[]>([]);
  const [workoutLevel, setWorkoutLevel] = useState<'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'>(onboarding.workoutLevel || 'INTERMEDIATE');
  const [trainingDays, setTrainingDays] = useState<string[]>(['MONDAY','WEDNESDAY','FRIDAY']);
  const [durationWeeks, setDurationWeeks] = useState<string>('5');

  const [loadingGoals, setLoadingGoals] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoadingGoals(true);
      try {
        const res: any = await fetchFitnessGoals();
        const list = (res && res.data) ? res.data : (res && res.ok && res.result ? res.result : res);
        setGoals(Array.isArray(list) ? list : []);
      } catch (err) {
        console.warn(err);
        setGoals([]);
      } finally {
        setLoadingGoals(false);
      }
    };
    load();
  }, []);

  const toggleSecondary = (id: string) => {
    setSecondaryGoalIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  };
  const toggleDay = (d: string) => setTrainingDays(prev => prev.includes(d) ? prev.filter(x=>x!==d) : [...prev, d]);

  const onSubmit = async () => {
    if (!primaryGoalId) return Alert.alert('Lỗi', 'Vui lòng chọn mục tiêu chính.');
    setSubmitting(true);
    try {
      const payload = {
        primaryGoalId,
        secondaryGoalIds,
        workoutLevel,
        trainingDays,
        durationWeeks: parseInt(durationWeeks, 10) || 4,
      };

      const { data } = await axios.post('/roadmaps/ai-generate', payload);
      if (data && data.data) {
        // navigate to Plan and pass the roadmap+stages so PlanScreen can append it
        nav.navigate('Plan', { addedRoadmap: { roadmap: data.data.roadmap, stages: data.data.stages } });
      } else {
        Alert.alert('Lỗi', 'Server không trả về roadmap.');
      }
    } catch (err) {
      console.warn(err);
      Alert.alert('Lỗi', 'Tạo lộ trình thất bại.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center px-4 py-3">
        <TouchableOpacity onPress={() => nav.goBack()}>
          <Text className="text-lg">←</Text>
        </TouchableOpacity>
        <Text className="flex-1 text-center text-lg font-semibold text-foreground">Tạo Lộ Trình AI</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView className="px-4" contentContainerStyle={{ paddingBottom: 140 }}>
        <View className="bg-white rounded-lg p-4 border border-gray-200">
          <Text className="font-semibold">Chọn mục tiêu chính</Text>
          {loadingGoals ? <ActivityIndicator /> : (
            <View className="flex-row flex-wrap mt-2">
              {goals.map(g => (
                <TouchableOpacity key={g.id} onPress={() => setPrimaryGoalId(g.id)} className={`px-3 py-2 rounded-lg mr-2 mb-2 ${primaryGoalId === g.id ? 'bg-foreground' : 'bg-white'} border border-gray-200`}>
                  <Text className={`${primaryGoalId === g.id ? 'text-white' : 'text-black'}`}>{g.vietnameseName || g.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <Text className="font-semibold mt-3">Mục tiêu phụ</Text>
          <View className="flex-row flex-wrap mt-2">
            {goals.map(g => (
              <TouchableOpacity key={g.id} onPress={() => toggleSecondary(g.id)} className={`px-3 py-2 rounded-lg mr-2 mb-2 ${secondaryGoalIds.includes(g.id) ? 'bg-foreground' : 'bg-white'} border border-gray-200`}>
                <Text className={`${secondaryGoalIds.includes(g.id) ? 'text-white' : 'text-black'}`}>{g.vietnameseName || g.name}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text className="font-semibold mt-3">Mức độ</Text>
          <View className="flex-row mt-2">
            {(['BEGINNER','INTERMEDIATE','ADVANCED'] as const).map(l => (
              <TouchableOpacity key={l} onPress={() => setWorkoutLevel(l as any)} className={`px-3 py-2 rounded-lg mr-2 ${workoutLevel===l? 'bg-foreground':'bg-white'} border border-gray-200`}>
                <Text className={`${workoutLevel===l? 'text-white':'text-black'}`}>{l}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text className="font-semibold mt-3">Ngày tập</Text>
          <View className="flex-row flex-wrap mt-2">
            {Object.keys(WEEKDAY_LABELS_VN).map(d => (
              <TouchableOpacity key={d} onPress={() => toggleDay(d)} className={`px-3 py-2 rounded-lg mr-2 mb-2 ${trainingDays.includes(d)? 'bg-foreground':'bg-white'} border border-gray-200`}>
                <Text className={`${trainingDays.includes(d)? 'text-white':'text-black'}`}>{WEEKDAY_LABELS_VN[d]}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text className="font-semibold mt-3">Số tuần</Text>
          <TextInput value={durationWeeks} onChangeText={setDurationWeeks} keyboardType="numeric" className="border border-gray-200 rounded-lg px-3 py-2 mt-2" />

          <TouchableOpacity onPress={onSubmit} className="h-12 bg-foreground mt-4 rounded-lg items-center justify-center">
            {submitting ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-semibold">Tạo ngay</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default CreateRoadmapScreen;
