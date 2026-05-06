import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
} from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';

import { ExerciseType } from '../../utils/ExerciseType';
import { ManualExerciseItem, ManualStageItem } from './types/manualRoadmap.types';
import { buildManualStagesByWeeks } from './utils/manualRoadmap.utils';

type Props = {
  exercises: ExerciseType[];
  loadingExercises: boolean;
  onReloadExercises: () => void | Promise<void>;

  totalWeeks: number;
  trainingDays: string[];

  manualStages: ManualStageItem[];
  setManualStages: React.Dispatch<React.SetStateAction<ManualStageItem[]>>;
};

const WEEKDAY_LABELS_VN: Record<string, string> = {
  MONDAY: 'Thứ 2',
  TUESDAY: 'Thứ 3',
  WEDNESDAY: 'Thứ 4',
  THURSDAY: 'Thứ 5',
  FRIDAY: 'Thứ 6',
  SATURDAY: 'Thứ 7',
  SUNDAY: 'Chủ nhật',
};

type PickerTarget = {
  stageId: string;
  scheduleId: string;
} | null;

const ManualRoadmapBuilder: React.FC<Props> = ({
  exercises,
  loadingExercises,
  onReloadExercises,
  totalWeeks,
  trainingDays,
  manualStages,
  setManualStages,
}) => {
  const [pickerTarget, setPickerTarget] = useState<PickerTarget>(null);
  const [searchText, setSearchText] = useState('');
  const [expandedExerciseKey, setExpandedExerciseKey] = useState<string | null>(
    null,
  );

  const filteredExercises = useMemo(() => {
    const list = Array.isArray(exercises) ? exercises : [];
    const keyword = searchText.trim().toLowerCase();

    if (!keyword) return list;

    return list.filter(item => {
      const name = getExerciseName(item).toLowerCase();
      return name.includes(keyword);
    });
  }, [exercises, searchText]);

  const handleGenerateStages = () => {
    const safeWeeks = totalWeeks > 0 ? totalWeeks : 4;
    const stages = buildManualStagesByWeeks(safeWeeks, trainingDays);

    setExpandedExerciseKey(null);
    setPickerTarget(null);
    setSearchText('');
    setManualStages(stages);
  };

  const openExercisePicker = async (stageId: string, scheduleId: string) => {
    console.log('[ManualBuilder] Press thêm bài:', {
      stageId,
      scheduleId,
      currentExercisesLength: Array.isArray(exercises) ? exercises.length : 0,
    });

    const isSamePicker =
      pickerTarget?.stageId === stageId &&
      pickerTarget?.scheduleId === scheduleId;

    if (isSamePicker) {
      setPickerTarget(null);
      setSearchText('');
      return;
    }

    setPickerTarget({ stageId, scheduleId });
    setSearchText('');

    if (!Array.isArray(exercises) || exercises.length === 0) {
      await onReloadExercises();
    }
  };

  const closeExercisePicker = () => {
    setPickerTarget(null);
    setSearchText('');
  };

  const toggleExerciseExpand = (
    stageId: string,
    scheduleId: string,
    exerciseId: string,
    exerciseIndex: number,
  ) => {
    const key = `${stageId}-${scheduleId}-${exerciseId}-${exerciseIndex}`;

    setExpandedExerciseKey(prev => (prev === key ? null : key));
  };

  const addExerciseToSchedule = (exercise: ExerciseType) => {
    if (!pickerTarget) return;

    const exerciseId = getExerciseId(exercise);

    if (!exerciseId) return;

    const newExercise: ManualExerciseItem = {
      exerciseId,
      exerciseName: getExerciseName(exercise),
      imageUrl: null, // remove image
      sets: '3',
      reps: '2', // reps removed
      durationSeconds: '60',
      restSeconds: '30',
      notes: '',
    };

    setManualStages(prev =>
      prev.map(stage => {
        if (stage.id !== pickerTarget.stageId) return stage;

        return {
          ...stage,
          schedules: stage.schedules.map(schedule => {
            if (schedule.id !== pickerTarget.scheduleId) return schedule;

            const existed = schedule.exercises.some(
              item => item.exerciseId === exerciseId,
            );

            if (existed) return schedule;

            return {
              ...schedule,
              exercises: [...schedule.exercises, newExercise],
            };
          }),
        };
      }),
    );

    closeExercisePicker();
  };

  const removeExerciseFromSchedule = (
    stageId: string,
    scheduleId: string,
    exerciseId: string,
  ) => {
    setManualStages(prev =>
      prev.map(stage => {
        if (stage.id !== stageId) return stage;

        return {
          ...stage,
          schedules: stage.schedules.map(schedule => {
            if (schedule.id !== scheduleId) return schedule;

            return {
              ...schedule,
              exercises: schedule.exercises.filter(
                item => item.exerciseId !== exerciseId,
              ),
            };
          }),
        };
      }),
    );

    setExpandedExerciseKey(null);
  };

  const updateStageField = (
    stageId: string,
    field: keyof ManualStageItem,
    value: string,
  ) => {
    setManualStages(prev =>
      prev.map(stage =>
        stage.id === stageId
          ? {
              ...stage,
              [field]: value,
            }
          : stage,
      ),
    );
  };

  const updateScheduleField = (
    stageId: string,
    scheduleId: string,
    field: 'scheduleName' | 'description',
    value: string,
  ) => {
    setManualStages(prev =>
      prev.map(stage => {
        if (stage.id !== stageId) return stage;

        return {
          ...stage,
          schedules: stage.schedules.map(schedule =>
            schedule.id === scheduleId
              ? {
                  ...schedule,
                  [field]: value,
                }
              : schedule,
          ),
        };
      }),
    );
  };

  const updateExerciseField = (
    stageId: string,
    scheduleId: string,
    exerciseId: string,
    field: keyof ManualExerciseItem,
    value: string,
  ) => {
    setManualStages(prev =>
      prev.map(stage => {
        if (stage.id !== stageId) return stage;

        return {
          ...stage,
          schedules: stage.schedules.map(schedule => {
            if (schedule.id !== scheduleId) return schedule;

            return {
              ...schedule,
              exercises: schedule.exercises.map(exercise =>
                exercise.exerciseId === exerciseId
                  ? {
                      ...exercise,
                      [field]: value,
                    }
                  : exercise,
              ),
            };
          }),
        };
      }),
    );
  };

  const duplicateScheduleExercises = (
    stageId: string,
    fromScheduleId: string,
    toScheduleId: string,
  ) => {
    setManualStages(prev =>
      prev.map(stage => {
        if (stage.id !== stageId) return stage;

        const fromSchedule = stage.schedules.find(
          item => item.id === fromScheduleId,
        );

        if (!fromSchedule) return stage;

        return {
          ...stage,
          schedules: stage.schedules.map(schedule => {
            if (schedule.id !== toScheduleId) return schedule;

            return {
              ...schedule,
              exercises: fromSchedule.exercises.map(item => ({
                ...item,
              })),
            };
          }),
        };
      }),
    );
  };

  const renderInlineExercisePicker = (stageId: string, scheduleId: string) => {
    const isVisible =
      pickerTarget?.stageId === stageId &&
      pickerTarget?.scheduleId === scheduleId;

    if (!isVisible) return null;

    return (
      <View style={styles.inlinePickerBox}>
        <View style={styles.inlinePickerHeader}>
          <Text style={styles.inlinePickerTitle}>
            Chọn bài tập ({filteredExercises.length})
          </Text>

          <TouchableOpacity onPress={closeExercisePicker}>
            <Text style={styles.inlinePickerClose}>Đóng</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.searchWrapperInline}>
          <Ionicons name="search-outline" size={18} color="#9CA3AF" />

          <TextInput
            value={searchText}
            onChangeText={setSearchText}
            placeholder="Tìm bài tập..."
            placeholderTextColor="#9CA3AF"
            style={styles.searchInputInline}
          />
        </View>

        {loadingExercises ? (
          <View style={styles.inlineLoadingBox}>
            <ActivityIndicator color="#8B4513" />
            <Text style={styles.loadingText}>Đang tải bài tập...</Text>
          </View>
        ) : filteredExercises.length === 0 ? (
          <View style={styles.emptyListBox}>
            <Text style={styles.emptyListText}>
              Không có bài tập nào để hiển thị.
            </Text>

            <TouchableOpacity
              style={styles.reloadButton}
              onPress={onReloadExercises}
            >
              <Text style={styles.reloadButtonText}>Tải lại bài tập</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView
            style={styles.inlineExerciseList}
            nestedScrollEnabled={true}
            contentContainerStyle={styles.inlineExerciseListContent}
          >
            {filteredExercises.map((item, index) => {
              const exerciseId = getExerciseId(item);
              const name = getExerciseName(item);

              return (
                <TouchableOpacity
                  key={String(exerciseId ?? index)}
                  style={styles.exerciseOption}
                  onPress={() => addExerciseToSchedule(item)}
                  activeOpacity={0.85}
                >
                  <View style={styles.exerciseOptionPlaceholder}>
                    <Ionicons name="barbell-outline" size={22} color="#8B4513" />
                  </View>

                  <View style={styles.flex1}>
                    <Text style={styles.exerciseOptionName} numberOfLines={1}>
                      {name || 'Không có tên bài tập'}
                    </Text>

                    <Text style={styles.exerciseOptionMeta} numberOfLines={1}>
                      {(item as any)?.difficultyLevel ??
                        (item as any)?.level ??
                        'Bài tập'}
                    </Text>
                  </View>

                  <Ionicons name="add-circle-outline" size={24} color="#8B4513" />
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      </View>
    );
  };

  const renderExerciseCard = (
    stageId: string,
    scheduleId: string,
    exercise: ManualExerciseItem,
    exerciseIndex: number,
  ) => {
    const exerciseKey = `${stageId}-${scheduleId}-${exercise.exerciseId}-${exerciseIndex}`;
    const expanded = expandedExerciseKey === exerciseKey;

    return (
      <View
        key={exerciseKey}
        style={[
          styles.exerciseCardCompact,
          expanded && styles.exerciseCardCompactActive,
        ]}
      >
        <View style={styles.exerciseCompactHeader}>
          <View style={styles.exerciseIndex}>
            <Text style={styles.exerciseIndexText}>{exerciseIndex + 1}</Text>
          </View>

          <View style={styles.exerciseImagePlaceholderCompact}>
            <Ionicons name="barbell-outline" size={20} color="#8B4513" />
          </View>

          <View style={styles.exerciseCompactInfo}>
            <Text style={styles.exerciseNameCompact} numberOfLines={1}>
              {exercise.exerciseName}
            </Text>

            <Text style={styles.exerciseSummary} numberOfLines={1}>
              {exercise.sets} sets • {exercise.durationSeconds}s tập • {exercise.restSeconds}s nghỉ
            </Text>
          </View>

          <TouchableOpacity
            style={styles.editExerciseButton}
            onPress={() =>
              toggleExerciseExpand(
                stageId,
                scheduleId,
                exercise.exerciseId,
                exerciseIndex,
              )
            }
          >
            <Ionicons
              name={expanded ? 'chevron-up-outline' : 'create-outline'}
              size={18}
              color="#8B4513"
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.deleteExerciseButtonCompact}
            onPress={() =>
              removeExerciseFromSchedule(
                stageId,
                scheduleId,
                exercise.exerciseId,
              )
            }
          >
            <Ionicons name="trash-outline" size={18} color="#EF4444" />
          </TouchableOpacity>
        </View>

        {expanded ? (
          <View style={styles.exerciseEditPanel}>
            <View style={styles.exerciseGrid}>
              <SmallField
                label="Sets"
                value={exercise.sets}
                onChangeText={value =>
                  updateExerciseField(
                    stageId,
                    scheduleId,
                    exercise.exerciseId,
                    'sets',
                    value,
                  )
                }
              />

             

              <SmallField
                label="Thời gian tập(s)"
                value={exercise.durationSeconds}
                onChangeText={value =>
                  updateExerciseField(
                    stageId,
                    scheduleId,
                    exercise.exerciseId,
                    'durationSeconds',
                    value,
                  )
                }
              />

              <SmallField
                label="Thời gian nghỉ(s)"
                value={exercise.restSeconds}
                onChangeText={value =>
                  updateExerciseField(
                    stageId,
                    scheduleId,
                    exercise.exerciseId,
                    'restSeconds',
                    value,
                  )
                }
              />
            </View>

            <Text style={styles.inputLabel}>Ghi chú</Text>
            <TextInput
              style={[styles.input, styles.textAreaSmall]}
              value={exercise.notes}
              onChangeText={value =>
                updateExerciseField(
                  stageId,
                  scheduleId,
                  exercise.exerciseId,
                  'notes',
                  value,
                )
              }
              placeholder="Nhập ghi chú cho bài tập"
              placeholderTextColor="#9CA3AF"
              multiline
              textAlignVertical="top"
            />
          </View>
        ) : null}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {trainingDays.length === 0 ? (
        <View style={styles.topWarningBox}>
          <Text style={styles.topWarningText}>
            Vui lòng chọn ít nhất một ngày tập ở trên. Nút tạo thủ công sẽ bị vô hiệu hóa nếu không có ngày tập.
          </Text>
        </View>
      ) : null}

      <View style={styles.infoCard}>
        <View style={styles.infoIconBox}>
          <Ionicons name="layers-outline" size={22} color="#8B4513" />
        </View>

        <View style={styles.flex1}>
          <Text style={styles.infoTitle}>Tạo lộ trình thủ công</Text>

          <Text style={styles.infoText}>
            Mỗi 4 tuần sẽ thành 1 giai đoạn. Mỗi giai đoạn có các buổi tập theo
            ngày bạn đã chọn.
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.generateButton}
        onPress={handleGenerateStages}
        activeOpacity={0.85}
      >
        <Ionicons name="construct-outline" size={20} color="#FFFFFF" />

        <Text style={styles.generateButtonText}>
          {manualStages.length > 0 ? 'Tạo lại roadmap' : 'Tạo roadmap'}
        </Text>
      </TouchableOpacity>

      {manualStages.map(stage => (
        <View key={stage.id} style={styles.stageCard}>
          <View style={styles.stageHeader}>
            <View style={styles.stageBadge}>
              <Text style={styles.stageBadgeText}>{stage.stageOrder}</Text>
            </View>

            <View style={styles.flex1}>
              <Text style={styles.stageTitle}>Giai đoạn {stage.stageOrder}</Text>

              <Text style={styles.stageSub}>
                {stage.durationWeeks} tuần • {stage.schedules.length} buổi /
                tuần
              </Text>
            </View>
          </View>

          <Text style={styles.inputLabel}>Tên giai đoạn</Text>
          <TextInput
            style={styles.input}
            value={stage.stageName}
            onChangeText={value =>
              updateStageField(stage.id, 'stageName', value)
            }
            placeholder="Nhập tên giai đoạn"
            placeholderTextColor="#9CA3AF"
          />

          <Text style={styles.inputLabel}>Mô tả giai đoạn</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={stage.description}
            onChangeText={value =>
              updateStageField(stage.id, 'description', value)
            }
            placeholder="Nhập mô tả giai đoạn"
            placeholderTextColor="#9CA3AF"
            multiline
            textAlignVertical="top"
          />

          {stage.schedules.map((schedule, scheduleIndex) => {
            const previousSchedule =
              scheduleIndex > 0 ? stage.schedules[scheduleIndex - 1] : null;

            return (
              <View key={schedule.id} style={styles.scheduleCard}>
                <View style={styles.scheduleHeader}>
                  <View style={styles.dayBadge}>
                    <Text style={styles.dayBadgeText}>
                      {WEEKDAY_LABELS_VN[schedule.dayOfWeek] ??
                        schedule.dayOfWeek}
                    </Text>
                  </View>

                  <TouchableOpacity
                    onPress={() => openExercisePicker(stage.id, schedule.id)}
                    style={styles.addExerciseButton}
                    activeOpacity={0.85}
                  >
                    <Ionicons
                      name="add-circle-outline"
                      size={18}
                      color="#8B4513"
                    />

                    <Text style={styles.addExerciseText}>Thêm bài</Text>
                  </TouchableOpacity>
                </View>

                {renderInlineExercisePicker(stage.id, schedule.id)}

                <Text style={styles.inputLabel}>Tên buổi tập</Text>
                <TextInput
                  style={styles.input}
                  value={schedule.scheduleName}
                  onChangeText={value =>
                    updateScheduleField(
                      stage.id,
                      schedule.id,
                      'scheduleName',
                      value,
                    )
                  }
                  placeholder="Nhập tên buổi tập"
                  placeholderTextColor="#9CA3AF"
                />

                <Text style={styles.inputLabel}>Mô tả buổi tập</Text>
                <TextInput
                  style={[styles.input, styles.textAreaSmall]}
                  value={schedule.description}
                  onChangeText={value =>
                    updateScheduleField(
                      stage.id,
                      schedule.id,
                      'description',
                      value,
                    )
                  }
                  placeholder="Nhập mô tả buổi tập"
                  placeholderTextColor="#9CA3AF"
                  multiline
                  textAlignVertical="top"
                />

                {previousSchedule &&
                previousSchedule.exercises.length > 0 &&
                schedule.exercises.length === 0 ? (
                  <TouchableOpacity
                    style={styles.copyButton}
                    onPress={() =>
                      duplicateScheduleExercises(
                        stage.id,
                        previousSchedule.id,
                        schedule.id,
                      )
                    }
                    activeOpacity={0.85}
                  >
                    <Ionicons name="copy-outline" size={16} color="#8B4513" />

                    <Text style={styles.copyButtonText}>
                      Copy bài từ buổi trước
                    </Text>
                  </TouchableOpacity>
                ) : null}

                {schedule.exercises.length === 0 ? (
                  <View style={styles.emptyExerciseBox}>
                    <Text style={styles.emptyExerciseText}>
                      Chưa có bài tập trong buổi này.
                    </Text>
                    <Text style={styles.scheduleWarningText}>
                      Buổi tập trống — vui lòng thêm ít nhất 1 bài để có thể tạo roadmap.
                    </Text>
                  </View>
                ) : (
                  <View style={styles.addedExerciseList}>
                    <Text style={styles.addedExerciseTitle}>
                      Bài tập đã thêm ({schedule.exercises.length})
                    </Text>

                    {schedule.exercises.map((exercise, exerciseIndex) =>
                      renderExerciseCard(
                        stage.id,
                        schedule.id,
                        exercise,
                        exerciseIndex,
                      ),
                    )}
                  </View>
                )}
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
};

type SmallFieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
};

const SmallField = ({ label, value, onChangeText }: SmallFieldProps) => {
  return (
    <View style={styles.smallField}>
      <Text style={styles.smallFieldLabel}>{label}</Text>

      <TextInput
        style={styles.smallInput}
        value={value}
        onChangeText={v => {
          // do not accept a single '0' as input, allow empty string
          if (v === '0') return;
          onChangeText(v);
        }}
        keyboardType="numeric"
        placeholder="0"
        placeholderTextColor="#9CA3AF"
        editable={true}
      />
    </View>
  );
};

const getExerciseId = (item: any) => {
  return (
    item?.exerciseId ??
    item?.id ??
    item?.exercise_id ??
    item?.exerciseID ??
    item?.exercise?.exerciseId ??
    null
  );
};

const getExerciseName = (item: any) => {
  return (
    item?.exerciseName ??
    item?.name ??
    item?.title ??
    item?.exercise?.exerciseName ??
    item?.exercise?.name ??
    ''
  );
};

export default ManualRoadmapBuilder;

const styles = StyleSheet.create({
  container: {
    marginTop: 18,
  },
  infoCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#FFF8F2',
    borderWidth: 1,
    borderColor: '#F1DFD0',
    borderRadius: 18,
    padding: 14,
  },
  infoIconBox: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F3EDE3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoTitle: {
    color: '#3A2A1A',
    fontWeight: '900',
    fontSize: 15,
  },
  infoText: {
    marginTop: 4,
    color: '#6B6B6B',
    fontSize: 13,
    lineHeight: 19,
  },
  generateButton: {
    marginTop: 14,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#8B4513',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  generateButtonText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 15,
  },
  stageCard: {
    marginTop: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EFE2D6',
  },
  stageHeader: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    marginBottom: 14,
  },
  stageBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#8B4513',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stageBadgeText: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  stageTitle: {
    color: '#3A2A1A',
    fontSize: 17,
    fontWeight: '900',
  },
  stageSub: {
    marginTop: 3,
    color: '#6B6B6B',
    fontSize: 13,
  },
  inputLabel: {
    marginTop: 10,
    marginBottom: 7,
    color: '#8B4513',
    fontSize: 13,
    fontWeight: '800',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5D6C8',
    backgroundColor: '#FFFDFB',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 11,
    color: '#3A2A1A',
    fontSize: 14,
  },
  textArea: {
    minHeight: 82,
  },
  textAreaSmall: {
    minHeight: 68,
  },
  scheduleCard: {
    marginTop: 16,
    backgroundColor: '#FFFDFB',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F1DFD0',
  },
  scheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayBadge: {
    backgroundColor: '#F3EDE3',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  dayBadgeText: {
    color: '#8B4513',
    fontWeight: '900',
    fontSize: 13,
  },
  addExerciseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFF8F2',
    borderWidth: 1,
    borderColor: '#F1DFD0',
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 999,
  },
  addExerciseText: {
    color: '#8B4513',
    fontWeight: '900',
    fontSize: 13,
  },
  inlinePickerBox: {
    marginTop: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5D6C8',
    padding: 12,
  },
  inlinePickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  inlinePickerTitle: {
    color: '#3A2A1A',
    fontWeight: '900',
    fontSize: 15,
  },
  inlinePickerClose: {
    color: '#8B4513',
    fontWeight: '900',
  },
  searchWrapperInline: {
    backgroundColor: '#FFFDFB',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5D6C8',
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  searchInputInline: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    color: '#3A2A1A',
  },
  inlineLoadingBox: {
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inlineExerciseList: {
    gap: 10,
    maxHeight: 240,
  },
  inlineExerciseListContent: {
    paddingBottom: 10,
  },
  flex1: {
    flex: 1,
  },
  copyButton: {
    marginTop: 12,
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#FFF8F2',
    borderWidth: 1,
    borderColor: '#F1DFD0',
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 999,
  },
  copyButtonText: {
    color: '#8B4513',
    fontWeight: '800',
    fontSize: 12,
  },
  emptyExerciseBox: {
    marginTop: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EFE2D6',
  },
  emptyExerciseText: {
    color: '#6B6B6B',
    textAlign: 'center',
  },
  addedExerciseList: {
    marginTop: 14,
    backgroundColor: '#F7FAFC',
    borderRadius: 16,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  addedExerciseTitle: {
    color: '#334155',
    fontWeight: '900',
    fontSize: 13,
    marginBottom: 2,
  },
  exerciseCardCompact: {
    marginTop: 10,
    backgroundColor: '#EEF6FF',
    borderRadius: 16,
    padding: 10,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  exerciseCardCompactActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#8B4513',
  },
  exerciseCompactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  exerciseIndex: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  exerciseIndexText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  exerciseImageCompact: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#DBEAFE',
  },
  exerciseImagePlaceholderCompact: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  exerciseCompactInfo: {
    flex: 1,
  },
  exerciseNameCompact: {
    color: '#1E293B',
    fontWeight: '900',
    fontSize: 14,
  },
  exerciseSummary: {
    marginTop: 4,
    color: '#475569',
    fontSize: 12,
  },
  editExerciseButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFF8F2',
    borderWidth: 1,
    borderColor: '#F1DFD0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteExerciseButtonCompact: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  exerciseEditPanel: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1DFD0',
  },
  exerciseGrid: {
    marginTop: 4,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  smallField: {
    width: '47%',
  },
  smallFieldLabel: {
    color: '#6B6B6B',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  smallInput: {
    height: 42,
    borderWidth: 1,
    borderColor: '#E5D6C8',
    backgroundColor: '#FFFDFB',
    borderRadius: 12,
    paddingHorizontal: 12,
    color: '#3A2A1A',
  },
  loadingText: {
    marginTop: 10,
    color: '#6B6B6B',
  },
  exerciseOption: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: '#EFE2D6',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  exerciseOptionImage: {
    width: 58,
    height: 58,
    borderRadius: 14,
    backgroundColor: '#F3EDE3',
  },
  exerciseOptionPlaceholder: {
    width: 58,
    height: 58,
    borderRadius: 14,
    backgroundColor: '#F3EDE3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  exerciseOptionName: {
    color: '#3A2A1A',
    fontWeight: '900',
    fontSize: 15,
  },
  exerciseOptionMeta: {
    marginTop: 5,
    color: '#6B6B6B',
    fontSize: 13,
  },
  emptyListBox: {
    alignItems: 'center',
    padding: 24,
  },
  emptyListText: {
    color: '#6B6B6B',
  },
  reloadButton: {
    marginTop: 12,
    backgroundColor: '#8B4513',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  reloadButtonText: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  topWarningBox: {
    marginTop: 12,
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: '#FECACA',
    padding: 10,
    borderRadius: 12,
  },
  topWarningText: {
    color: '#B91C1C',
    fontWeight: '700',
  },
  scheduleWarningText: {
    marginTop: 8,
    color: '#B91C1C',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
});