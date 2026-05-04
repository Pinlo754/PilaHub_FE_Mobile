import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import axios from '../../hooks/axiosInstance';
import { useOnboardingStore } from '../../store/onboarding.store';
import { useRoadmapStore } from '../../store/roadmap.store';
import GoalPicker from './components/GoalPicker';
import Ionicons from '@react-native-vector-icons/ionicons';
import { Calendar } from 'react-native-calendars';
import ModalPopup from '../../components/ModalPopup';

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

  const [primaryGoalIdState, setPrimaryGoalIdState] = useState<string | null>(
    null,
  );
  const [secondaryGoalIdsState, setSecondaryGoalIdsState] = useState<string[]>(
    [],
  );

  const workoutLevelFromOnboarding =
    (onboarding.workoutLevel as
      | 'BEGINNER'
      | 'INTERMEDIATE'
      | 'ADVANCED'
      | undefined) ?? 'INTERMEDIATE';

  const [workoutLevel] = useState<typeof workoutLevelFromOnboarding>(
    workoutLevelFromOnboarding,
  );

  const [trainingDays, setTrainingDays] = useState<string[]>([
    'MONDAY',
    'WEDNESDAY',
    'FRIDAY',
  ]);

  const [durationWeeks, setDurationWeeks] = useState<string>('5');

  const today = new Date().toISOString().slice(0, 10);
  const [startDate, setStartDate] = useState<string>(today);
  const [showCalendar, setShowCalendar] = useState<boolean>(false);

  const [submitting, setSubmitting] = useState(false);
  const [modalProps, setModalProps] = useState<any>({ visible: false });

  const showModal = (p: any) => {
    setModalProps({ ...p, visible: true });
  };

  const toggleDay = (d: string) => {
    setTrainingDays(prev =>
      prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d],
    );
  };

  const onSubmit = async () => {
    console.log(
      'CreateRoadmap onSubmit invoked, primaryGoalId:',
      primaryGoalIdState,
      'workoutLevel:',
      workoutLevel,
      'startDate:',
      startDate,
    );

    if (!primaryGoalIdState) {
      showModal({
        mode: 'noti',
        titleText: 'Lỗi',
        contentText: 'Vui lòng chọn mục tiêu chính trước khi tạo lộ trình.',
      });
      return;
    }

    if (trainingDays.length === 0) {
      showModal({
        mode: 'noti',
        titleText: 'Lỗi',
        contentText: 'Vui lòng chọn ít nhất một ngày trong tuần để tập luyện.',
      });
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        primaryGoalId: primaryGoalIdState,
        secondaryGoalIds: secondaryGoalIdsState,
        workoutLevel,
        startDate,
        trainingDays,
        durationWeeks: parseInt(durationWeeks, 10) || 4,
      };

      console.log('CreateRoadmap payload:', JSON.stringify(payload));

      const { data } = await axios.post('/roadmaps/ai-generate', payload);

      const resp = data ?? {};

      const safeStringify = (obj: any) => {
        const seen = new WeakSet();

        return JSON.stringify(
          obj,
          (k, v) => {
            if (typeof v === 'string' && v.length > 200) {
              return v.slice(0, 200) + '...[TRUNCATED]';
            }

            if (v && typeof v === 'object') {
              if (seen.has(v)) return '[Circular]';
              seen.add(v);
            }

            return v;
          },
          2,
        );
      };

      console.log('AI roadmap full response (safe):', safeStringify(resp));

      const inner = resp?.data ?? resp ?? {};

      const roadmapObj: any = {
        title: inner.title ?? inner.name ?? `Lộ trình ${new Date().toISOString()}`,
        description: inner.description ?? inner.summary ?? null,
        confidenceScore: inner.confidenceScore ?? null,
        aiModel: inner.aiModel ?? null,
        generatedAt: inner.generatedAt ?? inner.generated_at ?? null,
        notes: inner.notes ?? null,
        supplementRecommendations: inner.supplementRecommendations ?? [],
        raw: inner,
        primaryGoalId: primaryGoalIdState,
        secondaryGoalIds: secondaryGoalIdsState,
      };

      const stages = Array.isArray(inner.stages)
        ? inner.stages
        : inner.stages
        ? [inner.stages]
        : [];

      if (!stages || stages.length === 0) {
        console.warn(
          'CreateRoadmap: no stages found in AI response. Response keys:',
          Object.keys(inner),
        );
      }

      addRoadmap({
        roadmap: roadmapObj,
        stages,
        createdAt: Date.now(),
      });

      nav.navigate('Plan', {
        addedRoadmap: {
          roadmap: roadmapObj,
          stages,
          primaryGoalId: primaryGoalIdState,
          secondaryGoalIds: secondaryGoalIdsState,
        },
      });

      setSubmitting(false);
      return;
    } catch (err: any) {
      console.error('CreateRoadmap error:', err);

      const isServerError = err?.response?.status === 500;

      if (isServerError) {
        showModal({
          mode: 'confirm',
          titleText: 'AI đang bận',
          contentText: 'AI đang bận vui lòng thử lại sau',
          onConfirm: async () => {
            setModalProps({ visible: false });

            try {
              await onSubmit();
            } catch {
              // ignore
            }
          },
          onCancel: () => setModalProps({ visible: false }),
        });
      } else {
        const message =
          err?.response?.data?.message ||
          err?.message ||
          'Tạo lộ trình thất bại.';

        showModal({
          mode: 'noti',
          titleText: 'Lỗi',
          contentText: message,
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        style={styles.keyboardAvoiding}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View className="flex-1">
            <View className="flex-row items-center px-4 py-3 bg-white border-b border-gray-200">
              <TouchableOpacity
                onPress={() => nav.goBack()}
                className="w-7 items-center justify-center"
              >
                <Ionicons name="arrow-back" size={22} color="#333" />
              </TouchableOpacity>

              <Text className="flex-1 text-center text-lg font-semibold">
                Tạo Lộ Trình AI
              </Text>

              <View className="w-7" />
            </View>

            <ScrollView
              className="px-4"
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
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

                <Text className="font-semibold mt-6">
                  Mức độ theo onboarding
                </Text>

                <View className="mt-2 p-4 bg-gray-100 rounded-lg border border-gray-200">
                  <Text className="text-base">
                    {workoutLevel === 'BEGINNER'
                      ? 'Mới'
                      : workoutLevel === 'INTERMEDIATE'
                      ? 'Trung bình'
                      : 'Nâng cao'}
                  </Text>
                </View>

                <Text className="font-semibold mt-6">Ngày tập</Text>

                <View className="flex-row flex-wrap mt-3">
                  {Object.keys(WEEKDAY_LABELS_VN).map(d => {
                    const selected = trainingDays.includes(d);

                    return (
                      <TouchableOpacity
                        key={d}
                        onPress={() => toggleDay(d)}
                        className={`px-4 py-3 rounded-xl mr-2 mb-2 border ${
                          selected
                            ? 'bg-foreground border-foreground'
                            : 'bg-white border-gray-200'
                        }`}
                      >
                        <Text
                          className={selected ? 'text-white' : 'text-black'}
                        >
                          {WEEKDAY_LABELS_VN[d]}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Text className="font-semibold mt-6">Số tuần</Text>

                <TextInput
                  className="border border-gray-200 rounded-lg px-4 py-3 mt-2 text-base"
                  value={durationWeeks}
                  onChangeText={setDurationWeeks}
                  keyboardType="numeric"
                  returnKeyType="done"
                  onSubmitEditing={Keyboard.dismiss}
                  placeholder="Nhập số tuần"
                />

                <Text className="font-semibold mt-6">Ngày bắt đầu</Text>

                <Pressable
                  onPress={() => setShowCalendar(true)}
                  className="border border-gray-200 rounded-lg px-4 py-3 mt-2"
                >
                  <Text className="text-base">{startDate}</Text>
                </Pressable>

                {showCalendar && (
                  <View className="mt-2 bg-white rounded-lg border border-gray-200">
                    <Calendar
                      minDate={today}
                      onDayPress={day => {
                        if (day.dateString < today) return;

                        setStartDate(day.dateString);
                        setShowCalendar(false);
                      }}
                      markedDates={{
                        [startDate]: {
                          selected: true,
                          selectedColor: '#A0522D',
                        },
                      }}
                      theme={{
                        todayTextColor: '#A0522D',
                      }}
                    />
                  </View>
                )}

                <TouchableOpacity
                  onPress={onSubmit}
                  disabled={submitting}
                  className={`h-12 rounded-lg items-center justify-center mt-6 ${
                    submitting ? 'bg-gray-400' : 'bg-foreground'
                  }`}
                >
                  {submitting ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text className="text-white text-lg font-semibold">
                      Tạo ngay
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>

            <ModalPopup {...(modalProps as any)} />
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  keyboardAvoiding: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
});

export default CreateRoadmapScreen;