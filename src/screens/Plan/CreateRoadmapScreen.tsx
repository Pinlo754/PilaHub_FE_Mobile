import React, { useEffect, useMemo, useState } from 'react';
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
import Ionicons from '@react-native-vector-icons/ionicons';
import { Calendar } from 'react-native-calendars';

import { useOnboardingStore } from '../../store/onboarding.store';
import { useRoadmapStore } from '../../store/roadmap.store';
import GoalPicker from './components/GoalPicker';
import ModalPopup from '../../components/ModalPopup';
import { exerciseService } from '../../hooks/exercise.service';
import { ExerciseType } from '../../utils/ExerciseType';

import ManualRoadmapBuilder from './ManualRoadmapBuilder';
import { ManualStageItem } from './types/manualRoadmap.types';
import {
  addDays,
  calculateScheduleDuration,
  getFirstDateOfWeekday,
  toIsoStartOfDay,
} from './utils/manualRoadmap.utils';
import RoadmapApi from '../../hooks/roadmap.api';

type TabType = 'AI' | 'MANUAL';

const WEEKDAY_LABELS_VN: Record<string, string> = {
  MONDAY: 'Thứ 2',
  TUESDAY: 'Thứ 3',
  WEDNESDAY: 'Thứ 4',
  THURSDAY: 'Thứ 5',
  FRIDAY: 'Thứ 6',
  SATURDAY: 'Thứ 7',
  SUNDAY: 'Chủ nhật',
};

const getErrorMessage = (err: any) => {
  return (
    err?.response?.data?.message ||
    err?.message ||
    err?.message?.toString?.() ||
    'Đã có lỗi xảy ra.'
  );
};

const CreateRoadmapScreen: React.FC = () => {
  const nav: any = useNavigation();

  const onboarding = useOnboardingStore(s => s.data);
  const addRoadmap = useRoadmapStore(s => s.addRoadmap);

  const [activeTab, setActiveTab] = useState<TabType>('AI');

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

  const [durationWeeks, setDurationWeeks] = useState<string>('4');

  const today = new Date().toISOString().slice(0, 10);
  const [startDate, setStartDate] = useState<string>(today);
  const [showCalendar, setShowCalendar] = useState<boolean>(false);

  const [submitting, setSubmitting] = useState(false);

  const [modalProps, setModalProps] = useState<any>({
    visible: false,
    mode: 'noti',
    titleText: '',
    contentText: '',
  });

  const [exercises, setExercises] = useState<ExerciseType[]>([]);
  const [loadingExercises, setLoadingExercises] = useState(false);

  const [manualTitle, setManualTitle] = useState('Lộ trình tự tạo');
  const [manualDescription, setManualDescription] = useState(
    'Lộ trình tập luyện được tạo thủ công.',
  );
  const [manualStages, setManualStages] = useState<ManualStageItem[]>([]);

  const traineeId =
    (onboarding as any)?.traineeId ||
    (onboarding as any)?.profileId ||
    (onboarding as any)?.customerProfileId ||
    undefined;

  const totalWeeks = useMemo(() => {
    return parseInt(durationWeeks, 10) || 4;
  }, [durationWeeks]);

  const roadmapEndDate = useMemo(() => {
    return addDays(startDate, totalWeeks * 7 - 1);
  }, [startDate, totalWeeks]);

  const showModal = (p: any) => {
    setModalProps({ ...p, visible: true });
  };

  const closeModal = () => {
    setModalProps((prev: any) => ({ ...prev, visible: false }));
  };

  const toggleDay = (d: string) => {
    setTrainingDays(prev => {
      const next = prev.includes(d)
        ? prev.filter(x => x !== d)
        : [...prev, d];

      setManualStages([]);

      return next;
    });
  };

  const loadExercises = async () => {
    try {
      setLoadingExercises(true);

      console.log('Loading exercises...');
      const data = await exerciseService.getAll();
      console.log('Exercises response:', data);

      setExercises(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.log('Load exercises error:', err);

      showModal({
        mode: 'noti',
        titleText: 'Lỗi',
        contentText: getErrorMessage(err),
      });
    } finally {
      setLoadingExercises(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'MANUAL' && exercises.length === 0) {
      loadExercises();
    }
  }, [activeTab]);

  const validateCommonForm = () => {
    if (!primaryGoalIdState) {
      showModal({
        mode: 'noti',
        titleText: 'Lỗi',
        contentText: 'Vui lòng chọn mục tiêu chính trước khi tạo lộ trình.',
      });
      return false;
    }

    if (trainingDays.length === 0) {
      showModal({
        mode: 'noti',
        titleText: 'Lỗi',
        contentText: 'Vui lòng chọn ít nhất một ngày trong tuần để tập luyện.',
      });
      return false;
    }

    return true;
  };

  const submitAiRoadmap = async () => {
    console.log(
      'CreateRoadmap AI submit, primaryGoalId:',
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
        durationWeeks: totalWeeks,
      };

      console.log('CreateRoadmap AI payload:', JSON.stringify(payload));

      const inner = await RoadmapApi.generateAiRoadmap(payload);

      console.log('CreateRoadmap AI response:', JSON.stringify(inner));

      const roadmapObj: any = {
        title:
          inner?.title ?? inner?.name ?? `Lộ trình ${new Date().toISOString()}`,
        description: inner?.description ?? inner?.summary ?? null,
        confidenceScore: inner?.confidenceScore ?? null,
        aiModel: inner?.aiModel ?? null,
        generatedAt: inner?.generatedAt ?? inner?.generated_at ?? null,
        notes: inner?.notes ?? null,
        supplementRecommendations: inner?.supplementRecommendations ?? [],
        raw: inner,
        primaryGoalId: primaryGoalIdState,
        secondaryGoalIds: secondaryGoalIdsState,
      };

      const stages = Array.isArray(inner?.stages)
        ? inner.stages
        : inner?.stages
        ? [inner.stages]
        : [];

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
    } catch (err: any) {
      const isServerError = err?.response?.status === 500;

      if (isServerError) {
        showModal({
          mode: 'confirm',
          titleText: 'AI đang bận',
          contentText: 'AI đang bận vui lòng thử lại sau.',
          onConfirm: () => {
            closeModal();
            submitAiRoadmap();
          },
          onCancel: closeModal,
        });
      } else {
        showModal({
          mode: 'noti',
          titleText: 'Lỗi',
          contentText: getErrorMessage(err) || 'Tạo lộ trình AI thất bại.',
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const goToRoadmapDetail = (roadmapId: string) => {
    nav.reset({
      index: 0,
      routes: [
        {
          name: 'MainTabs',
          params: {
            screen: 'Roadmap',
            params: {
              screen: 'RoadmapDetail',
              params: {
                roadmapId,
              },
            },
          },
        },
      ],
    });
  };

  const validateManualStages = () => {
    if (manualStages.length === 0) {
      showModal({
        mode: 'noti',
        titleText: 'Thiếu cấu trúc lộ trình',
        contentText: 'Vui lòng bấm “Tạo roadmap” trước khi tạo thủ công.',
      });
      return false;
    }

    const hasExercise = manualStages.some(stage =>
      stage.schedules.some(schedule => schedule.exercises.length > 0),
    );

    if (!hasExercise) {
      showModal({
        mode: 'noti',
        titleText: 'Thiếu bài tập',
        contentText: 'Vui lòng thêm ít nhất một bài tập vào lộ trình.',
      });
      return false;
    }

    return true;
  };

  const buildManualStagesPayload = () => {
    return manualStages.map((stage, stageIndex) => {
      const stageDurationWeeks = parseInt(stage.durationWeeks, 10) || 4;

      const stageStartDate = addDays(startDate, stageIndex * 4 * 7);
      const stageEndDate = addDays(
        stageStartDate,
        stageDurationWeeks * 7 - 1,
      );

      return {
        stageName: stage.stageName.trim() || `Giai đoạn ${stage.stageOrder}`,
        description: stage.description.trim(),
        stageOrder: stage.stageOrder,
        startDate: toIsoStartOfDay(stageStartDate),
        endDate: toIsoStartOfDay(stageEndDate),
        schedules: stage.schedules.map(schedule => ({
          scheduleName:
            schedule.scheduleName.trim() ||
            `Buổi tập ${WEEKDAY_LABELS_VN[schedule.dayOfWeek] ?? ''}`,
          description: schedule.description.trim(),
          dayOfWeek: schedule.dayOfWeek,
          scheduledDate: getFirstDateOfWeekday(
            stageStartDate,
            schedule.dayOfWeek,
          ),
          durationMinutes: calculateScheduleDuration(schedule.exercises),
          exercises: schedule.exercises.map((exercise, exerciseIndex) => ({
            exerciseId: exercise.exerciseId,
            exerciseOrder: exerciseIndex + 1,
            sets: parseInt(exercise.sets, 10) || 1,
            reps: parseInt(exercise.reps, 10) || 1,
            durationSeconds: parseInt(exercise.durationSeconds, 10) || 60,
            restSeconds: parseInt(exercise.restSeconds, 10) || 30,
            notes: exercise.notes?.trim() || '',
          })),
        })),
      };
    });
  };

  const submitManualRoadmap = async () => {
    if (!validateCommonForm()) return;

    const primaryGoalId = primaryGoalIdState;

    if (!primaryGoalId) {
      showModal({
        mode: 'noti',
        titleText: 'Lỗi',
        contentText: 'Vui lòng chọn mục tiêu chính trước khi tạo lộ trình.',
      });
      return;
    }

    if (!manualTitle.trim()) {
      showModal({
        mode: 'noti',
        titleText: 'Lỗi',
        contentText: 'Vui lòng nhập tên lộ trình.',
      });
      return;
    }

    if (!validateManualStages()) return;

    setSubmitting(true);

    try {
      const stagesPayload = buildManualStagesPayload();

      const payload = {
        title: manualTitle.trim(),
        description: manualDescription.trim(),
        startDate: toIsoStartOfDay(startDate),
        endDate: toIsoStartOfDay(roadmapEndDate),
        source: 'MANUAL',
        traineeId,
        primaryGoalId,
        secondaryGoalIds: secondaryGoalIdsState,
        stages: stagesPayload,
      };

      console.log('CreateRoadmap MANUAL payload:', JSON.stringify(payload));

      const data = await RoadmapApi.createWithDetails(payload);

      console.log('CreateRoadmap MANUAL response:', JSON.stringify(data));

      const roadmapId =
        data?.roadmap?.roadmapId ??
        data?.roadmapId ??
        data?.id ??
        data?._id ??
        null;

      showModal({
        mode: 'noti',
        titleText: 'Thành công',
        contentText: 'Tạo lộ trình thủ công thành công.',
        onConfirm: () => {
          closeModal();

          if (roadmapId) {
            goToRoadmapDetail(roadmapId);
            return;
          }

          nav.goBack();
        },
      });
    } catch (err: any) {
      showModal({
        mode: 'noti',
        titleText: 'Lỗi',
        contentText: getErrorMessage(err) || 'Tạo lộ trình thủ công thất bại.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const renderTabButton = (tab: TabType, label: string, icon: string) => {
    const active = activeTab === tab;

    return (
      <TouchableOpacity
        onPress={() => setActiveTab(tab)}
        style={[styles.tabButton, active && styles.tabButtonActive]}
      >
        <Ionicons
          name={icon as any}
          size={18}
          color={active ? '#FFFFFF' : '#6B7280'}
        />

        <Text
          style={[styles.tabButtonText, active && styles.tabButtonTextActive]}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderGoalAndDateSection = () => {
    return (
      <>
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

        <Text className="font-semibold mt-6">Mức độ theo onboarding</Text>

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
                <Text className={selected ? 'text-white' : 'text-black'}>
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
          onChangeText={text => {
            setDurationWeeks(text);
            setManualStages([]);
          }}
          keyboardType="numeric"
          returnKeyType="done"
          onSubmitEditing={Keyboard.dismiss}
          placeholder="Nhập số tuần"
        />

        <Text className="font-semibold mt-6">Ngày bắt đầu</Text>

        <Pressable
          onPress={() => setShowCalendar(prev => !prev)}
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
                setManualStages([]);
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
      </>
    );
  };

  const renderAiTab = () => {
    return (
      <View className="bg-white rounded-lg p-6 border border-gray-200 mt-4">
        {renderGoalAndDateSection()}

        <TouchableOpacity
          onPress={submitAiRoadmap}
          disabled={submitting}
          className={`h-12 rounded-lg items-center justify-center mt-6 ${
            submitting ? 'bg-gray-400' : 'bg-foreground'
          }`}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white text-lg font-semibold">Tạo bằng AI</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  const renderManualTab = () => {
    return (
      <View className="bg-white rounded-lg p-6 border border-gray-200 mt-4">
        {renderGoalAndDateSection()}

        <Text className="font-semibold mt-6">Tên lộ trình</Text>

        <TextInput
          className="border border-gray-200 rounded-lg px-4 py-3 mt-2 text-base"
          value={manualTitle}
          onChangeText={setManualTitle}
          placeholder="Nhập tên lộ trình"
          returnKeyType="done"
          onSubmitEditing={Keyboard.dismiss}
        />

        <Text className="font-semibold mt-6">Mô tả lộ trình</Text>

        <TextInput
          className="border border-gray-200 rounded-lg px-4 py-3 mt-2 text-base"
          value={manualDescription}
          onChangeText={setManualDescription}
          placeholder="Nhập mô tả"
          multiline
          textAlignVertical="top"
          style={styles.textArea}
        />

        <ManualRoadmapBuilder
          exercises={exercises}
          loadingExercises={loadingExercises}
          onReloadExercises={loadExercises}
          totalWeeks={totalWeeks}
          trainingDays={trainingDays}
          manualStages={manualStages}
          setManualStages={setManualStages}
        />

        {manualStages.length > 0 ? (
          <TouchableOpacity
            onPress={submitManualRoadmap}
            disabled={submitting}
            className={`h-12 rounded-lg items-center justify-center mt-6 ${
              submitting ? 'bg-gray-400' : 'bg-foreground'
            }`}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white text-lg font-semibold">
                Tạo thủ công
              </Text>
            )}
          </TouchableOpacity>
        ) : null}
      </View>
    );
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
                Tạo Lộ Trình
              </Text>

              <View className="w-7" />
            </View>

            <ScrollView
              className="px-4"
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.tabContainer}>
                {renderTabButton('AI', 'Gen AI', 'sparkles-outline')}
                {renderTabButton('MANUAL', 'Tự thêm', 'create-outline')}
              </View>

              {activeTab === 'AI' ? renderAiTab() : renderManualTab()}
            </ScrollView>

            <ModalPopup {...(modalProps as any)} onClose={closeModal} />
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default CreateRoadmapScreen;

const styles = StyleSheet.create({
  keyboardAvoiding: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 140,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 6,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  tabButton: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  tabButtonActive: {
    backgroundColor: '#A0522D',
  },
  tabButtonText: {
    color: '#6B7280',
    fontWeight: '700',
    fontSize: 14,
  },
  tabButtonTextActive: {
    color: '#FFFFFF',
  },
  textArea: {
    minHeight: 90,
  },
});