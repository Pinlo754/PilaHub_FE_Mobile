import React, { useState, useCallback } from "react";
import {
  ScrollView,
  Text,
  View,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from "react-native";
import { useRoute, useFocusEffect } from "@react-navigation/native";
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

const RoadMap = () => {
  const route: any = useRoute();
  const storeList = useRoadmapStore((s) => s.list);

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
  const [saving, setSaving] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // local display state: when user fetches newest roadmap we show it here
  const [displayRoadmap, setDisplayRoadmap] = useState<any | null>(roadmap);
  const [displayStages, setDisplayStages] = useState<any[]>(stages);
  const [displaySupplements, setDisplaySupplements] = useState<any[]>([]);
  const [lastResponse, setLastResponse] = useState<string | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'CURRENT' | 'PROCESSING'>('CURRENT')
  const [coachRequests, setCoachRequests] = useState<any[]>([])

  const fetchCurrentRoadmap = async () => {
    const res = await axios.get('/roadmaps/newest')
    return res.data?.data ?? res.data
  }

  const fetchProcessingRoadmap = async () => {
    const res = await axios.get('/roadmaps/my-pending')
    return res.data?.data ?? res.data
  }

  const acceptRoadmap = async (roadmapId: string) => {
    return axios.patch(`/roadmaps/${roadmapId}/approve`)
  }

  const fetchCoachRequests = async () => {
    try {
      const res = await axios.get('/coach-roadmap-requests/my-sent')
      const data = res.data?.data ?? res.data ?? []
      setCoachRequests(Array.isArray(data) ? data : [])
    } catch (err) {
      console.warn("Không lấy được coach requests", err)
      setCoachRequests([])
    }
  }


  const handleAcceptRoadmap = () => {
    if (!currentRoadmap) return;
    setShowConfirmModal(true);
  };





  const fetchRoadmapSupplements = useCallback(async (roadmapId: string) => {
    try {
      // Nếu axiosInstance đã có baseURL chứa /api thì giữ như dưới là đúng
      const res = await axios.get(
        `/personal-stage-supplements/roadmap/${roadmapId}`
      );
      const data = res.data?.data ?? res.data ?? [];
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.warn("Không lấy được supplements cho roadmap", roadmapId, err);
      return [];
    }
  }, []);

  // fetch helper reused by focus effect
  const fetchNewest = useCallback(async (type: 'CURRENT' | 'PROCESSING') => {
    try {
      setSaving(true);

      const data =
        type === 'CURRENT'
          ? await fetchCurrentRoadmap()
          : await fetchProcessingRoadmap()

      const newestData = data.data?.data ?? data.data ?? data;
      setLastResponse(JSON.stringify(newestData, null, 2));

      const roadmapFromServer = newestData?.roadmap ?? newestData ?? null;
      const stagesFromServer =
        newestData?.stages ??
        (Array.isArray(newestData) ? newestData : []) ??
        [];

      if (!roadmapFromServer) {
        console.log("fetchNewest: no roadmap in response", newestData);
        Alert.alert(
          "Không có lộ trình mới",
          "Server trả về không có lộ trình mới nhất. Kiểm tra log để biết chi tiết."
        );
        setSaving(false);
        return;
      }

      const roadmapId =
        roadmapFromServer?.id ??
        roadmapFromServer?.roadmapId ??
        roadmapFromServer?._id ??
        null;

      if (roadmapId) {
        try {
          const [eqRes, supplementsRes] = await Promise.allSettled([
            axios.get(`/equipment/roadmap/${roadmapId}`),
            fetchRoadmapSupplements(roadmapId),
          ]);

          if (eqRes.status === "fulfilled") {
            const eqData =
              eqRes.value.data?.data ?? eqRes.value.data ?? eqRes.value;
            roadmapFromServer.equipment = eqData;
          }

          if (supplementsRes.status === "fulfilled") {
            roadmapFromServer.supplements = supplementsRes.value;
            setDisplaySupplements(supplementsRes.value);
          } else {
            roadmapFromServer.supplements = [];
            setDisplaySupplements([]);
          }
        } catch (err) {
          console.warn("Lỗi khi lấy equipment/supplements", err);
          roadmapFromServer.supplements = [];
          setDisplaySupplements([]);
        }
      } else {
        roadmapFromServer.supplements = [];
        setDisplaySupplements([]);
      }

      setDisplayRoadmap(roadmapFromServer);
      setDisplayStages(Array.isArray(stagesFromServer) ? stagesFromServer : []);
    } catch (err: any) {
      console.warn("fetchNewest error", err);
      setLastError(String(err?.message ?? err));
    } finally {
      setSaving(false);
    }
  }, [fetchRoadmapSupplements]);

  // When screen is focused (e.g., tab pressed), fetch newest roadmap+equipment automatically
  useFocusEffect(
    useCallback(() => {
      const hasFetched = !!(
        displayRoadmap &&
        (displayRoadmap.id || displayRoadmap.roadmapId || displayRoadmap._id)
      );

      if (!hasFetched) {
        fetchNewest(activeTab);
      }

      // Fetch coach requests when tab is PROCESSING
      if (activeTab === 'PROCESSING') {
        fetchCoachRequests();
      }

      return () => { };
    }, [displayRoadmap, fetchNewest, activeTab])
  );

  // canonical objects used by the UI (prefer fetched display values)
  const currentRoadmap = displayRoadmap ?? roadmap;
  const currentStages = displayStages?.length ? displayStages : stages;
  const currentSupplements =
    displaySupplements?.length
      ? displaySupplements
      : currentRoadmap?.supplements ?? [];

  // map stages vào currentRoadmap
  const roadmapWithStages = currentRoadmap
    ? {
      ...currentRoadmap,
      stages: currentStages,
    }
    : null;

  // detect API-shaped stages: entries with .stage property
  const isApiShaped =
    Array.isArray(currentStages) &&
    currentStages.length > 0 &&
    Boolean(currentStages[0]?.stage || currentStages[0]?._raw);

  // Instead of accepting/saving to server, fetch the newest roadmap for trainee
  // and its equipment, then show them on the UI (do not persist to global store).
  const handleSaveToServer = async () => {
    try {
      setSaving(true);

      const me = await getProfile();
      const role = me.ok
        ? String(me.data?.account?.role ?? me.data?.role ?? "").toUpperCase()
        : "";

      if (role === "COACH") {
        Alert.alert(
          "Chú ý",
          "Bạn đang ở vai trò HLV. Vui lòng chọn học viên trước khi tải lộ trình mới nhất."
        );
        setSaving(false);
        return;
      }

      // 1) get newest roadmap for trainee
      const newestRes = await axios.get("/roadmaps/newest");
      console.log("handleSave newest response", newestRes?.data ?? newestRes);

      const newestData = newestRes.data?.data ?? newestRes.data ?? newestRes;
      setLastResponse(JSON.stringify(newestData, null, 2));

      const roadmapFromServer = newestData?.roadmap ?? newestData ?? null;
      const stagesFromServer =
        newestData?.stages ??
        (Array.isArray(newestData) ? newestData : []) ??
        [];

      if (!roadmapFromServer) {
        Alert.alert(
          "Không có lộ trình mới",
          "Không tìm thấy lộ trình mới nhất cho học viên."
        );
        setSaving(false);
        return;
      }

      // 2) fetch equipment + supplements for the returned roadmap id (if available)
      const roadmapId =
        roadmapFromServer?.id ??
        roadmapFromServer?.roadmapId ??
        roadmapFromServer?._id ??
        null;

      if (roadmapId) {
        try {
          const [eqRes, supplementsRes] = await Promise.allSettled([
            axios.get(`/equipment/roadmap/${roadmapId}`),
            fetchRoadmapSupplements(roadmapId),
          ]);

          if (eqRes.status === "fulfilled") {
            const eqData =
              eqRes.value.data?.data ?? eqRes.value.data ?? eqRes.value;
            roadmapFromServer.equipment = eqData;
          }

          if (supplementsRes.status === "fulfilled") {
            roadmapFromServer.supplements = supplementsRes.value;
            setDisplaySupplements(supplementsRes.value);
          } else {
            roadmapFromServer.supplements = [];
            setDisplaySupplements([]);
          }
        } catch (err) {
          console.warn("Lỗi khi lấy equipment/supplements", err);
          roadmapFromServer.supplements = [];
          setDisplaySupplements([]);
        }
      } else {
        roadmapFromServer.supplements = [];
        setDisplaySupplements([]);
      }

      // update local UI state only
      setDisplayRoadmap(roadmapFromServer);
      setDisplayStages(Array.isArray(stagesFromServer) ? stagesFromServer : []);

      Alert.alert("Đã tải", "Đã tải lộ trình mới nhất, thiết bị và supplements.");
    } catch (err: any) {
      console.error("Fetch newest roadmap error", err);
      setLastError(String(err?.message ?? err));

      const message =
        err?.response?.data?.message ??
        err?.message ??
        "Không thể tải lộ trình mới nhất";

      Alert.alert("Lỗi", message);
    } finally {
      setSaving(false);
    }
  };

  if (!currentRoadmap || !currentStages?.length) {
    if (saving) {
      return (
        <SafeAreaView className="flex-1 items-center justify-center p-4">
          <ActivityIndicator size="large" color="#8B4513" />
          <Text className="mt-3">Đang tải lộ trình...</Text>
        </SafeAreaView>
      );
    }

    return (
      <SafeAreaView className="flex-1 items-center justify-center p-4">
        <Text className="text-lg font-semibold mb-3">
          Không có dữ liệu lộ trình
        </Text>

        <TouchableOpacity
          onPress={() => fetchNewest(activeTab)}
          className="bg-foreground px-4 py-3 rounded-lg mb-3"
        >
          <Text className="text-white">Tải lộ trình mới nhất</Text>
        </TouchableOpacity>

        {lastResponse ? (
          <View className="mt-3 w-full">
            <Text className="font-semibold mb-1">Raw response:</Text>
            <View className="bg-white p-3 rounded-lg border border-gray-200">
              <Text style={styles.mono}>{lastResponse}</Text>
            </View>
          </View>
        ) : null}

        {lastError ? (
          <View className="mt-3 w-full">
            <Text className="font-semibold mb-1">Last error:</Text>
            <View className="bg-white p-3 rounded-lg border border-gray-200">
              <Text style={styles.errorText}>{lastError}</Text>
            </View>
          </View>
        ) : null}
      </SafeAreaView>
    );
  }

  const selectedStage = currentStages[selectedStageIndex];

  const selectedSchedule =
    selectedStage?.schedules?.find((s: any) =>
      selectedDate ? s.scheduledDate?.startsWith(selectedDate) : false
    ) ?? null;

  const selectedStageId =
    selectedStage?.id ??
    selectedStage?.personalStageId ??
    selectedStage?.stage?.id ??
    null;

  const selectedStageSupplements = selectedStageId
    ? currentSupplements.filter(
      (sp: any) => sp.personalStageId === selectedStageId
    )
    : currentSupplements;

  const allSchedules = currentStages.flatMap((st: any) =>
    st.schedules?.map((s: any) => s.schedule) ?? []
  );

  const totalSessions = allSchedules.length;

  const firstSchedule = allSchedules[0];
  const lastSchedule = allSchedules[allSchedules.length - 1];

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("vi-VN");
  };

  const totalAmount = currentRoadmap?.totalAmount ?? 0;


  return (
    <SafeAreaView className="flex-1 bg-[#F3EDE3]">
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View className="flex-row px-5 mt-4 rounded-xl p-1 border border-foreground">
          <TouchableOpacity
            onPress={() => {
              setActiveTab('CURRENT')
              fetchNewest('CURRENT')
            }}
            className={`flex-1 py-2 rounded-lg items-center ${activeTab === 'CURRENT' ? 'bg-foreground' : ''
              }`}
          >
            <Text
              className={`font-semibold ${activeTab === 'CURRENT' ? 'text-white' : 'text-gray-500'
                }`}
            >
              Roadmap hiện tại
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              setActiveTab('PROCESSING')
              fetchNewest('PROCESSING')
            }}
            className={`flex-1 py-2 rounded-lg items-center ${activeTab === 'PROCESSING' ? 'bg-foreground' : ''
              }`}
          >
            <Text
              className={`font-semibold ${activeTab === 'PROCESSING' ? 'text-white' : 'text-gray-500'
                }`}
            >
              Đang xử lý
            </Text>
          </TouchableOpacity>
        </View>
        {/* Header */}
        <View className="px-5 mt-4">
          <Text className="text-2xl font-bold text-[#8B4513]">
            {currentRoadmap.title}
          </Text>

          {currentRoadmap.description && (
            <Text className="text-gray-600 mt-2">
              {currentRoadmap.description}
            </Text>
          )}
        </View>



        {/* Stage selector */}
        <View className="mt-6">
          {isApiShaped ? (
            <StageRendererApi apiStages={currentStages} roadmap={currentRoadmap} />
          ) : (
            <StageCarousel
              stages={currentStages}
              onChangeIndex={setSelectedStageIndex}
            />
          )}
        </View>

        {/* Calendar / Schedule / Old per-stage supplement */}
        {isApiShaped ? null : (
          <>
            <StageCalendar
              stage={selectedStage}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
            />

            <ScheduleDetail schedule={selectedSchedule} />

            {/* Giữ lại nếu stage cũ vẫn có supplementRecommendations */}
            <SupplementSection stage={selectedStage} />
          </>
        )}

        {/* Equipment fetched for current roadmap (if any) */}
        {currentRoadmap?.equipment ? (
          <View className="px-5 mt-6">
            <Text className="text-lg font-semibold text-[#8B4513] mb-2">
              Thiết bị
            </Text>

            {Array.isArray(currentRoadmap.equipment) ? (
              currentRoadmap.equipment.map((eq: any, idx: number) => (
                <View
                  key={idx}
                  className="bg-white rounded-lg p-3 mb-2 border border-gray-200"
                >
                  <Text className="font-semibold">
                    {eq.equipmentName ?? eq.name ?? "Thiết bị"}
                  </Text>
                  {eq.description ? (
                    <Text className="text-sm text-gray-600">
                      {eq.description}
                    </Text>
                  ) : null}
                </View>
              ))
            ) : (
              <View className="bg-white rounded-lg p-3 mb-2 border border-gray-200">
                <Text className="text-sm">
                  {JSON.stringify(currentRoadmap.equipment)}
                </Text>
              </View>
            )}
          </View>
        ) : null}

        {/* New supplement block from roadmap API */}
        {Array.isArray(selectedStageSupplements) &&
          selectedStageSupplements.length > 0 ? (
          <View className="px-5 mt-6">
            <Text className="text-lg font-semibold text-[#8B4513] mb-2">
              Supplements
            </Text>

            {selectedStageSupplements.map((sp: any, idx: number) => (
              <View
                key={sp.personalStageSupplementId ?? idx}
                className="bg-white rounded-xl p-4 mb-3 border border-gray-200"
              >
                <View className="flex-row items-start justify-between">
                  <Text className="font-semibold text-base text-[#3A2A1A] flex-1 pr-3">
                    {sp.supplementName ?? "Supplement"}
                  </Text>

                  {sp.priority ? (
                    <View className="px-2 py-1 rounded-full bg-[#F3EDE3]">
                      <Text className="text-xs font-semibold text-[#8B4513]">
                        {sp.priority}
                      </Text>
                    </View>
                  ) : null}
                </View>

                {sp.supplementImageUrl ? (
                  <Image
                    source={{ uri: sp.supplementImageUrl }}
                    style={styles.supplementImage}
                    resizeMode="cover"
                  />
                ) : null}

                {sp.recommendedTiming ? (
                  <Text className="text-sm text-gray-600 mt-2">
                    Thời điểm: {sp.recommendedTiming}
                  </Text>
                ) : null}

                {sp.dosage ? (
                  <Text className="text-sm text-gray-600 mt-1">
                    Liều dùng: {sp.dosage}
                  </Text>
                ) : null}

                {sp.reason ? (
                  <Text className="text-sm text-gray-700 mt-2">
                    Lý do: {sp.reason}
                  </Text>
                ) : null}

                {sp.notes ? (
                  <Text className="text-sm text-gray-500 mt-1">
                    Ghi chú: {sp.notes}
                  </Text>
                ) : null}

                <Text className="text-xs text-gray-400 mt-2">
                  Optional: {sp.optional ? "Yes" : "No"}
                </Text>
              </View>
            ))}
          </View>
        ) : Array.isArray(currentSupplements) && currentSupplements.length > 0 ? (
          <View className="px-5 mt-6">
            <Text className="text-lg font-semibold text-[#8B4513] mb-2">
              Supplements
            </Text>

            {currentSupplements.map((sp: any, idx: number) => (
              <View
                key={sp.personalStageSupplementId ?? idx}
                className="bg-white rounded-xl p-4 mb-3 border border-gray-200"
              >
                <View className="flex-row items-start justify-between">
                  <Text className="font-semibold text-base text-[#3A2A1A] flex-1 pr-3">
                    {sp.supplementName ?? "Supplement"}
                  </Text>

                  {sp.priority ? (
                    <View className="px-2 py-1 rounded-full bg-[#F3EDE3]">
                      <Text className="text-xs font-semibold text-[#8B4513]">
                        {sp.priority}
                      </Text>
                    </View>
                  ) : null}
                </View>

                {sp.supplementImageUrl ? (
                  <Image
                    source={{ uri: sp.supplementImageUrl }}
                    style={styles.supplementImage}
                    resizeMode="cover"
                  />
                ) : null}

                {sp.recommendedTiming ? (
                  <Text className="text-sm text-gray-600 mt-2">
                    Thời điểm: {sp.recommendedTiming}
                  </Text>
                ) : null}

                {sp.dosage ? (
                  <Text className="text-sm text-gray-600 mt-1">
                    Liều dùng: {sp.dosage}
                  </Text>
                ) : null}

                {sp.reason ? (
                  <Text className="text-sm text-gray-700 mt-2">
                    Lý do: {sp.reason}
                  </Text>
                ) : null}

                {sp.notes ? (
                  <Text className="text-sm text-gray-500 mt-1">
                    Ghi chú: {sp.notes}
                  </Text>
                ) : null}

                <Text className="text-xs text-gray-400 mt-2">
                  Optional: {sp.optional ? "Yes" : "No"}
                </Text>
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>
      <View className="bottom-20">
        {activeTab === 'PROCESSING' && (
          <BottomActionBar
            showAccept={currentRoadmap?.status === 'PENDING'}
            showSave={false}
            onAccept={handleAcceptRoadmap}
            accepting={saving}

          />
        )}
      </View>
      {showConfirmModal && (
        <View className="absolute inset-0 bg-black/50 justify-center items-center px-5">
          <View className="bg-white w-full rounded-2xl p-5">

            <Text className="text-xl font-bold text-center mb-4">
              Xác nhận lộ trình
            </Text>

            {/* Giá tiền */}
            <Text className="text-base mb-2">
              💰 Giá: {totalAmount.toLocaleString()} VNĐ
            </Text>

            {/* Tổng buổi */}
            <Text className="text-base mb-2">
              📊 Tổng số buổi: {totalSessions}
            </Text>

            {/* Thời gian */}
            {firstSchedule && lastSchedule && (
              <Text className="text-base mb-2">
                📅 Thời gian: {formatDate(firstSchedule.scheduledDate)} -{" "}
                {formatDate(lastSchedule.scheduledDate)}
              </Text>
            )}

            {/* Ngày học (ví dụ THỨ 2, THỨ 6) */}
            <Text className="text-base mb-4">
              📆 Lịch học:{" "}
              {[...new Set(allSchedules.map((s: any) => s.dayOfWeek))].join(", ")}
            </Text>

            {/* Buttons */}
            <View className="flex-row justify-between">
              <TouchableOpacity
                onPress={() => setShowConfirmModal(false)}
                className="flex-1 mr-2 py-3 rounded-lg bg-gray-200 items-center"
              >
                <Text>Huỷ</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={async () => {
                  try {
                    setSaving(true);

                    const roadmapId =
                      currentRoadmap?.roadmapId ??
                      currentRoadmap?.id ??
                      currentRoadmap?._id;

                    // Lấy coachRequest để tìm trainingDaySchedules
                    const coachRequest = coachRequests.find(
                      (req: any) => req.coachId === currentRoadmap?.coachId
                    );
                    const trainingDaySchedules = coachRequest?.trainingDaySchedules ?? [];

                    // Map bookingSlots từ currentStages + trainingDaySchedules
                    const bookingSlots = currentStages.flatMap((st: any) =>
                      st.schedules?.map((scheduleWrapper: any) => {
                        const schedule = scheduleWrapper.schedule;
                        const scheduledDate = new Date(schedule.scheduledDate);
                        
                        // Lấy ngày tháng năm
                        const year = scheduledDate.getUTCFullYear();
                        const month = String(scheduledDate.getUTCMonth() + 1).padStart(2, '0');
                        const day = String(scheduledDate.getUTCDate()).padStart(2, '0');

                        // Tìm giờ từ trainingDaySchedules dựa vào dayOfWeek
                        const dayOfWeekMap: any = {
                          'THỨ HAI': 'MONDAY',
                          'THỨ BA': 'TUESDAY',
                          'THỨ TƯ': 'WEDNESDAY',
                          'THỨ NĂM': 'THURSDAY',
                          'THỨ SÁU': 'FRIDAY',
                          'THỨ BẢY': 'SATURDAY',
                          'CHỦ NHẬT': 'SUNDAY'
                        };
                        
                        const dayOfWeekEng = dayOfWeekMap[schedule.dayOfWeek] || 'MONDAY';
                        const trainingSchedule = trainingDaySchedules.find(
                          (tds: any) => tds.dayOfWeek === dayOfWeekEng
                        );
                        const startTimeStr = trainingSchedule?.startTime ?? '08:00'; // mặc định 08:00

                        // Parse time HH:mm -> HH:mm:ss
                        const [hours, minutes] = startTimeStr.split(':');
                        const startDateTime = `${year}-${month}-${day}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00Z`;
                        
                        const startDateTimeObj = new Date(startDateTime);
                        const start = new Date(startDateTimeObj.getTime() -7 * 60 * 60 * 1000); 
                        const durationMs = 60 * 60 * 1000;
                        const end = new Date(start.getTime() + durationMs);

                        return {
                          startTime: start.toISOString(),
                          endTime: end.toISOString(),
                        };
                      }) ?? []
                    );

                    const payload1 = {
                      coachId: currentRoadmap?.coachId,
                      bookingSlots: bookingSlots,
                      bookingType: "PERSONAL_TRAINING_PACKAGE",
                      recurringGroupId: roadmapId,
                    }

                    console.log("Payload for booking", payload1);
                    await axios.post(`/coach-bookings/batch`, payload1);
                    await acceptRoadmap(roadmapId);

                    setShowConfirmModal(false);

                    Alert.alert("Thành công", "Đã chấp nhận lộ trình");

                    setActiveTab("CURRENT");
                    fetchNewest("CURRENT");
                  } catch (err: any) {
                    Alert.alert(
                      "Lỗi",
                      err?.response?.data?.message ??
                      "Không thể chấp nhận roadmap"
                    );
                  } finally {
                    setSaving(false);
                  }
                }}
                className="flex-1 ml-2 py-3 rounded-lg bg-foreground items-center"
              >
                <Text className="text-white font-semibold">
                  Xác nhận thanh toán
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

export default RoadMap;

const styles = StyleSheet.create({
  scrollContent: { paddingBottom: 140 },
  mono: { fontFamily: "monospace", fontSize: 12 },
  errorText: { color: "red" },
  supplementImage: {
    width: "100%",
    height: 160,
    borderRadius: 12,
    marginTop: 12,
    backgroundColor: "#f3f4f6",
  },
});