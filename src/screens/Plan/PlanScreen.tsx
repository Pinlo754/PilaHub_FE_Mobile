import React, { useEffect, useMemo, useState } from "react";
import {
  ScrollView,
  Text,
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Image,
  FlatList,
  KeyboardAvoidingView,
  Platform,
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
import { exerciseService } from "../../hooks/exercise.service";

const PlanScreen = () => {
  const route: any = useRoute();
  const nav: any = useNavigation();

  const storeList = useRoadmapStore((s) => s.list);
  const addRoadmap = useRoadmapStore((s) => s.addRoadmap);

  const [modalProps, setModalProps] = React.useState<any>({
    visible: false,
    mode: "noti",
    titleText: "",
    contentText: "",
    onConfirm: undefined,
  });

  const showModal = React.useCallback((props: Partial<any>) => {
    setModalProps((prev: any) => ({ ...prev, ...props, visible: true }));
  }, []);

  const closeModal = React.useCallback(() => {
    setModalProps((prev: any) => ({ ...prev, visible: false }));
  }, []);

  const paramAdded = route.params?.addedRoadmap ?? null;

  const roadmap = useMemo(() => {
    return (
      paramAdded?.roadmap ??
      route.params?.roadmap ??
      storeList?.[0]?.roadmap ??
      null
    );
  }, [paramAdded, route.params?.roadmap, storeList]);

  const sourceStages = useMemo(() => {
    return (
      paramAdded?.stages ??
      route.params?.stages ??
      storeList?.[0]?.stages ??
      []
    );
  }, [paramAdded, route.params?.stages, storeList]);

  const [stages, setStages] = useState<any[]>([]);

  useEffect(() => {
    if (Array.isArray(sourceStages)) {
      setStages(sourceStages);
    }
  }, [sourceStages]);

  const [selectedStageIndex, setSelectedStageIndex] = useState(0);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [showEditExerciseModal, setShowEditExerciseModal] = useState(false);
  const [editingExerciseIndex, setEditingExerciseIndex] = useState<number | null>(
    null
  );
  const [editingExercise, setEditingExercise] = useState<any>(null);

  const [editSets, setEditSets] = useState("");
  const [editReps, setEditReps] = useState("");
  const [editDurationSeconds, setEditDurationSeconds] = useState("");
  const [editRestSeconds, setEditRestSeconds] = useState("");

  const [showExercisePickerModal, setShowExercisePickerModal] = useState(false);
  const [exerciseList, setExerciseList] = useState<any[]>([]);
  const [exerciseLoading, setExerciseLoading] = useState(false);
  const [exerciseSearchText, setExerciseSearchText] = useState("");

  const selectedStage = stages?.[selectedStageIndex];

  const selectedSchedule =
    selectedStage?.schedules?.find((s: any) =>
      selectedDate ? s.scheduledDate?.startsWith(selectedDate) : false
    ) ?? null;

  const isApiShaped =
    Array.isArray(stages) &&
    stages.length > 0 &&
    Boolean(stages[0]?.stage || stages[0]?._raw);

  const filteredExerciseList = useMemo(() => {
    const keyword = exerciseSearchText.trim().toLowerCase();

    if (!keyword) return exerciseList;

    return exerciseList.filter((item: any) => {
      const name = String(
        item?.exerciseName ?? item?.name ?? item?.title ?? ""
      ).toLowerCase();

      return name.includes(keyword);
    });
  }, [exerciseList, exerciseSearchText]);

  const handleSelectDate = (date: string | null) => {
    setSelectedDate(date);
    setShowScheduleModal(true);
  };

  const getExerciseId = (item: any) => {
    return (
      item?.exerciseId ??
      item?.id ??
      item?.exercise_id ??
      item?.exerciseIdRaw ??
      null
    );
  };

  const getExerciseName = (item: any) => {
    return item?.exerciseName ?? item?.name ?? item?.title ?? "";
  };

  const getExerciseImage = (item: any) => {
    return (
      item?.thumbnailUrl ??
      item?.imageUrl ??
      item?.image ??
      item?.image_url ??
      null
    );
  };

  const getExerciseVideo = (item: any) => {
    return item?.practiceVideoUrl ?? item?.practice_video_url ?? null;
  };

  const handleEditExercise = (idx: number, ex: any) => {
    setEditingExerciseIndex(idx);
    setEditingExercise(ex);

    setEditSets(ex?.sets ? String(ex.sets) : "");
    setEditReps(ex?.reps ? String(ex.reps) : "");
    setEditDurationSeconds(
      ex?.durationSeconds ? String(ex.durationSeconds) : ""
    );
    setEditRestSeconds(ex?.restSeconds ? String(ex.restSeconds) : "");

    setShowEditExerciseModal(true);
  };

  const closeEditExerciseModal = () => {
    setShowEditExerciseModal(false);
    setEditingExerciseIndex(null);
    setEditingExercise(null);

    setEditSets("");
    setEditReps("");
    setEditDurationSeconds("");
    setEditRestSeconds("");
  };

  const loadExercises = async () => {
    try {
      setExerciseLoading(true);
      const data = await exerciseService.getAll();
      setExerciseList(Array.isArray(data) ? data : []);
    } catch (e: any) {
      console.error("Load exercises error:", e);

      showModal({
        mode: "noti",
        titleText: "Lỗi",
        contentText:
          e?.message || "Không thể tải danh sách bài tập. Vui lòng thử lại.",
      });
    } finally {
      setExerciseLoading(false);
    }
  };

  const openExercisePicker = async () => {
    setShowExercisePickerModal(true);

    if (exerciseList.length === 0) {
      await loadExercises();
    }
  };

  const handleSelectExerciseFromPicker = (item: any) => {
    const exerciseId = getExerciseId(item);
    const exerciseName = getExerciseName(item);
    const image = getExerciseImage(item);
    const video = getExerciseVideo(item);

    setEditingExercise((prev: any) => ({
      ...prev,

      exerciseId,
      id: exerciseId,

      exerciseName,
      name: exerciseName,

      thumbnailUrl: image,
      imageUrl: image,
      image,

      practiceVideoUrl: video,
      practice_video_url: video,

      haveAIsupported:
        item?.haveAIsupported ??
        item?.haveAISupported ??
        item?.haveAiSupported ??
        false,

      haveAISupported:
        item?.haveAISupported ??
        item?.haveAIsupported ??
        item?.haveAiSupported ??
        false,

      haveAiSupported:
        item?.haveAiSupported ??
        item?.haveAIsupported ??
        item?.haveAISupported ??
        false,

      nameInModelAI: item?.nameInModelAI ?? item?.name_in_model_ai ?? "",
      name_in_model_ai: item?.name_in_model_ai ?? item?.nameInModelAI ?? "",
    }));

    setShowExercisePickerModal(false);
  };

  const handleSaveEditExercise = () => {
    if (
      editingExerciseIndex === null ||
      selectedStageIndex === null ||
      !selectedDate ||
      !editingExercise
    ) {
      return;
    }

    setStages((prevStages) => {
      const nextStages = [...prevStages];

      const stage = nextStages[selectedStageIndex];
      if (!stage) return prevStages;

      const schedules = Array.isArray(stage.schedules)
        ? [...stage.schedules]
        : [];

      const scheduleIndex = schedules.findIndex((s: any) =>
        s?.scheduledDate?.startsWith(selectedDate)
      );

      if (scheduleIndex === -1) return prevStages;

      const schedule = { ...schedules[scheduleIndex] };

      const exercises = Array.isArray(schedule.exercises)
        ? [...schedule.exercises]
        : [];

      const oldExercise = exercises[editingExerciseIndex];
      if (!oldExercise) return prevStages;

      const updatedExercise = {
        ...oldExercise,
        ...editingExercise,

        sets: editSets ? Number(editSets) : oldExercise.sets,
        reps: editReps ? Number(editReps) : oldExercise.reps,

        durationSeconds: editDurationSeconds
          ? Number(editDurationSeconds)
          : oldExercise.durationSeconds,

        restSeconds: editRestSeconds
          ? Number(editRestSeconds)
          : oldExercise.restSeconds,
      };

      exercises[editingExerciseIndex] = updatedExercise;
      schedule.exercises = exercises;
      schedules[scheduleIndex] = schedule;

      nextStages[selectedStageIndex] = {
        ...stage,
        schedules,
      };

      return nextStages;
    });

    closeEditExerciseModal();
  };

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
          mode: "noti",
          titleText: "Chú ý",
          contentText:
            "Bạn đang ở vai trò HLV. Vui lòng chọn học viên trước khi lưu lộ trình.",
        });
        setSaving(false);
        return;
      }

      const aiResponse = {
        ...(roadmap?.raw ?? roadmap),
        stages,
      };

      const acceptPayload: any = {
        aiResponse,
      };

      if (userId) {
        acceptPayload.traineeId = userId;
      }

      const primaryGoalId =
        paramAdded?.primaryGoalId ?? roadmap?.primaryGoalId ?? null;

      const secondaryGoalIds =
        paramAdded?.secondaryGoalIds ?? roadmap?.secondaryGoalIds ?? null;

      if (!primaryGoalId) {
        showModal({
          mode: "noti",
          titleText: "Thiếu mục tiêu chính",
          contentText:
            "Vui lòng chọn mục tiêu chính trước khi lưu lộ trình lên server.",
        });
        setSaving(false);
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
      const stagesFromServer = data?.stages ?? stages;

      addRoadmap({
        roadmap: roadmapFromServer,
        stages: stagesFromServer,
        createdAt: Date.now(),
      });

     showModal({
  mode: "noti",
  titleText: "Thành công",
  contentText: "Lộ trình đã được lưu.",
  onConfirm: () => {
    closeModal();

    const roadmapId =
      roadmapFromServer?.roadmapId ??
      roadmapFromServer?.id ??
      roadmapFromServer?._id ??
      null;

    nav.reset({
      index: 0,
      routes: [
        {
          name: "MainTabs",
          params: {
            screen: "Roadmap",
            params: {
              screen: "RoadmapDetail",
              params: {
                roadmapId,
              },
            },
          },
        },
      ],
    });
  },
});
    } catch (e: any) {
      console.error("Save roadmap error:", e);

      const message =
        e?.response?.data?.message || e?.message || "Không thể lưu lộ trình.";

      showModal({
        mode: "noti",
        titleText: "Lưu thất bại",
        contentText: message,
      });
    } finally {
      setSaving(false);
    }
  };

  if (!roadmap || !stages?.length) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center">
        <Text>Không có dữ liệu lộ trình</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#F3EDE3]">
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View className="px-5 mt-4">
          <Text className="text-2xl font-bold text-[#8B4513]">
            {roadmap?.title}
          </Text>

          {roadmap?.description ? (
            <Text className="text-gray-600 mt-2">{roadmap.description}</Text>
          ) : null}
        </View>

        <View className="mt-6">
          <Text className="text-lg font-semibold text-[#8B4513] mb-3 px-2">
            Giai đoạn
          </Text>

          {isApiShaped ? (
            <StageRendererApi apiStages={stages} roadmap={roadmap} />
          ) : (
            <StageCarousel
              stages={stages}
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
                      isPreview={true}
                      onEditExercise={handleEditExercise}
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

      <Modal
        visible={showEditExerciseModal}
        animationType="slide"
        transparent
        onRequestClose={closeEditExerciseModal}
      >
        <KeyboardAvoidingView
          style={styles.editOverlay}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.editModal}>
            <Text style={styles.editTitle}>Sửa bài tập</Text>

            <Text style={styles.inputLabel}>Bài tập</Text>

            <TouchableOpacity
              style={styles.exercisePickerButton}
              onPress={openExercisePicker}
              activeOpacity={0.8}
            >
              <View style={styles.exercisePickerContent}>
                {getExerciseImage(editingExercise) ? (
                  <Image
                    source={{ uri: getExerciseImage(editingExercise) }}
                    style={styles.selectedExerciseImage}
                  />
                ) : (
                  <View style={styles.selectedExercisePlaceholder}>
                    <Text style={styles.selectedExercisePlaceholderText}>
                      ?
                    </Text>
                  </View>
                )}

                <View style={styles.exercisePickerTextWrap}>
                  <Text style={styles.exercisePickerTitle} numberOfLines={1}>
                    {getExerciseName(editingExercise) || "Chọn bài tập"}
                  </Text>

                  <Text style={styles.exercisePickerSub}>
                    Bấm để chọn từ danh sách bài tập
                  </Text>
                </View>
              </View>
            </TouchableOpacity>

            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Text style={styles.inputLabel}>Số set</Text>
                <TextInput
                  value={editSets}
                  onChangeText={setEditSets}
                  placeholder="VD: 3"
                  keyboardType="numeric"
                  style={styles.input}
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.halfInput}>
                <Text style={styles.inputLabel}>Số reps</Text>
                <TextInput
                  value={editReps}
                  onChangeText={setEditReps}
                  placeholder="VD: 12"
                  keyboardType="numeric"
                  style={styles.input}
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Text style={styles.inputLabel}>Thời gian tập</Text>
                <TextInput
                  value={editDurationSeconds}
                  onChangeText={setEditDurationSeconds}
                  placeholder="Giây"
                  keyboardType="numeric"
                  style={styles.input}
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.halfInput}>
                <Text style={styles.inputLabel}>Thời gian nghỉ</Text>
                <TextInput
                  value={editRestSeconds}
                  onChangeText={setEditRestSeconds}
                  placeholder="Giây"
                  keyboardType="numeric"
                  style={styles.input}
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            <TouchableOpacity
              style={styles.saveEditButton}
              onPress={handleSaveEditExercise}
              activeOpacity={0.8}
            >
              <Text style={styles.saveEditButtonText}>Lưu thay đổi</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelEditButton}
              onPress={closeEditExerciseModal}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelEditButtonText}>Hủy</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={showExercisePickerModal}
        animationType="slide"
        onRequestClose={() => setShowExercisePickerModal(false)}
      >
        <SafeAreaView style={styles.pickerContainer}>
          <View style={styles.pickerHeader}>
            <Text style={styles.pickerTitle}>Chọn bài tập</Text>

            <TouchableOpacity
              onPress={() => setShowExercisePickerModal(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.pickerCloseText}>Đóng</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.searchBox}>
            <TextInput
              value={exerciseSearchText}
              onChangeText={setExerciseSearchText}
              placeholder="Tìm bài tập..."
              style={styles.searchInput}
              placeholderTextColor="#9CA3AF"
            />
          </View>

          {exerciseLoading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="large" color="#8B4513" />
              <Text style={styles.loadingText}>Đang tải bài tập...</Text>
            </View>
          ) : (
            <FlatList
              data={filteredExerciseList}
              keyExtractor={(item: any, index: number) =>
                String(getExerciseId(item) ?? index)
              }
              contentContainerStyle={styles.exerciseListContent}
              renderItem={({ item }) => {
                const image = getExerciseImage(item);
                const name = getExerciseName(item);

                return (
                  <TouchableOpacity
                    style={styles.exerciseItem}
                    activeOpacity={0.85}
                    onPress={() => handleSelectExerciseFromPicker(item)}
                  >
                    {image ? (
                      <Image
                        source={{ uri: image }}
                        style={styles.exerciseItemImage}
                      />
                    ) : (
                      <View style={styles.exerciseItemPlaceholder}>
                        <Text style={styles.exerciseItemPlaceholderText}>
                          ?
                        </Text>
                      </View>
                    )}

                    <View style={styles.exerciseItemInfo}>
                      <Text style={styles.exerciseItemName} numberOfLines={1}>
                        {name || "Không có tên bài tập"}
                      </Text>

                      <Text style={styles.exerciseItemMeta} numberOfLines={1}>
                        {item?.difficultyLevel ??
                          item?.level ??
                          item?.category ??
                          "Bài tập"}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <View style={styles.emptyExerciseList}>
                  <Text style={styles.emptyExerciseText}>
                    Không tìm thấy bài tập.
                  </Text>
                </View>
              }
            />
          )}
        </SafeAreaView>
      </Modal>

      <ModalPopup {...(modalProps as any)} onClose={closeModal} />

      <BottomActionBar onSave={handleSaveToServer} saving={saving} />
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

  editOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },

  editModal: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 32,
  },

  editTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#3A2A1A",
    marginBottom: 18,
  },

  inputLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#8B4513",
    marginBottom: 8,
  },

  input: {
    borderWidth: 1,
    borderColor: "#E5D6C8",
    backgroundColor: "#FFFDFB",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#3A2A1A",
    marginBottom: 14,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  halfInput: {
    width: "48%",
  },

  exercisePickerButton: {
    borderWidth: 1,
    borderColor: "#E5D6C8",
    backgroundColor: "#FFFDFB",
    borderRadius: 16,
    padding: 12,
    marginBottom: 14,
  },

  exercisePickerContent: {
    flexDirection: "row",
    alignItems: "center",
  },

  selectedExerciseImage: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: "#F3EDE3",
  },

  selectedExercisePlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: "#F3EDE3",
    alignItems: "center",
    justifyContent: "center",
  },

  selectedExercisePlaceholderText: {
    color: "#8B4513",
    fontWeight: "800",
  },

  exercisePickerTextWrap: {
    flex: 1,
    marginLeft: 12,
  },

  exercisePickerTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#3A2A1A",
  },

  exercisePickerSub: {
    marginTop: 4,
    fontSize: 13,
    color: "#6B6B6B",
  },

  saveEditButton: {
    marginTop: 8,
    backgroundColor: "#8B4513",
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: "center",
  },

  saveEditButtonText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 15,
  },

  cancelEditButton: {
    marginTop: 10,
    backgroundColor: "#F3EDE3",
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: "center",
  },

  cancelEditButtonText: {
    color: "#8B4513",
    fontWeight: "800",
    fontSize: 15,
  },

  pickerContainer: {
    flex: 1,
    backgroundColor: "#F3EDE3",
  },

  pickerHeader: {
    height: 58,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  pickerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#3A2A1A",
  },

  pickerCloseText: {
    color: "#8B4513",
    fontWeight: "700",
  },

  searchBox: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },

  searchInput: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5D6C8",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "#3A2A1A",
    fontSize: 15,
  },

  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    marginTop: 12,
    color: "#6B6B6B",
  },

  exerciseListContent: {
    paddingHorizontal: 16,
    paddingBottom: 30,
  },

  exerciseItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#EFE2D6",
  },

  exerciseItemImage: {
    width: 58,
    height: 58,
    borderRadius: 14,
    backgroundColor: "#F3EDE3",
  },

  exerciseItemPlaceholder: {
    width: 58,
    height: 58,
    borderRadius: 14,
    backgroundColor: "#F3EDE3",
    alignItems: "center",
    justifyContent: "center",
  },

  exerciseItemPlaceholderText: {
    color: "#8B4513",
    fontWeight: "800",
  },

  exerciseItemInfo: {
    flex: 1,
    marginLeft: 12,
  },

  exerciseItemName: {
    fontSize: 16,
    fontWeight: "800",
    color: "#3A2A1A",
  },

  exerciseItemMeta: {
    marginTop: 5,
    fontSize: 13,
    color: "#6B6B6B",
  },

  emptyExerciseList: {
    padding: 24,
    alignItems: "center",
  },

  emptyExerciseText: {
    color: "#6B6B6B",
  },
});