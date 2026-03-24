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
import { useRoute, useFocusEffect, useNavigation } from "@react-navigation/native";
import { useRoadmapStore } from "../../store/roadmap.store";

import SupplementSection from "./components/SupplementSection";
import StageCalendar from "./components/StageCalendar";
import ScheduleDetail from "./components/ScheduleDetail";
import BottomActionBar from "./components/BottomActionBar";
import { SafeAreaView } from "react-native-safe-area-context";
import StageCarousel from "./components/StageCarousel";
import RoadmapApi from "../../hooks/roadmap.api";
import { getProfile } from "../../services/auth";
import StageRendererApi from "./components/StageRendererApi";

const RoadMap = () => {
  // ensure hooks are called in a stable order: store hook first, then route/navigation
  const storeList = useRoadmapStore((s) => s.list);
  const route: any = useRoute();
  const navigation: any = useNavigation();

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

  // local display state: when user fetches newest roadmap we show it here
  const [displayRoadmap, setDisplayRoadmap] = useState<any | null>(roadmap);
  const [displayStages, setDisplayStages] = useState<any[]>(stages);
  const [displaySupplements, setDisplaySupplements] = useState<any[]>([]);
  const [lastResponse, setLastResponse] = useState<string | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);

  // fetch helper reused by focus effect
  const fetchNewest = useCallback(async () => {
    try {
      setSaving(true);

      const newestData = await RoadmapApi.getNewest();
      console.log("roadmap newest response", newestData);
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
            RoadmapApi.getEquipment(roadmapId),
            RoadmapApi.getSupplements(roadmapId),
          ]);

          if (eqRes.status === "fulfilled") {
            roadmapFromServer.equipment = eqRes.value ?? [];
          }

          if (supplementsRes.status === "fulfilled") {
            roadmapFromServer.supplements = supplementsRes.value ?? [];
            setDisplaySupplements(supplementsRes.value ?? []);
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
  }, []);

  // When screen is focused (e.g., tab pressed), fetch newest roadmap+equipment automatically
  useFocusEffect(
    useCallback(() => {
      const hasFetched = !!(
        displayRoadmap &&
        (displayRoadmap.id || displayRoadmap.roadmapId || displayRoadmap._id)
      );

      if (!hasFetched) {
        fetchNewest();
      }

      return () => {};
    }, [displayRoadmap, fetchNewest])
  );

  // canonical objects used by the UI (prefer fetched display values)
  const currentRoadmap = displayRoadmap ?? roadmap;
  const currentStages = displayStages?.length ? displayStages : stages;
  const currentSupplements =
    displaySupplements?.length
      ? displaySupplements
      : currentRoadmap?.supplements ?? [];

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
      const newestData = await RoadmapApi.getNewest();
      console.log("handleSave newest response", newestData);
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
            RoadmapApi.getEquipment(roadmapId),
            RoadmapApi.getSupplements(roadmapId),
          ]);

          if (eqRes.status === "fulfilled") {
            roadmapFromServer.equipment = eqRes.value ?? [];
          }

          if (supplementsRes.status === "fulfilled") {
            roadmapFromServer.supplements = supplementsRes.value ?? [];
            setDisplaySupplements(supplementsRes.value ?? []);
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
        <SafeAreaView style={styles.centeredContainer}>
          <ActivityIndicator size="large" color="#8B4513" />
          <Text style={styles.loadingText}>Đang tải lộ trình...</Text>
        </SafeAreaView>
      );
    }

    return (
      <SafeAreaView style={styles.centeredContainer}>
        <Text style={styles.emptyTitle}>Không có dữ liệu lộ trình</Text>

        <TouchableOpacity onPress={() => fetchNewest()} style={styles.buttonPrimary}>
          <Text style={styles.buttonPrimaryText}>Tải lộ trình mới nhất</Text>
        </TouchableOpacity>

        {lastResponse ? (
          <View style={styles.sectionWrap}>
            <Text style={styles.sectionTitle}>Raw response:</Text>
            <View style={styles.codeBox}>
              <Text style={styles.mono}>{lastResponse}</Text>
            </View>
          </View>
        ) : null}

        {lastError ? (
          <View style={styles.sectionWrap}>
            <Text style={styles.sectionTitle}>Last error:</Text>
            <View style={styles.codeBox}>
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

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header: compact card with title, description and progress bar (polished) */}
        <View style={styles.sectionWrap}>
          <View style={styles.card}>
            <View style={styles.headerRow}>
              <View style={styles.headerTextWrap}>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {currentRoadmap.title}
                </Text>
                {currentRoadmap.description ? (
                  <Text style={styles.cardSubtitle} numberOfLines={2}>
                    {currentRoadmap.description}
                  </Text>
                ) : null}
              </View>

              {/* small stat: percent */}
              <View style={styles.statBox}>
                <Text style={styles.statText}>
                  {`${Number(currentRoadmap.progressPercent ?? currentRoadmap.progress ?? 0)}%`}
                </Text>
              </View>
            </View>

            {/* Progress bar */}
            <View style={styles.progressWrap}>
              <View style={styles.progressBarBg}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: `${Math.max(0, Math.min(100, Number(currentRoadmap.progressPercent ?? currentRoadmap.progress ?? 0)))}%` },
                  ]}
                />
              </View>
            </View>
          </View>
        </View>

        {/* Stage selector */}
        <View style={styles.stageSelector}>
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
          <View style={styles.sectionWrap}>
            <Text style={styles.equipmentTitle}>
              Thiết bị
            </Text>

            {Array.isArray(currentRoadmap.equipment) ? (
              currentRoadmap.equipment.map((eq: any, idx: number) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.itemCard}
                  onPress={() => {
                    const q = eq.equipmentName ?? eq.name ?? '';
                    // suggest products by equipment name/category
                    navigation.navigate('ShopSearchResult' as any, { q, roadmapFilter: { category: 'Thiết bị', equipmentName: q } });
                  }}
                >
                  <View style={styles.itemRow}>
                    {/* Left: image */}
                    {(
                      eq.imageUrl || eq.image || eq.thumbnailUrl || eq.equipmentImageUrl || eq.photo
                    ) ? (
                      <Image
                        source={{ uri: eq.imageUrl || eq.image || eq.thumbnailUrl || eq.equipmentImageUrl || eq.photo }}
                        style={styles.itemImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.itemImage} />
                    )}

                    {/* Right: info */}
                    <View style={styles.itemContent}>
                      <Text style={styles.itemTitle}>{eq.equipmentName ?? eq.name ?? "Thiết bị"}</Text>
                      {eq.description ? <Text style={styles.itemSubtitle}>{eq.description}</Text> : null}
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View style={[styles.itemCard, styles.itemCardPadding]}>
                <Text style={styles.itemSubtitle}>{JSON.stringify(currentRoadmap.equipment)}</Text>
              </View>
            )}
          </View>
        ) : null}

        {/* New supplement block from roadmap API */}
        {Array.isArray(selectedStageSupplements) && selectedStageSupplements.length > 0 ? (
          <View style={styles.sectionWrap}>
            <Text style={styles.supplementTitle}>
              Supplements
            </Text>

            {selectedStageSupplements.map((sp: any, idx: number) => (
              <TouchableOpacity
                key={sp.personalStageSupplementId ?? idx}
                style={styles.itemCard}
                onPress={() => {
                  const q = sp.supplementName ?? 'Supplement';
                  navigation.navigate('ShopSearchResult' as any, { q, roadmapFilter: { category: 'Thực phẩm chức năng', supplementName: q } });
                }}
              >
                <View style={styles.itemRow}>
                  {sp.supplementImageUrl ? (
                    <Image source={{ uri: sp.supplementImageUrl }} style={styles.itemImage} resizeMode="cover" />
                  ) : (
                    <View style={styles.itemImage} />
                  )}

                  <View style={styles.itemContent}>
                    <View style={styles.itemHeaderRow}>
                      <Text style={styles.itemTitle}>{sp.supplementName ?? "Supplement"}</Text>
                      {sp.priority ? <View style={styles.badge}><Text style={styles.badgeText}>{sp.priority}</Text></View> : null}
                    </View>
                    {sp.recommendedTiming ? <Text style={styles.itemSubtitle}>Thời điểm: {sp.recommendedTiming}</Text> : null}
                    {sp.dosage ? <Text style={styles.itemSubtitle}>Liều dùng: {sp.dosage}</Text> : null}
                    {sp.reason ? <Text style={styles.itemSubtitle}>Lý do: {sp.reason}</Text> : null}
                    {sp.notes ? <Text style={styles.itemSubtitle}>Ghi chú: {sp.notes}</Text> : null}
                    <Text style={styles.smallText}>Optional: {sp.optional ? "Yes" : "No"}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : Array.isArray(currentSupplements) && currentSupplements.length > 0 ? (
          <View style={styles.sectionWrap}>
            <Text style={styles.supplementTitle}>
              Supplements
            </Text>

            {currentSupplements.map((sp: any, idx: number) => (
              <View key={sp.personalStageSupplementId ?? idx} style={styles.itemCard}>
                <View style={styles.itemRow}>
                  {sp.supplementImageUrl ? (
                    <Image source={{ uri: sp.supplementImageUrl }} style={styles.itemImage} resizeMode="cover" />
                  ) : (
                    <View style={styles.itemImage} />
                  )}

                  <View style={styles.itemContent}>
                    <View style={styles.itemHeaderRow}>
                      <Text style={styles.itemTitle}>{sp.supplementName ?? "Supplement"}</Text>
                      {sp.priority ? <View style={styles.badge}><Text style={styles.badgeText}>{sp.priority}</Text></View> : null}
                    </View>
                    {sp.recommendedTiming ? <Text style={styles.itemSubtitle}>Thời điểm: {sp.recommendedTiming}</Text> : null}
                    {sp.dosage ? <Text style={styles.itemSubtitle}>Liều dùng: {sp.dosage}</Text> : null}
                    {sp.reason ? <Text style={styles.itemSubtitle}>Lý do: {sp.reason}</Text> : null}
                    {sp.notes ? <Text style={styles.itemSubtitle}>Ghi chú: {sp.notes}</Text> : null}
                    <Text style={styles.smallText}>Optional: {sp.optional ? "Yes" : "No"}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>

      <BottomActionBar onSave={handleSaveToServer} saving={saving} />
    </SafeAreaView>
  );
};

export default RoadMap;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F3EDE3' },
  scrollContent: { paddingBottom: 140 },
  mono: { fontFamily: 'monospace', fontSize: 12 },
  errorText: { color: 'red' },

  // header / card
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTextWrap: { flex: 1, paddingRight: 8 },
  cardTitle: { color: '#3A2A1A', fontSize: 18, fontWeight: '700' },
  cardSubtitle: { color: '#6B6B6B', marginTop: 4, fontSize: 13 },
  statBox: { minWidth: 48, height: 32, borderRadius: 8, backgroundColor: '#F3EDE3', alignItems: 'center', justifyContent: 'center' },
  statText: { color: '#8B4513', fontWeight: '700' },
  progressWrap: { marginTop: 10 },
  stageSelector: { marginTop: 12 },
  sectionWrap: { paddingHorizontal: 16, marginTop: 24 },
  sectionTitle: { fontWeight: '700', marginBottom: 8 },
  equipmentTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12, color: '#8B4513' },
  supplementTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12, color: '#8B4513' },

  // items
  itemCard: { backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: '#eee', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 1 },
  itemCardPadding: { paddingVertical: 12 },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  itemImage: { width: 72, height: 72, borderRadius: 8, backgroundColor: '#f3f4f6' },
  itemContent: { flex: 1 },
  itemHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  itemTitle: { fontSize: 16, color: '#3A2A1A', fontWeight: '700' },
  itemSubtitle: { fontSize: 13, color: '#6B6B6B', marginTop: 6 },
  badge: { backgroundColor: '#F3EDE3', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  badgeText: { color: '#8B4513', fontWeight: '700', fontSize: 11 },
  smallText: { fontSize: 12, color: '#8B8B8B', marginTop: 6 },

  // buttons / empty state
  centeredContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
  loadingText: { marginTop: 12, fontSize: 16, color: '#8B4513' },
  emptyTitle: { fontSize: 18, fontWeight: '600', marginBottom: 16, textAlign: 'center', color: '#3A2A1A' },
  buttonPrimary: { backgroundColor: '#8B4513', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  buttonPrimaryText: { color: '#fff', fontWeight: '500', fontSize: 16 },

  // code / debug box
  codeBox: { backgroundColor: '#fff', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#eee', marginTop: 8 },
  // progress bar styles (used in header card)
  progressBarBg: { width: '100%', height: 10, backgroundColor: '#F3EDE3', borderRadius: 6, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#8B4513' },
});