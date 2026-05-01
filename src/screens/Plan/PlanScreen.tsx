import React, { useState, useMemo } from "react";
import {
  ScrollView,
  Text,
  View,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { useRoadmapStore } from "../../store/roadmap.store";

import SupplementSection from "./components/SupplementSection";
import StageCalendar from "./components/StageCalendar";
import ScheduleDetail from "./components/ScheduleDetail";
import BottomActionBar from "./components/BottomActionBar";
import { SafeAreaView } from "react-native-safe-area-context";
import StageCarousel from "./components/StageCarousel";
import axios from "../../hooks/axiosInstance";
import { getProfile } from "../../services/auth";
import StageRendererApi from "./components/StageRendererApi";
import ModalPopup from "../../components/ModalPopup";

const PlanScreen = () => {
  const route: any = useRoute();
  const nav: any = useNavigation();

  const storeList = useRoadmapStore((s) => s.list);
  const addRoadmap = useRoadmapStore((s) => s.addRoadmap);

  const paramAdded = route.params?.addedRoadmap ?? null;

  const roadmap = React.useMemo(() => {
    return (
      paramAdded?.roadmap ?? route.params?.roadmap ?? storeList?.[0]?.roadmap ?? null
    );
  }, [paramAdded, route.params?.roadmap, storeList]);

  const stages = React.useMemo(() => {
    return (
      paramAdded?.stages ?? route.params?.stages ?? storeList?.[0]?.stages ?? []
    );
  }, [paramAdded, route.params?.stages, storeList]);

  const [editableStages, setEditableStages] = useState<any[]>([]);
  const [selectedStageIndex, setSelectedStageIndex] = useState(0);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [modalProps, setModalProps] = useState<any>({ visible: false });
  const showModal = (opts: any) => setModalProps({ visible: true, ...opts });
  const closeModal = () => setModalProps({ visible: false });

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editContext, setEditContext] = useState<any>(null);

  const [editExerciseName, setEditExerciseName] = useState("");
  const [editSets, setEditSets] = useState("");
  const [editReps, setEditReps] = useState("");
  const [editDurationSeconds, setEditDurationSeconds] = useState("");

  React.useEffect(() => {
    if (Array.isArray(stages) && stages.length > 0) {
      setEditableStages(stages);
    }
  }, [stages]);

  const stagesSource = editableStages.length ? editableStages : stages;

  const shiftDateString = (dateStr: any, hours: number) => {
    if (!dateStr || typeof dateStr !== "string") return dateStr;

    try {
      const d = new Date(dateStr);

      if (isNaN(d.getTime())) return dateStr;

      d.setHours(d.getHours() + hours);

      return d.toISOString();
    } catch {
      return dateStr;
    }
  };

  const displayRoadmap = useMemo(() => {
    if (!roadmap) return roadmap;

    const copied: any = { ...roadmap };

    if (copied.generatedAt) {
      copied.generatedAt = shiftDateString(copied.generatedAt, 7);
    }

    return copied;
  }, [roadmap]);

  const displayStages = useMemo(() => {
    if (!Array.isArray(stagesSource)) return stagesSource;

    return stagesSource.map((stg: any) => {
      if (!stg) return stg;

      const schedules = Array.isArray(stg.schedules)
        ? stg.schedules
        : stg?.stage?.schedules ?? null;

      if (!schedules) return stg;

      const shifted = schedules.map((sch: any) => {
        if (!sch) return sch;

        const out = { ...sch };

        if (out.scheduledDate) {
          out.scheduledDate = shiftDateString(out.scheduledDate, 7);
        }

        if (out.startTime) {
          out.startTime = shiftDateString(out.startTime, 7);
        }

        if (out.endTime) {
          out.endTime = shiftDateString(out.endTime, 7);
        }

        return out;
      });

      if (Array.isArray(stg.schedules)) {
        return { ...stg, schedules: shifted };
      }

      if (stg.stage) {
        return {
          ...stg,
          stage: {
            ...stg.stage,
            schedules: shifted,
          },
        };
      }

      return stg;
    });
  }, [stagesSource]);

  const handleSelectDate = (date: string | null) => {
    setSelectedDate(date);
    setShowScheduleModal(true);
  };

  const openExerciseEditor = (
    stageIndex: number,
    scheduleIndex: number,
    exerciseIndex: number,
    exercise: any
  ) => {
    setEditContext({
      stageIndex,
      scheduleIndex,
      exerciseIndex,
    });

    setEditExerciseName(exercise.exerciseName ?? "");
    setEditSets(String(exercise.sets ?? ""));
    setEditReps(String(exercise.reps ?? ""));
    setEditDurationSeconds(String(exercise.durationSeconds ?? ""));

    setEditModalVisible(true);
  };

  const handleSaveExerciseEdit = () => {
    if (!editContext) return;

    const { stageIndex, scheduleIndex, exerciseIndex } = editContext;

    setEditableStages((prev) => {
      const newStages = [...prev];

      const oldExercise =
        newStages[stageIndex]?.schedules?.[scheduleIndex]?.exercises?.[
          exerciseIndex
        ];

      if (!oldExercise) return prev;

      newStages[stageIndex].schedules[scheduleIndex].exercises[exerciseIndex] = {
        ...oldExercise,
        exerciseName: editExerciseName,
        sets: editSets ? Number(editSets) : oldExercise.sets,
        reps: editReps ? Number(editReps) : oldExercise.reps,
        durationSeconds: editDurationSeconds
          ? Number(editDurationSeconds)
          : oldExercise.durationSeconds,
      };

      return newStages;
    });

    setEditModalVisible(false);
  };

  if (!roadmap || !stagesSource?.length) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center">
        <Text>Không có dữ liệu lộ trình</Text>
      </SafeAreaView>
    );
  }

  const selectedStage = displayStages[selectedStageIndex];

  const selectedScheduleIndex =
    selectedStage?.schedules?.findIndex((s: any) =>
      selectedDate ? s.scheduledDate?.startsWith(selectedDate) : false
    ) ?? -1;

  const selectedSchedule =
    selectedScheduleIndex >= 0
      ? selectedStage?.schedules?.[selectedScheduleIndex]
      : null;

  const isApiShaped =
    Array.isArray(stagesSource) &&
    stagesSource.length > 0 &&
    Boolean(stagesSource[0]?.stage || stagesSource[0]?._raw);

  const handleSaveToServer = async () => {
    try {
      setSaving(true);

      const me = await getProfile();

      const role = me.ok
        ? String(me.data?.account?.role ?? me.data?.role ?? "").toUpperCase()
        : "";

      const userId = me.ok
        ? me.data?.id ?? me.data?.accountId ?? me.data?.memberId ?? null
        : null;

      if (role === "COACH") {
        showModal({
          titleText: "Chú ý",
          contentText:
            "Bạn đang ở vai trò HLV. Vui lòng chọn học viên trước khi lưu lộ trình.",
          mode: "noti",
          onClose: () => {
            setSaving(false);
            closeModal();
          },
        });

        return;
      }

      const aiResponse = {
        ...(roadmap?.raw ?? roadmap),
        stages: editableStages.length ? editableStages : stages,
      };

      const acceptPayload: any = { aiResponse };

      if (userId) {
        acceptPayload.traineeId = userId;
      }

      const primaryGoalId =
        paramAdded?.primaryGoalId ?? roadmap?.primaryGoalId ?? null;

      const secondaryGoalIds =
        paramAdded?.secondaryGoalIds ?? roadmap?.secondaryGoalIds ?? null;

      if (!primaryGoalId) {
        showModal({
          titleText: "Thiếu mục tiêu chính",
          contentText:
            "Vui lòng chọn mục tiêu chính trước khi lưu lộ trình lên server.",
          mode: "noti",
          onClose: () => {
            setSaving(false);
            closeModal();
          },
        });

        return;
      }

      acceptPayload.primaryGoalId = primaryGoalId;

      if (secondaryGoalIds) {
        acceptPayload.secondaryGoalIds = secondaryGoalIds;
      }

      const res = await axios.post(
        "/roadmaps/ai-generated/accept",
        acceptPayload
      );

      const data = res.data?.data ?? res.data ?? res;

      const roadmapFromServer = data?.roadmap ?? roadmap;
      const stagesFromServer = data?.stages ?? editableStages ?? stages;

      addRoadmap({
        roadmap: roadmapFromServer,
        stages: stagesFromServer,
        createdAt: Date.now(),
      });

      const goToRoadmap = () => {
        closeModal();

        nav.reset({
          index: 0,
          routes: [
            {
              name: "MainTabs",
              params: {
                screen: "Roadmap",
              },
            },
          ],
        });
      };

      showModal({
        titleText: "Thành công",
        contentText: "Lộ trình đã được lưu.",
        mode: "noti",
        onConfirm: goToRoadmap,
        onClose: goToRoadmap,
      });
    } catch (e: any) {
      console.error("Save roadmap error:", e);

      const message =
        e?.response?.data?.message || e?.message || "Không thể lưu lộ trình.";

      showModal({
        titleText: "Lưu thất bại",
        contentText: message,
        mode: "noti",
        onClose: () => {
          closeModal();
        },
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F3EDE3]">
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View className="px-5 mt-4">
          <Text className="text-2xl font-bold text-[#8B4513]">
            {displayRoadmap?.title ?? roadmap.title}
          </Text>

          {displayRoadmap?.description ?? roadmap.description ? (
            <Text className="text-gray-600 mt-2">
              {displayRoadmap?.description ?? roadmap.description}
            </Text>
          ) : null}
        </View>

        <View className="mt-6">
          <Text className="text-lg font-semibold text-[#8B4513] mb-3 px-2">
            Giai đoạn
          </Text>

          {isApiShaped ? (
            <StageRendererApi
              apiStages={displayStages}
              roadmap={displayRoadmap ?? roadmap}
            />
          ) : (
            <StageCarousel
              stages={displayStages}
              onChangeIndex={setSelectedStageIndex}
            />
          )}
        </View>

        {isApiShaped ? null : (
          <>
            <StageCalendar
              stage={selectedStage}
              selectedDate={selectedDate}
              onSelectDate={handleSelectDate}
            />

            <Modal
              visible={showScheduleModal}
              animationType="slide"
              onRequestClose={() => setShowScheduleModal(false)}
            >
              <View style={styles.modalContainer}>
                <View style={styles.modalHeader}>
                  <Text
                    style={styles.closeText}
                    onPress={() => setShowScheduleModal(false)}
                  >
                    Đóng
                  </Text>
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent}>
                  {selectedSchedule ? (
                    <ScheduleDetail
                      schedule={selectedSchedule}
                      isPreview={Boolean(paramAdded)}
                      onVideoModalChange={() => {}}
                      onEditExercise={(exerciseIndex: number, exercise: any) => {
                        if (selectedScheduleIndex < 0) return;

                        openExerciseEditor(
                          selectedStageIndex,
                          selectedScheduleIndex,
                          exerciseIndex,
                          exercise
                        );
                      }}
                    />
                  ) : (
                    <View style={styles.emptyModalContent}>
                      <Text style={styles.modalEmptyTitle}>
                        Không có lịch cho ngày này.
                      </Text>

                      <Text style={styles.modalEmptyText}>
                        Vui lòng chọn ngày có lịch để xem bài tập.
                      </Text>
                    </View>
                  )}
                </ScrollView>
              </View>
            </Modal>

            <SupplementSection stage={selectedStage} />
          </>
        )}
      </ScrollView>

      <BottomActionBar onSave={handleSaveToServer} saving={saving} />

      <Modal
        visible={editModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.editBackdrop}>
          <View style={styles.editSheet}>
            <View style={styles.sheetHandle} />

            <Text style={styles.editTitle}>Chỉnh sửa bài tập</Text>

            <Text style={styles.editLabel}>Tên bài tập</Text>
            <TextInput
              style={styles.editInput}
              value={editExerciseName}
              onChangeText={setEditExerciseName}
              placeholder="Tên bài tập"
            />

            <View style={styles.editRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.editLabel}>Sets</Text>
                <TextInput
                  style={styles.editInput}
                  value={editSets}
                  onChangeText={setEditSets}
                  keyboardType="numeric"
                  placeholder="Sets"
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.editLabel}>Reps</Text>
                <TextInput
                  style={styles.editInput}
                  value={editReps}
                  onChangeText={setEditReps}
                  keyboardType="numeric"
                  placeholder="Reps"
                />
              </View>
            </View>

            <Text style={styles.editLabel}>Thời lượng giây</Text>
            <TextInput
              style={styles.editInput}
              value={editDurationSeconds}
              onChangeText={setEditDurationSeconds}
              keyboardType="numeric"
              placeholder="Duration seconds"
            />

            <View style={styles.editActions}>
              <TouchableOpacity
                style={styles.cancelEditBtn}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.cancelEditText}>Huỷ</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveEditBtn}
                onPress={handleSaveExerciseEdit}
              >
                <Text style={styles.saveEditText}>Lưu thay đổi</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {modalProps?.visible ? (
        <ModalPopup
          visible={modalProps.visible}
          titleText={modalProps.titleText}
          contentText={modalProps.contentText}
          mode={modalProps.mode}
          onConfirm={() => {
            modalProps.onConfirm?.();
          }}
          onCancel={() => {
            modalProps.onCancel?.();
            closeModal();
          }}
          onClose={() => {
            modalProps.onClose?.();
            closeModal();
          }}
        />
      ) : null}
    </SafeAreaView>
  );
};

export default PlanScreen;

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 140,
  },

  modalContainer: {
    flex: 1,
    backgroundColor: "#F3EDE3",
  },

  modalHeader: {
    height: 56,
    paddingHorizontal: 16,
    alignItems: "flex-end",
    justifyContent: "center",
  },

  closeText: {
    color: "#8B4513",
    fontWeight: "600",
  },

  emptyModalContent: {
    padding: 20,
  },

  modalEmptyTitle: {
    color: "#3A2A1A",
    fontSize: 16,
  },

  modalEmptyText: {
    color: "#6B6B6B",
    marginTop: 8,
  },

  editBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.35)",
  },

  editSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },

  sheetHandle: {
    width: 42,
    height: 5,
    borderRadius: 999,
    backgroundColor: "#D1D5DB",
    alignSelf: "center",
    marginBottom: 14,
  },

  editTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#3A2A1A",
    marginBottom: 12,
  },

  editLabel: {
    fontSize: 13,
    color: "#6B6B6B",
    fontWeight: "600",
    marginTop: 10,
    marginBottom: 6,
  },

  editInput: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#111827",
    backgroundColor: "#F9FAFB",
  },

  editRow: {
    flexDirection: "row",
    gap: 10,
  },

  editActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },

  cancelEditBtn: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: "#F3EDE3",
  },

  cancelEditText: {
    color: "#8B4513",
    fontWeight: "700",
  },

  saveEditBtn: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: "#8B4513",
  },

  saveEditText: {
    color: "#fff",
    fontWeight: "800",
  },
});