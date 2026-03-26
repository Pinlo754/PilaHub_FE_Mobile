import React, { useState } from "react";
import {
  ScrollView,
  Text,
  View,
  Alert,
  StyleSheet,
  Modal,
} from "react-native";
import { useRoute } from "@react-navigation/native";
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

const PlanScreen = () => {
  const route: any = useRoute();
  const storeList = useRoadmapStore((s) => s.list);
  const addRoadmap = useRoadmapStore((s) => s.addRoadmap);

  // prefer addedRoadmap param when present (from CreateRoadmap flow)
  const paramAdded = route.params?.addedRoadmap ?? null;

  const roadmap =
    paramAdded?.roadmap ??
    route.params?.roadmap ??
    storeList?.[0]?.roadmap ??
    null;
  const stages =
    paramAdded?.stages ??
    route.params?.stages ??
    storeList?.[0]?.stages ??
    [];

  const [selectedStageIndex, setSelectedStageIndex] = useState(0);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [saving, setSaving] = useState(false);

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

  const selectedStage = stages[selectedStageIndex];

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
        Alert.alert(
          "Chú ý",
          "Bạn đang ở vai trò HLV. Vui lòng chọn học viên trước khi lưu lộ trình."
        );
        setSaving(false);
        return;
      }

      // ensure we have primaryGoalId (server requires it)
      const aiResponse = roadmap?.raw ?? roadmap;
      const acceptPayload: any = { aiResponse };
      if (userId) acceptPayload.traineeId = userId;

      const primaryGoalId = paramAdded?.primaryGoalId ?? roadmap?.primaryGoalId ?? null;
      const secondaryGoalIds = paramAdded?.secondaryGoalIds ?? roadmap?.secondaryGoalIds ?? null;

      if (!primaryGoalId) {
        // avoid server validation error and guide user to set primary goal
        Alert.alert('Thiếu mục tiêu chính', 'Vui lòng chọn mục tiêu chính trước khi lưu lộ trình lên server.');
        setSaving(false);
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

      Alert.alert("Thành công", "Lộ trình đã được lưu lên server.");
    } catch (e: any) {
      console.error("Save roadmap error:", e);
      const message =
        e?.response?.data?.message || e?.message || "Không thể lưu lộ trình lên server";
      Alert.alert("Lưu thất bại", message);
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
            {roadmap.title}
          </Text>
          {roadmap.description && (
            <Text className="text-gray-600 mt-2">
              {roadmap.description}
            </Text>
          )}
        </View>

        {/* Stage selector */}
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
                    <ScheduleDetail schedule={selectedSchedule} />
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