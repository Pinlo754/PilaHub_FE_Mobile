import React, { useState, useCallback, useEffect } from 'react';
import {
  ScrollView,
  Text,
  View,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Modal,
} from 'react-native';
import {
  useRoute,
  useFocusEffect,
  useNavigation,
} from '@react-navigation/native';
import { useRoadmapStore } from '../../store/roadmap.store';

import SupplementSection from './components/SupplementSection';
import StageCalendar from './components/StageCalendar';
import ScheduleDetail from './components/ScheduleDetail';
import BottomActionBar from './components/BottomActionBar';
import { SafeAreaView } from 'react-native-safe-area-context';
import StageCarousel from './components/StageCarousel';
import RoadmapApi from '../../hooks/roadmap.api';
import StageRendererApi from './components/StageRendererApi';

const RoadMap = () => {
  const storeList = useRoadmapStore(s => s.list);
  const route: any = useRoute();
  const navigation: any = useNavigation();

  const paramAdded = route.params?.addedRoadmap ?? null;
  const roadmap = paramAdded?.roadmap ?? route.params?.roadmap ?? storeList?.[0]?.roadmap ?? null;
  const stages = paramAdded?.stages ?? route.params?.stages ?? storeList?.[0]?.stages ?? [];

  const [selectedStageIndex, setSelectedStageIndex] = useState(0);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // --- STATE CHO ROADMAP HIỆN TẠI (CURRENT) ---
  const [currentRoadmapData, setCurrentRoadmapData] = useState<any | null>(roadmap);
  const [currentStagesData, setCurrentStagesData] = useState<any[]>(stages);
  const [currentSupplementsData, setCurrentSupplementsData] = useState<any[]>([]);

  // --- STATE CHO ROADMAP ĐANG XỬ LÝ (PENDING/PROCESSING) ---
  const [pendingRoadmapData, setPendingRoadmapData] = useState<any | null>(null);
  const [pendingStagesData, setPendingStagesData] = useState<any[]>([]);
  const [pendingSupplementsData, setPendingSupplementsData] = useState<any[]>([]);

  const [lastError, setLastError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'CURRENT' | 'PROCESSING'>('CURRENT');
  const [coachRequests, setCoachRequests] = useState<any[]>([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const fetchCoachRequests = async () => {
    try {
      const res = await RoadmapApi.getMyCoachRequests();
      const data = res?.data ?? res ?? [];
      setCoachRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn("Không lấy được coach requests", err);
      setCoachRequests([]);
    }
  };

  const handleAcceptRoadmap = () => {
    // Sẽ validate với canonical currentRoadmap phía dưới
    setShowConfirmModal(true);
  };

  // --- LẤY DỮ LIỆU TAB CURRENT ---
  const fetchNewest = useCallback(async () => {
    try {
      setSaving(true);
      const newestData = await RoadmapApi.getNewest();
      console.log('roadmap newest response', newestData);
      
      const roadmapFromServer = newestData?.roadmap ?? newestData ?? null;
      const stagesFromServer = newestData?.stages ?? (Array.isArray(newestData) ? newestData : []) ?? [];

      if (!roadmapFromServer) {
        console.log('fetchNewest: no roadmap in response');
        setCurrentRoadmapData(null);
        setCurrentStagesData([]);
        setCurrentSupplementsData([]);
        setSaving(false);
        return;
      }

      const roadmapId = roadmapFromServer?.id ?? roadmapFromServer?.roadmapId ?? roadmapFromServer?._id ?? null;

      if (roadmapId) {
        try {
          const [eqRes, supplementsRes] = await Promise.allSettled([
            RoadmapApi.getEquipment(roadmapId),
            RoadmapApi.getSupplements(roadmapId),
          ]);

          if (eqRes.status === 'fulfilled') {
            roadmapFromServer.equipment = eqRes.value ?? [];
          }

          if (supplementsRes.status === 'fulfilled') {
            roadmapFromServer.supplements = supplementsRes.value ?? [];
            setCurrentSupplementsData(supplementsRes.value ?? []);
          } else {
            roadmapFromServer.supplements = [];
            setCurrentSupplementsData([]);
          }
        } catch (err) {
          console.warn('Lỗi khi lấy equipment/supplements (Current)', err);
          roadmapFromServer.supplements = [];
          setCurrentSupplementsData([]);
        }
      } else {
        roadmapFromServer.supplements = [];
        setCurrentSupplementsData([]);
      }

      setCurrentRoadmapData(roadmapFromServer);
      setCurrentStagesData(Array.isArray(stagesFromServer) ? stagesFromServer : []);
    } catch (err: any) {
      console.warn('fetchNewest error', err);
      setLastError(String(err?.message ?? err));
    } finally {
      setSaving(false);
    }
  }, []);

  // --- LẤY DỮ LIỆU TAB PROCESSING ---
  const fetchProcessing = useCallback(async () => {
    try {
      setSaving(true);
      const processingResponse = await RoadmapApi.getPending();
      console.log('roadmap processing response', processingResponse);
      
      // 1. Trích xuất lõi dữ liệu an toàn bất kể cấu hình của Axios
      let responseData = processingResponse;
      if (processingResponse?.data?.data) {
        responseData = processingResponse.data.data;
      } else if (processingResponse?.data) {
        responseData = processingResponse.data;
      }

      // 2. Nếu trả về mảng, lấy phần tử đầu tiên (đề phòng API trả về list)
      const actualData = Array.isArray(responseData) ? responseData[0] : responseData;

      if (!actualData || Object.keys(actualData).length === 0) {
        console.log('fetchProcessing: Dữ liệu pending trống');
        setPendingRoadmapData(null);
        setPendingStagesData([]);
        setPendingSupplementsData([]);
        setSaving(false);
        return;
      }

      // 3. Trích xuất đích danh roadmap và stages từ actualData
      const roadmapFromServer = actualData?.roadmap ?? actualData ?? null;
      const stagesFromServer = actualData?.stages ?? [];

      // 4. Kiểm tra ID của roadmap (JSON của bạn dùng trường roadmapId)
      const roadmapId = roadmapFromServer?.id ?? roadmapFromServer?.roadmapId ?? roadmapFromServer?._id ?? null;

      if (!roadmapId) {
        console.warn('fetchProcessing: Không tìm thấy roadmapId trong object', roadmapFromServer);
        setPendingRoadmapData(null);
        setPendingStagesData([]);
        setPendingSupplementsData([]);
        setSaving(false);
        return;
      }

      // 5. Fetch thêm Equipment và Supplements
      try {
        const [eqRes, supplementsRes] = await Promise.allSettled([
          RoadmapApi.getEquipment(roadmapId),
          RoadmapApi.getSupplements(roadmapId),
        ]);

        if (eqRes.status === 'fulfilled') {
          roadmapFromServer.equipment = eqRes.value ?? [];
        }

        if (supplementsRes.status === 'fulfilled') {
          roadmapFromServer.supplements = supplementsRes.value ?? [];
          setPendingSupplementsData(supplementsRes.value ?? []);
        } else {
          roadmapFromServer.supplements = [];
          setPendingSupplementsData([]);
        }
      } catch (err) {
        console.warn('Lỗi khi lấy equipment/supplements (Pending)', err);
        roadmapFromServer.supplements = [];
        setPendingSupplementsData([]);
      }

      // 6. Lưu vào state Pending
      setPendingRoadmapData(roadmapFromServer);
      setPendingStagesData(Array.isArray(stagesFromServer) ? stagesFromServer : []);
      
    } catch (err: any) {
      console.warn('fetchProcessing error', err);
      setLastError(String(err?.message ?? err));
    } finally {
      setSaving(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      console.log('[useFocusEffect] activeTab changed to:', activeTab);
      
      if (activeTab === 'CURRENT') {
        console.log('[useFocusEffect] Fetching CURRENT roadmap');
        fetchNewest();
      } else {
        console.log('[useFocusEffect] Fetching PROCESSING roadmap');
        fetchProcessing();
      }
      
      fetchCoachRequests();
      return () => {};
    }, [fetchNewest, fetchProcessing, activeTab])
  );

  // If the screen receives a newly created roadmap via params, fetch its equipment/supplements right away
  const fetchEquipmentAndSupplements = useCallback(async (rm: any) => {
    try {
      const roadmapId = rm?.id ?? rm?.roadmapId ?? rm?._id ?? null;
      if (!roadmapId) return;

      const [eqRes, supplementsRes] = await Promise.allSettled([
        RoadmapApi.getEquipment(roadmapId),
        RoadmapApi.getSupplements(roadmapId),
      ]);

      const normalizePayload = (res: any) => {
        if (!res) return [];
        const val = res?.data ?? res;
        if (Array.isArray(val)) return val;
        // axios may wrap value inside .data (object) or return object directly
        return Array.isArray(res) ? res : (val ?? []);
      };

      const equipment = eqRes.status === 'fulfilled' ? normalizePayload(eqRes.value) : [];
      const supplements = supplementsRes.status === 'fulfilled' ? normalizePayload(supplementsRes.value) : [];

      // update local copies so UI reflects fetched equipment/supplements immediately
      setCurrentRoadmapData((prev: any) => ({ ...(prev ?? rm), equipment }));
      setCurrentSupplementsData(supplements);
    } catch (err) {
      console.warn('fetchEquipmentAndSupplements error', err);
    }
  }, []);

  useEffect(() => {
    // prefer the freshly added roadmap passed as param
    const target = paramAdded?.roadmap ?? roadmap;
    // only fetch when we have a fresh roadmap and equipment isn't already present
    if (target && (!target.equipment || target.equipment.length === 0)) {
      fetchEquipmentAndSupplements(target);
    }
  }, [paramAdded, roadmap, fetchEquipmentAndSupplements]);

  // --- DYNAMIC BINDING UI BIẾN DỰA TRÊN TAB ---
  const activeDataRoadmap = activeTab === 'CURRENT' ? currentRoadmapData : pendingRoadmapData;
  const activeDataStages = activeTab === 'CURRENT' ? currentStagesData : pendingStagesData;
  const activeDataSupplements = activeTab === 'CURRENT' ? currentSupplementsData : pendingSupplementsData;

  const currentRoadmap = activeDataRoadmap ?? (activeTab === 'CURRENT' ? roadmap : null);
  const currentStages = activeDataStages?.length ? activeDataStages : (activeTab === 'CURRENT' ? stages : []);
  const currentSupplements = activeDataSupplements?.length ? activeDataSupplements : (currentRoadmap?.supplements ?? []);

  const isApiShaped = Array.isArray(currentStages) && currentStages.length > 0 && Boolean(currentStages[0]?.stage || currentStages[0]?._raw);

  // Handle empty state
  if (!currentRoadmap || !currentStages?.length) {
    if (saving) {
      return (
        <SafeAreaView style={[styles.screen, styles.centeredContainer]}>
          <ActivityIndicator size="large" color="#8B4513" />
          <Text style={styles.loadingText}>Đang tải lộ trình...</Text>
        </SafeAreaView>
      );
    }

    return (
      <SafeAreaView style={[styles.screen, styles.centeredContainer]}>
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            onPress={() => { 
              console.log('[Empty State] Switching to CURRENT');
              setActiveTab('CURRENT'); 
              setSelectedStageIndex(0);
              // useFocusEffect will handle fetching
            }}
            style={[styles.tabButton, activeTab === 'CURRENT' && styles.tabButtonActive]}
          >
            <Text style={[styles.tabText, activeTab === 'CURRENT' && styles.tabTextActive]}>
              Roadmap hiện tại
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => { 
              console.log('[Empty State] Switching to PROCESSING');
              setActiveTab('PROCESSING'); 
              setSelectedStageIndex(0);
              // useFocusEffect will handle fetching
            }}
            style={[styles.tabButton, activeTab === 'PROCESSING' && styles.tabButtonActive]}
          >
            <Text style={[styles.tabText, activeTab === 'PROCESSING' && styles.tabTextActive]}>
              Đang xử lý
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.emptyTitle}>
          {activeTab === 'CURRENT' ? 'Bạn chưa có lộ trình' : 'Không có lộ trình nào đang xử lý'}
        </Text>

        {activeTab === 'CURRENT' && (
          <TouchableOpacity onPress={() => navigation.navigate('CreateRoadmap')} style={styles.buttonPrimary}>
            <Text style={styles.buttonPrimaryText}>Tạo lộ trình mới</Text>
          </TouchableOpacity>
        )}
      </SafeAreaView>
    );
  }

  // --- VARIABLES FOR RENDER ---
  const selectedStage = currentStages[selectedStageIndex] || currentStages[0];
  const selectedSchedule = selectedStage?.schedules?.find((s: any) => selectedDate ? s.scheduledDate?.startsWith(selectedDate) : false) ?? null;
  const selectedStageId = selectedStage?.id ?? selectedStage?.personalStageId ?? selectedStage?.stage?.id ?? null;

  const selectedStageSupplements = selectedStageId
    ? currentSupplements.filter((sp: any) => sp.personalStageId === selectedStageId)
    : currentSupplements;

  const allSchedules = currentStages.flatMap((st: any) => st.schedules?.map((s: any) => s.schedule) ?? []);
  const totalSessions = allSchedules.length;
  const firstSchedule = allSchedules[0];
  const lastSchedule = allSchedules[allSchedules.length - 1];

  const formatDate = (date: string) => new Date(date).toLocaleDateString('vi-VN');
  const totalAmount = currentRoadmap?.totalAmount ?? 0;

  const handleSelectDate = (date: string | null) => {
    setSelectedDate(date);
    setShowScheduleModal(true);
  };

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            onPress={() => {
              console.log('[Tab Click] Switching to CURRENT');
              setActiveTab('CURRENT');
              setSelectedStageIndex(0); // Reset index
              // useFocusEffect will handle fetching
            }}
            style={[styles.tabButton, activeTab === 'CURRENT' && styles.tabButtonActive]}
          >
            <Text style={[styles.tabText, activeTab === 'CURRENT' && styles.tabTextActive]}>
              Roadmap hiện tại
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              console.log('[Tab Click] Switching to PROCESSING');
              setActiveTab('PROCESSING');
              setSelectedStageIndex(0); // Reset index
              // useFocusEffect will handle fetching
            }}
            style={[styles.tabButton, activeTab === 'PROCESSING' && styles.tabButtonActive]}
          >
            <Text style={[styles.tabText, activeTab === 'PROCESSING' && styles.tabTextActive]}>
              Đang xử lý
            </Text>
          </TouchableOpacity>
        </View>

        {/* Header */}
        <View style={styles.sectionWrap}>
          <View style={styles.card}>
            <View style={styles.headerRow}>
              <View style={styles.headerTextWrap}>
                <Text style={styles.cardTitle} numberOfLines={1}>{currentRoadmap.title}</Text>
                {currentRoadmap.description ? (
                  <Text style={styles.cardSubtitle} numberOfLines={2}>{currentRoadmap.description}</Text>
                ) : null}
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statText}>
                  {`${Number(currentRoadmap.progressPercent ?? currentRoadmap.progress ?? 0)}%`}
                </Text>
              </View>
            </View>
            <View style={styles.progressWrap}>
              <View style={styles.progressBarBg}>
                <View
                  style={[styles.progressBarFill, { width: `${Math.max(0, Math.min(100, Number(currentRoadmap.progressPercent ?? currentRoadmap.progress ?? 0)))}%` }]}
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
            <StageCarousel stages={currentStages} onChangeIndex={setSelectedStageIndex} />
          )}
        </View>

        {/* Calendar / Schedule / Supplement */}
        {!isApiShaped && (
          <>
            <StageCalendar stage={selectedStage} selectedDate={selectedDate} onSelectDate={handleSelectDate} />

            <Modal visible={showScheduleModal} animationType="slide" onRequestClose={() => setShowScheduleModal(false)}>
              <SafeAreaView style={styles.modalContainer as any}>
                <View style={styles.modalHeader}>
                  <TouchableOpacity onPress={() => setShowScheduleModal(false)}>
                    <Text style={styles.closeText}>Đóng</Text>
                  </TouchableOpacity>
                </View>
                <ScrollView contentContainerStyle={styles.scrollContent}>
                  {selectedSchedule ? (
                    <ScheduleDetail schedule={selectedSchedule} />
                  ) : (
                    <View style={styles.modalEmpty}>
                      <Text style={styles.modalEmptyTitle}>Không có lịch cho ngày này.</Text>
                      <Text style={styles.modalEmptySubtitle}>Vui lòng chọn ngày có lịch để xem bài tập.</Text>
                    </View>
                  )}
                </ScrollView>
              </SafeAreaView>
            </Modal>

            <SupplementSection stage={selectedStage} />
          </>
        )}

        {/* Equipment */}
        {currentRoadmap?.equipment && Array.isArray(currentRoadmap.equipment) && currentRoadmap.equipment.length > 0 && (
          <View style={styles.sectionWrap}>
            <Text style={styles.equipmentTitle}>Thiết bị tập luyện</Text>
            {currentRoadmap.equipment.map((eq: any, idx: number) => (
              <TouchableOpacity
                key={idx}
                style={styles.itemCard}
                onPress={() => {
                  const q = eq.equipmentName ?? eq.name ?? '';
                  navigation.navigate('ShopSearchResult' as any, { q, roadmapFilter: { category: 'Thiết bị', equipmentName: q } });
                }}
              >
                <View style={styles.itemRow}>
                  {eq.imageUrl || eq.image || eq.thumbnailUrl || eq.equipmentImageUrl || eq.photo ? (
                    <Image
                      source={{ uri: eq.imageUrl || eq.image || eq.thumbnailUrl || eq.equipmentImageUrl || eq.photo }}
                      style={styles.itemImage} resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.itemImage} />
                  )}
                  <View style={styles.itemContent}>
                    <Text style={styles.itemTitle}>{eq.equipmentName ?? eq.name ?? 'Thiết bị'}</Text>
                    {eq.description && <Text style={styles.itemSubtitle}>{eq.description}</Text>}
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Supplements */}
        {(selectedStageSupplements?.length > 0 || currentSupplements?.length > 0) && (
          <View style={styles.sectionWrap}>
            <Text style={styles.supplementTitle}>Thực phẩm chức năng</Text>
            {(selectedStageSupplements?.length > 0 ? selectedStageSupplements : currentSupplements).map((sp: any, idx: number) => (
              <TouchableOpacity
                key={sp.personalStageSupplementId ?? idx} style={styles.itemCard}
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
                      <Text style={styles.itemTitle}>{sp.supplementName ?? 'Supplement'}</Text>
                      {sp.priority && <View style={styles.badge}><Text style={styles.badgeText}>{sp.priority}</Text></View>}
                    </View>
                    {sp.recommendedTiming && <Text style={styles.itemSubtitle}>Thời điểm: {sp.recommendedTiming}</Text>}
                    {sp.dosage && <Text style={styles.itemSubtitle}>Liều dùng: {sp.dosage}</Text>}
                    {sp.reason && <Text style={styles.itemSubtitle}>Lý do: {sp.reason}</Text>}
                    {sp.notes && <Text style={styles.itemSubtitle}>Ghi chú: {sp.notes}</Text>}
                    <Text style={styles.smallText}>Optional: {sp.optional ? 'Yes' : 'No'}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Bottom Action Bar for Processing Tab */}
      {activeTab === 'PROCESSING' && (
        <View style={styles.bottomBar}>
          <BottomActionBar
            showAccept={currentRoadmap?.status === 'PENDING' || activeTab === 'PROCESSING'}
            showSave={false}
            onAccept={handleAcceptRoadmap}
            accepting={saving}
          />
        </View>
      )}

      {/* Confirm Modal */}
      {showConfirmModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.confirmModal}>
            <Text style={styles.confirmTitle}>Xác nhận lộ trình</Text>
            <Text style={styles.confirmText}>💰 Giá: {totalAmount.toLocaleString()} VNĐ</Text>
            <Text style={styles.confirmText}>📊 Tổng số buổi: {totalSessions}</Text>

            {firstSchedule && lastSchedule && (
              <Text style={styles.confirmText}>
                📅 Thời gian: {formatDate(firstSchedule.scheduledDate)} - {formatDate(lastSchedule.scheduledDate)}
              </Text>
            )}

            <Text style={styles.confirmText}>
              📆 Lịch học: {[...new Set(allSchedules.map((s: any) => s.dayOfWeek))].join(', ')}
            </Text>

            <View style={styles.confirmButtons}>
              <TouchableOpacity onPress={() => setShowConfirmModal(false)} style={styles.cancelButton}>
                <Text style={styles.cancelText}>Huỷ</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={async () => {
                  try {
                    setSaving(true);
                    const roadmapId = currentRoadmap?.roadmapId ?? currentRoadmap?.id ?? currentRoadmap?._id;

                    const coachRequest = coachRequests.find((req: any) => req.coachId === currentRoadmap?.coachId);
                    const trainingDaySchedules = coachRequest?.trainingDaySchedules ?? [];

                    const bookingSlots = currentStages.flatMap((st: any) =>
                      st.schedules?.map((scheduleWrapper: any) => {
                        const schedule = scheduleWrapper.schedule;
                        const scheduledDate = new Date(schedule.scheduledDate);

                        const year = scheduledDate.getUTCFullYear();
                        const month = String(scheduledDate.getUTCMonth() + 1).padStart(2, '0');
                        const day = String(scheduledDate.getUTCDate()).padStart(2, '0');

                        const dayOfWeekMap: any = {
                          'THỨ HAI': 'MONDAY', 'THỨ BA': 'TUESDAY', 'THỨ TƯ': 'WEDNESDAY',
                          'THỨ NĂM': 'THURSDAY', 'THỨ SÁU': 'FRIDAY', 'THỨ BẢY': 'SATURDAY', 'CHỦ NHẬT': 'SUNDAY'
                        };

                        const dayOfWeekEng = dayOfWeekMap[schedule.dayOfWeek] || 'MONDAY';
                        const trainingSchedule = trainingDaySchedules.find((tds: any) => tds.dayOfWeek === dayOfWeekEng);
                        const startTimeStr = trainingSchedule?.startTime ?? '08:00';

                        const [hours, minutes] = startTimeStr.split(':');
                        const startDateTime = `${year}-${month}-${day}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00Z`;

                        const startDateTimeObj = new Date(startDateTime);
                        const start = new Date(startDateTimeObj.getTime() - 7 * 60 * 60 * 1000);
                        const durationMs = 60 * 60 * 1000;
                        const end = new Date(start.getTime() + durationMs);

                        return { startTime: start.toISOString(), endTime: end.toISOString() };
                      }) ?? []
                    );

                    const payload1 = {
                      coachId: currentRoadmap?.coachId,
                      bookingSlots: bookingSlots,
                      bookingType: "PERSONAL_TRAINING_PACKAGE",
                      recurringGroupId: roadmapId,
                    }

                    console.log("Payload for booking", payload1);
                    await RoadmapApi.createBatch(payload1);
                    await RoadmapApi.approveRoadmap(roadmapId);

                    setShowConfirmModal(false);
                    Alert.alert("Thành công", "Đã chấp nhận lộ trình");
                    
                    // Sau khi thanh toán xong, fetch lại data cả 2 bên và chuyển về màn hình CURRENT
                    await fetchNewest();
                    await fetchProcessing();
                    setActiveTab("CURRENT");
                    setSelectedStageIndex(0);

                  } catch (err: any) {
                    Alert.alert("Lỗi", err?.response?.data?.message ?? "Không thể chấp nhận roadmap");
                  } finally {
                    setSaving(false);
                  }
                }}
                style={styles.confirmButton}
              >
                <Text style={styles.confirmTextWhite}>Xác nhận thanh toán</Text>
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
  screen: { flex: 1, backgroundColor: '#FFFAF0' },
  scrollContent: { paddingBottom: 140 },
  mono: { fontFamily: 'monospace', fontSize: 12 },
  errorText: { color: 'red' },

  tabsContainer: {
    flexDirection: 'row', paddingHorizontal: 16, marginTop: 16, marginBottom: 8,
    borderRadius: 12, backgroundColor: '#F3EDE3', borderWidth: 1, borderColor: '#8B4513',
  },
  tabButton: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  tabButtonActive: { backgroundColor: '#8B4513' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#6B6B6B' },
  tabTextActive: { color: '#FFF' },

  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#eee',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 2,
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
  equipmentTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12, color: '#8B4513' },
  supplementTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12, color: '#8B4513' },

  itemCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: '#eee',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 1,
  },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  itemImage: { width: 72, height: 72, borderRadius: 8, backgroundColor: '#f3f4f6' },
  itemContent: { flex: 1 },
  itemHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  itemTitle: { fontSize: 16, color: '#3A2A1A', fontWeight: '700' },
  itemSubtitle: { fontSize: 13, color: '#6B6B6B', marginTop: 6 },
  badge: { backgroundColor: '#F3EDE3', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  badgeText: { color: '#8B4513', fontWeight: '700', fontSize: 11 },
  smallText: { fontSize: 12, color: '#8B8B8B', marginTop: 6 },

  centeredContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
  loadingText: { marginTop: 12, fontSize: 16, color: '#8B4513' },
  emptyTitle: { fontSize: 18, fontWeight: '600', marginBottom: 16, textAlign: 'center', color: '#3A2A1A', marginTop: 20 },
  buttonPrimary: { backgroundColor: '#8B4513', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  buttonPrimaryText: { color: '#fff', fontWeight: '500', fontSize: 16 },

  progressBarBg: { width: '100%', height: 10, backgroundColor: '#F3EDE3', borderRadius: 6, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#8B4513' },

  modalContainer: { flex: 1, backgroundColor: '#FFFAF0' },
  modalHeader: { height: 56, paddingHorizontal: 16, alignItems: 'flex-end', justifyContent: 'center' },
  closeText: { color: '#8B4513', fontWeight: '600' },
  modalEmpty: { padding: 20 },
  modalEmptyTitle: { color: '#3A2A1A', fontSize: 16 },
  modalEmptySubtitle: { color: '#6B6B6B', marginTop: 8 },

  bottomBar: { position: 'absolute', bottom: 20, left: 0, right: 0 },

  modalOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  confirmModal: { backgroundColor: '#fff', borderRadius: 16, padding: 20, width: '100%', maxWidth: 400 },
  confirmTitle: { fontSize: 20, fontWeight: '700', textAlign: 'center', marginBottom: 16, color: '#3A2A1A' },
  confirmText: { fontSize: 16, marginBottom: 8, color: '#3A2A1A' },
  confirmTextWhite: { fontSize: 16, color: '#FFF', fontWeight: '600' },
  confirmButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  cancelButton: { flex: 1, marginRight: 8, paddingVertical: 12, backgroundColor: '#f3f4f6', borderRadius: 8, alignItems: 'center' },
  cancelText: { color: '#6B6B6B', fontWeight: '600' },
  confirmButton: { flex: 1, marginLeft: 8, paddingVertical: 12, backgroundColor: '#8B4513', borderRadius: 8, alignItems: 'center' },

  recreateButton: {
    backgroundColor: '#8B4513', paddingVertical: 10, borderRadius: 8, alignItems: 'center', justifyContent: 'center',
  },
  recreateText: { color: '#FFF', fontWeight: '500', fontSize: 14 },
});