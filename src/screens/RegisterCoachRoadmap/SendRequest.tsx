import React, { useEffect, useState } from 'react';
  import { View, Text, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, Alert, Pressable, StyleSheet } from 'react-native';
  import { SafeAreaView } from 'react-native-safe-area-context';
  import { RouteProp, useNavigation } from '@react-navigation/native';
  import axios from '../../hooks/axiosInstance';
  import { useOnboardingStore } from '../../store/onboarding.store';
  import { useRoadmapStore } from '../../store/roadmap.store';
  import { Send } from 'lucide-react-native';
  import Ionicons from '@react-native-vector-icons/ionicons';
  import { RootStackParamList } from '../../navigation/AppNavigator';
  import { NativeStackNavigationProp } from '@react-navigation/native-stack';
  import { Picker } from '@react-native-picker/picker';
  import { Modal } from 'react-native'
  import { CoachService } from '../../hooks/coach.service';
  import GoalPicker from '../Plan/components/GoalPicker';

  const WEEKDAY_LABELS_VN: Record<string, string> = {
    MONDAY: 'Thứ 2',
    TUESDAY: 'Thứ 3',
    WEDNESDAY: 'Thứ 4',
    THURSDAY: 'Thứ 5',
    FRIDAY: 'Thứ 6',
    SATURDAY: 'Thứ 7',
    SUNDAY: 'Chủ nhật',
  };

  type Props = {
    route: RouteProp<RootStackParamList, 'SendRequestScreen'>;
    navigation: NativeStackNavigationProp<RootStackParamList, 'SendRequestScreen'>;
  };

  const SendRequestScreen = ({ route }: Props) => {
    const nav: any = useNavigation();
    const onboarding = useOnboardingStore(s => s.data);
    const addRoadmap = useRoadmapStore(s => s.addRoadmap);
    const { coach_id } = route.params;
    // Do not prefill goals from onboarding — require manual selection here
    const [primaryGoalIdState, setPrimaryGoalIdState] = useState<string | null>(null);
    const [secondaryGoalIdsState, setSecondaryGoalIdsState] = useState<string[]>([]);
    // workout level must come from onboarding (read-only here)
    const workoutLevelFromOnboarding = (onboarding.workoutLevel as 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | undefined) ?? 'INTERMEDIATE';
    const [workoutLevel] = useState<typeof workoutLevelFromOnboarding>(workoutLevelFromOnboarding);
    const [trainingDaySchedules, setTrainingDayScheduless] = useState<
      { dayOfWeek: string; startTime: string }[]
    >([
      { dayOfWeek: 'MONDAY', startTime: '09:00' },
      { dayOfWeek: 'WEDNESDAY', startTime: '09:00' },
      { dayOfWeek: 'FRIDAY', startTime: '09:00' },
    ]);
    const [durationWeeks, setDurationWeeks] = useState<string>('5');

    const [submitting, setSubmitting] = useState(false);

    const toggleDay = (day: string) => {
      setTrainingDayScheduless(prev => {
        const exists = prev.find(d => d.dayOfWeek === day);
        if (exists) {
          return prev.filter(d => d.dayOfWeek !== day);
        }
        return [...prev, { dayOfWeek: day, startTime: '09:00' }];
      });
    };

    const [selectedDay, setSelectedDay] = useState<string | null>(null)
    const [showPicker, setShowPicker] = useState(false)

    const openTimePicker = (day: string) => {
      console.log('Opening time picker for day:', day);
      setSelectedDay(day)
      setShowPicker(true)
    }

    const updateTime = (day: string, time: string) => {
      setTrainingDayScheduless(prev =>
        prev.map(d =>
          d.dayOfWeek === day ? { ...d, startTime: time } : d
        )
      );
    };

    const submitRequest = async () => {
      console.log('send request invoked, primaryGoalId:', primaryGoalIdState, 'workoutLevel:', workoutLevel);
      if (!primaryGoalIdState) {
        Alert.alert('Lỗi', 'Vui lòng chọn mục tiêu chính trước khi tạo lộ trình.');
        return;
      }
      if (trainingDaySchedules.length === 0) {
        Alert.alert('Lỗi', 'Vui lòng chọn ít nhất một ngày trong tuần để tập luyện.');
        return;
      }
      setSubmitting(true);
      try {
        const payload = {
          coachId: coach_id,
          primaryGoalId: primaryGoalIdState,
          secondaryGoalIds: secondaryGoalIdsState,
          workoutLevel,
          trainingDaySchedules,
          durationWeeks: parseInt(durationWeeks, 10) || 4,
          traineeMessage: ``,
        };

        console.log('Send Request payload:', JSON.stringify(payload));

        const { data } = await axios.post('/coach-roadmap-requests', payload);

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

    const TIME_OPTIONS = Array.from({ length: 13 }, (_, i) => {
      const hour = 6 + i;
      return `${hour.toString().padStart(2, '0')}:00`;
    });


    //Time-off
    const [timeOffs, setTimeOffs] = useState<any[]>([])

    const fetchTimeOffs = async () => {
      const res = await CoachService.getTimeOffById(coach_id)

      if (res) {
        setTimeOffs(res)
      }
    }

    useEffect(() => {
      fetchTimeOffs()
    }, [])

    const toLocal = (iso: string) => {
      return new Date(iso)
    }

    const getTargetDateTime = (day: string, time: string) => {
      const today = new Date()

      const weekdayMap = Object.keys(WEEKDAY_LABELS_VN) // đảm bảo đúng thứ tự MON → SUN
      const targetIndex = weekdayMap.indexOf(day)

      const currentDay = today.getDay() === 0 ? 6 : today.getDay() - 1 // convert về MON=0
      const diff = targetIndex - currentDay

      const target = new Date(today)
      target.setDate(today.getDate() + diff)

      const [hour] = time.split(':').map(Number)
      target.setHours(hour, 0, 0, 0)

      return target
    }

    const isTimeDisabled = (day: string, time: string) => {
      const target = getTargetDateTime(day, time)

      return timeOffs.some((off) => {
        const start = new Date(off.startTime)
        const end = new Date(off.endTime)

        return target >= start && target < end
      })
    }

    const getTimeOffReason = (day: string, time: string) => {
      const target = getTargetDateTime(day, time)

      const found = timeOffs.find((off) => {
        const start = new Date(off.startTime)
        const end = new Date(off.endTime)

        return target >= start && target < end
      })

      return found?.reason
    }
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
            <View className="mt-3 space-y-2">
              {Object.keys(WEEKDAY_LABELS_VN).map((d) => {
                const selected = trainingDaySchedules.find(x => x.dayOfWeek === d)
                const isChecked = !!selected

                return (
                  <View
                    key={d}
                    className={`my-2 flex-row items-center justify-between border rounded-xl px-3 py-3 bg-white ${!isChecked ? 'opacity-40' : ''
                      }`}
                  >
                    {/* LEFT: checkbox + label */}
                    <TouchableOpacity
                      onPress={() => toggleDay(d)}
                      className="flex-row items-center flex-1"
                    >
                      {/* Checkbox tròn */}
                      <View
                        className={`w-5 h-5 rounded-full border-2 mr-3 items-center justify-center ${isChecked ? 'border-foreground' : 'border-gray-300'
                          }`}
                      >
                        {isChecked && (
                          <View className="w-2.5 h-2.5 rounded-full bg-foreground" />
                        )}
                      </View>

                      {/* Label */}
                      <Text
                        className={`font-semibold ${isChecked ? 'text-black' : 'text-gray-400'
                          }`}
                      >
                        {WEEKDAY_LABELS_VN[d]}
                      </Text>
                    </TouchableOpacity>

                    {/* RIGHT: dropdown giờ */}
                    <View className="w-[50%]">
                      <TouchableOpacity
                        disabled={!isChecked}
                        onPress={() => openTimePicker(d)}
                        className={`border rounded-xl px-3 py-3 items-center ${isChecked ? 'bg-gray-50 border-gray-300' : 'bg-gray-100 border-gray-200'
                          }`}
                      >
                        <Text className={`font-semibold ${isChecked ? 'text-black' : 'text-gray-400'}`}>
                          {selected?.startTime || '--:--'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )
              })}
            </View>

            <Text className="font-semibold mt-6">Số tuần</Text>
            <TextInput className="border border-gray-200 rounded-lg px-4 py-3 mt-2 text-base" value={durationWeeks} onChangeText={setDurationWeeks} keyboardType="numeric" />

            {/* Restore original position of Create button inside content card */}
            <TouchableOpacity onPress={submitRequest} className="h-12 bg-foreground rounded-lg items-center justify-center mt-4">
              {submitting ? <ActivityIndicator color="#fff" /> : <Text className="text-white text-lg font-semibold">Gửi yêu cầu</Text>}
            </TouchableOpacity>
          </View>
        </ScrollView>
        <Modal visible={showPicker} transparent animationType="slide" presentationStyle="overFullScreen">
          <View className="flex-1 bg-black justify-end h-[50%]">
            <View className="bg-white rounded-t-3xl p-4">

              <Text className="text-center font-bold text-lg mb-3">
                Chọn giờ tập
              </Text>

              <ScrollView>
                {TIME_OPTIONS.map((time) => {
                  const current = trainingDaySchedules.find(x => x.dayOfWeek === selectedDay)

                  const active = current?.startTime === time
                  const disabled = isTimeDisabled(selectedDay!, time)

                  return (
                    <TouchableOpacity
                      key={time}
                      disabled={disabled}
                      onPress={() => {
                        updateTime(selectedDay!, time)
                        setShowPicker(false)
                      }}
                      className={`p-4 rounded-xl mb-2 ${disabled
                          ? 'bg-gray-200'
                          : active
                            ? 'bg-foreground'
                            : 'bg-gray-100'
                        }`}
                    >
                      <Text
                        className={`text-center font-semibold ${disabled
                            ? 'text-gray-400'
                            : active
                              ? 'text-white'
                              : 'text-black'
                          }`}
                      >
                        {time}
                      </Text>

                      {/* Hiển thị lý do bận */}
                      {disabled && (
                        <Text className="text-xs text-center text-red-400 mt-1">
                          {getTimeOffReason(selectedDay!, time) || 'Bận'}
                        </Text>
                      )}
                    </TouchableOpacity>
                  )
                })}
              </ScrollView>

              {/* Close */}
              <TouchableOpacity
                onPress={() => setShowPicker(false)}
                className="mt-3 p-3"
              >
                <Text className="text-center text-gray-500">Đóng</Text>
              </TouchableOpacity>

            </View>
          </View>
        </Modal>
      </SafeAreaView>
    );
  };

  const styles = StyleSheet.create({
    scrollContent: { paddingBottom: 40 },
  });

  export default SendRequestScreen;
