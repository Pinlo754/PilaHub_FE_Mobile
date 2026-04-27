import React, { useState, useMemo } from "react";
import {
  ScrollView,
  Text,
  View,
  StyleSheet,
  Modal,
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
  const storeList = useRoadmapStore((s) => s.list);
  const addRoadmap = useRoadmapStore((s) => s.addRoadmap);

  // prefer addedRoadmap param when present (from CreateRoadmap flow)
  const paramAdded = route.params?.addedRoadmap ?? null;

  // memoize roadmaps/stages derived from route or store to avoid changing references every render
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

  // shift returned dates by +7 hours for display only (fix server time offset)
  const shiftDateString = (dateStr: any, hours: number) => {
    if (!dateStr || typeof dateStr !== 'string') return dateStr;
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
    if (copied.generatedAt) copied.generatedAt = shiftDateString(copied.generatedAt, 7);
    return copied;
  }, [roadmap]);

  const displayStages = useMemo(() => {
    if (!Array.isArray(stages)) return stages;
    return stages.map((stg: any) => {
      if (!stg) return stg;
      // defensively handle both API-shaped and simple stage objects
      const schedules = Array.isArray(stg.schedules) ? stg.schedules : stg?.stage?.schedules ?? null;
      if (!schedules) return stg;
      const shifted = schedules.map((sch: any) => {
        if (!sch) return sch;
        const out = { ...sch };
        if (out.scheduledDate) out.scheduledDate = shiftDateString(out.scheduledDate, 7);
        if (out.startTime) out.startTime = shiftDateString(out.startTime, 7);
        if (out.endTime) out.endTime = shiftDateString(out.endTime, 7);
        return out;
      });

      if (Array.isArray(stg.schedules)) {
        return { ...stg, schedules: shifted };
      }
      // if API-shaped where schedules may live under stage
      if (stg.stage) {
        return { ...stg, stage: { ...stg.stage, schedules: shifted } };
      }
      return stg;
    });
  }, [stages]);

  const [selectedStageIndex, setSelectedStageIndex] = useState(0);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modalProps, setModalProps] = useState<any>({ visible: false });
  const showModal = (opts: any) => setModalProps({ visible: true, ...opts });
  const closeModal = () => setModalProps({ visible: false });
  const nav: any = useNavigation();

  const handleSelectDate = (date: string | null) => {
    setSelectedDate(date);
    setShowScheduleModal(true);
  };

  if (!roadmap || !stages?.length) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center">
        <Text>Không có dữ liệu lộ trình</Text>
      </SafeAreaView>
    );
  }

  // use display versions for UI so times appear with +7h correction
  const selectedStage = displayStages[selectedStageIndex];

  const selectedSchedule =
    selectedStage?.schedules?.find((s: any) =>
      selectedDate ? s.scheduledDate?.startsWith(selectedDate) : false
    ) ?? null;

  // detect api-shaped stages
  const isApiShaped =
    Array.isArray(stages) && stages.length > 0 && Boolean(stages[0]?.stage || stages[0]?._raw);

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
          contentText: "Bạn đang ở vai trò HLV. Vui lòng chọn học viên trước khi lưu lộ trình.",
          mode: "noti",
          onClose: () => {
            setSaving(false);
            closeModal();
          },
        });
        return;
      }

      // ensure we have primaryGoalId (server requires it)
      const aiResponse = roadmap?.raw ?? roadmap;
      const acceptPayload: any = { aiResponse };
      if (userId) acceptPayload.traineeId = userId;

      const primaryGoalId = paramAdded?.primaryGoalId ?? roadmap?.primaryGoalId ?? null;
      const secondaryGoalIds = paramAdded?.secondaryGoalIds ?? roadmap?.secondaryGoalIds ?? null;

      if (!primaryGoalId) {
        showModal({
          titleText: 'Thiếu mục tiêu chính',
          contentText: 'Vui lòng chọn mục tiêu chính trước khi lưu lộ trình lên server.',
          mode: 'noti',
          onClose: () => {
            setSaving(false);
            closeModal();
          },
        });
        return;
      }

      acceptPayload.primaryGoalId = primaryGoalId;
      if (secondaryGoalIds) acceptPayload.secondaryGoalIds = secondaryGoalIds;

      const res = await axios.post(
        "/roadmaps/ai-generated/accept",
        acceptPayload
      );
      const data = res.data?.data ?? res.data ?? res;

      const roadmapFromServer = data?.roadmap ?? roadmap;
      const stagesFromServer = data?.stages ?? stages;

      // persist returned roadmap into local store
      addRoadmap({
        roadmap: roadmapFromServer,
        stages: stagesFromServer,
        createdAt: Date.now(),
      });

      const goToRoadmap = () => {
        closeModal();
        (nav as any).reset({ index: 0, routes: [{ name: 'MainTabs', params: { screen: 'Roadmap' } }] });
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
        {/* Header */}
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

        {/* Stage selector */}
        <View className="mt-6">
          <Text className="text-lg font-semibold text-[#8B4513] mb-3 px-2">
            Giai đoạn
          </Text>
          {isApiShaped ? (
            <StageRendererApi apiStages={displayStages} roadmap={displayRoadmap ?? roadmap} />
          ) : (
            <StageCarousel
              stages={displayStages}
              onChangeIndex={setSelectedStageIndex}
            />
          )}
        </View>

        {/* Calendar */}
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
                  <Text style={styles.closeText} onPress={() => setShowScheduleModal(false)}>Đóng</Text>
                </View>
                <ScrollView contentContainerStyle={styles.scrollContent}>
                  {selectedSchedule ? (
                    <ScheduleDetail schedule={selectedSchedule} isPreview={Boolean(paramAdded)} onVideoModalChange={() => {}} />
                  ) : (
                    <View style={styles.emptyModalContent}>
                      <Text style={styles.modalEmptyTitle}>Không có lịch cho ngày này.</Text>
                      <Text style={styles.modalEmptyText}>Vui lòng chọn ngày có lịch để xem bài tập.</Text>
                    </View>
                  )}
                </ScrollView>
              </View>
            </Modal>

            {/* Supplement */}
            <SupplementSection stage={selectedStage} />
          </>
        )}
      </ScrollView>

      <BottomActionBar onSave={handleSaveToServer} saving={saving} />

      {/* ModalPopup: use modalProps to show notifications / confirmations */}
      {modalProps?.visible ? (
        <ModalPopup
          visible={modalProps.visible}
          titleText={modalProps.titleText}
          contentText={modalProps.contentText}
          mode={modalProps.mode}
          onConfirm={() => { modalProps.onConfirm?.(); }}
          onCancel={() => { modalProps.onCancel?.(); closeModal(); }}
          onClose={() => { modalProps.onClose?.(); closeModal(); }}
        />
      ) : null}
    </SafeAreaView>
  );
};

export default PlanScreen;

const styles = StyleSheet.create({
  scrollContent: { paddingBottom: 140 },
  modalContainer: { flex: 1, backgroundColor: '#F3EDE3' },
  modalHeader: { height: 56, paddingHorizontal: 16, alignItems: 'flex-end', justifyContent: 'center' },
  closeText: { color: '#8B4513', fontWeight: '600' },
  emptyModalContent: { padding: 20 },
  modalEmptyTitle: { color: '#3A2A1A', fontSize: 16 },
  modalEmptyText: { color: '#6B6B6B', marginTop: 8 },
});