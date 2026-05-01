import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  ScrollView,
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Modal,
  TextInput,
} from 'react-native';
import ModalPopup from '../../components/ModalPopup';
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
import {
  fetchHealthProfileById,
  mapStoredHealthProfile,
} from '../../services/profile';
import RoadmapBodyMetricModal from './components/RoadmapVideo/RoadmapBodyMetricModal';

const RoadMap = () => {
  const storeList = useRoadmapStore(s => s.list);
  const route: any = useRoute();
  const navigation: any = useNavigation();

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
  const [selectedScheduleData, setSelectedScheduleData] = useState<any | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [currentRoadmapData, setCurrentRoadmapData] = useState<any | null>(roadmap);
  const [currentStagesData, setCurrentStagesData] = useState<any[]>(stages);
  const [currentSupplementsData, setCurrentSupplementsData] = useState<any[]>([]);

  const [pendingRoadmapData, setPendingRoadmapData] = useState<any | null>(null);
  const [pendingStagesData, setPendingStagesData] = useState<any[]>([]);
  const [pendingSupplementsData, setPendingSupplementsData] = useState<any[]>([]);

  const [lastError, setLastError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'CURRENT' | 'PROCESSING'>('CURRENT');
  const [coachRequests, setCoachRequests] = useState<any[]>([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const [showProgressModal, setShowProgressModal] = useState(false);
  const [progressInput, setProgressInput] = useState('');
  const [updatingProgress, setUpdatingProgress] = useState(false);

  const [showBodyMetricModal, setShowBodyMetricModal] = useState(false);
  const [roadmapHealthProfile, setRoadmapHealthProfile] = useState<any | null>(null);
  const [loadingRoadmapHealthProfile, setLoadingRoadmapHealthProfile] = useState(false);

  const [modalProps, setModalProps] = useState<any>({ visible: false });
  const showModal = (p: any) => setModalProps({ ...p, visible: true });
  const closeModal = () => setModalProps({ visible: false });

  const toVietnamDateKey = useCallback((dateInput: string | Date | null | undefined) => {
    if (!dateInput) return null;

    const date = new Date(dateInput);

    if (isNaN(date.getTime())) return null;

    const vietnamDate = new Date(date.getTime() + 7 * 60 * 60 * 1000);

    const year = vietnamDate.getUTCFullYear();
    const month = String(vietnamDate.getUTCMonth() + 1).padStart(2, '0');
    const day = String(vietnamDate.getUTCDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }, []);

  const getScheduleDateKey = useCallback(
    (scheduleWrapper: any) => {
      const rawDate =
        scheduleWrapper?.scheduledDate ??
        scheduleWrapper?.schedule?.scheduledDate ??
        null;

      return toVietnamDateKey(rawDate);
    },
    [toVietnamDateKey],
  );

  const getScheduleObject = useCallback((scheduleWrapper: any) => {
    if (!scheduleWrapper) return null;

    const innerSchedule = scheduleWrapper?.schedule ?? {};

    return {
      ...innerSchedule,
      ...scheduleWrapper,

      schedule: innerSchedule,

      scheduledDate:
        scheduleWrapper?.scheduledDate ??
        innerSchedule?.scheduledDate ??
        null,

      exercises:
        scheduleWrapper?.exercises ??
        innerSchedule?.exercises ??
        [],

      personalScheduleId:
        scheduleWrapper?.personalScheduleId ??
        innerSchedule?.personalScheduleId ??
        scheduleWrapper?.id ??
        innerSchedule?.id ??
        null,

      completed:
        scheduleWrapper?.completed ??
        innerSchedule?.completed ??
        false,

      scheduleName:
        scheduleWrapper?.scheduleName ??
        innerSchedule?.scheduleName ??
        innerSchedule?.name ??
        'Lịch tập',

      dayOfWeek:
        scheduleWrapper?.dayOfWeek ??
        innerSchedule?.dayOfWeek ??
        '',

      durationMinutes:
        scheduleWrapper?.durationMinutes ??
        innerSchedule?.durationMinutes ??
        0,

      description:
        scheduleWrapper?.description ??
        innerSchedule?.description ??
        '',
    };
  }, []);

  const isScheduleCompleted = useCallback((scheduleWrapper: any) => {
    const schedule = scheduleWrapper?.schedule ?? scheduleWrapper;

    return (
      scheduleWrapper?.completed === true ||
      schedule?.completed === true ||
      scheduleWrapper?.status === 'COMPLETED' ||
      schedule?.status === 'COMPLETED'
    );
  }, []);

  const getRoadmapId = useCallback((rm: any) => {
    return rm?.roadmapId ?? rm?.id ?? rm?._id ?? null;
  }, []);

  const fetchCoachRequests = async () => {
    try {
      const res = await RoadmapApi.getMyCoachRequests();
      const data = res?.data ?? res ?? [];
      setCoachRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('Không lấy được coach requests', err);
      setCoachRequests([]);
    }
  };

  const handleAcceptRoadmap = () => {
    setShowConfirmModal(true);
  };

  const fetchNewest = useCallback(async () => {
    try {
      setSaving(true);

      const newestData = await RoadmapApi.getNewest();
      console.log('roadmap newest response', newestData);

      const roadmapFromServer = newestData?.roadmap ?? newestData ?? null;
      const stagesFromServer =
        newestData?.stages ??
        (Array.isArray(newestData) ? newestData : []) ??
        [];

      if (!roadmapFromServer) {
        console.log('fetchNewest: no roadmap in response');
        setCurrentRoadmapData(null);
        setCurrentStagesData([]);
        setCurrentSupplementsData([]);
        setSaving(false);
        return;
      }

      const roadmapId = getRoadmapId(roadmapFromServer);

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
  }, [getRoadmapId]);

  const fetchProcessing = useCallback(async () => {
    try {
      setSaving(true);

      const processingResponse = await RoadmapApi.getPending();
      console.log('roadmap processing response', processingResponse);

      let responseData = processingResponse;

      if (processingResponse?.data?.data) {
        responseData = processingResponse.data.data;
      } else if (processingResponse?.data) {
        responseData = processingResponse.data;
      }

      const actualData = Array.isArray(responseData)
        ? responseData[0]
        : responseData;

      if (!actualData || Object.keys(actualData).length === 0) {
        console.log('fetchProcessing: Dữ liệu pending trống');
        setPendingRoadmapData(null);
        setPendingStagesData([]);
        setPendingSupplementsData([]);
        setSaving(false);
        return;
      }

      const roadmapFromServer = actualData?.roadmap ?? actualData ?? null;
      const stagesFromServer = actualData?.stages ?? [];

      const roadmapId = getRoadmapId(roadmapFromServer);

      if (!roadmapId) {
        console.warn('fetchProcessing: Không tìm thấy roadmapId trong object', roadmapFromServer);
        setPendingRoadmapData(null);
        setPendingStagesData([]);
        setPendingSupplementsData([]);
        setSaving(false);
        return;
      }

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

      setPendingRoadmapData(roadmapFromServer);
      setPendingStagesData(Array.isArray(stagesFromServer) ? stagesFromServer : []);
    } catch (err: any) {
      console.warn('fetchProcessing error', err);
      setLastError(String(err?.message ?? err));
    } finally {
      setSaving(false);
    }
  }, [getRoadmapId]);

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
    }, [fetchNewest, fetchProcessing, activeTab]),
  );

  const fetchEquipmentAndSupplements = useCallback(async (rm: any) => {
    try {
      const roadmapId = getRoadmapId(rm);

      if (!roadmapId) return;

      const [eqRes, supplementsRes] = await Promise.allSettled([
        RoadmapApi.getEquipment(roadmapId),
        RoadmapApi.getSupplements(roadmapId),
      ]);

      const normalizePayload = (res: any) => {
        if (!res) return [];

        const val = res?.data ?? res;

        if (Array.isArray(val)) return val;

        return Array.isArray(res) ? res : (val ?? []);
      };

      const equipment =
        eqRes.status === 'fulfilled'
          ? normalizePayload(eqRes.value)
          : [];

      const supplements =
        supplementsRes.status === 'fulfilled'
          ? normalizePayload(supplementsRes.value)
          : [];

      setCurrentRoadmapData((prev: any) => ({
        ...(prev ?? rm),
        equipment,
      }));

      setCurrentSupplementsData(supplements);
    } catch (err) {
      console.warn('fetchEquipmentAndSupplements error', err);
    }
  }, [getRoadmapId]);

  useEffect(() => {
    const target = paramAdded?.roadmap ?? roadmap;

    if (target && (!target.equipment || target.equipment.length === 0)) {
      fetchEquipmentAndSupplements(target);
    }
  }, [paramAdded, roadmap, fetchEquipmentAndSupplements]);

  const activeDataRoadmap =
    activeTab === 'CURRENT' ? currentRoadmapData : pendingRoadmapData;

  const activeDataStages =
    activeTab === 'CURRENT' ? currentStagesData : pendingStagesData;

  const activeDataSupplements =
    activeTab === 'CURRENT'
      ? currentSupplementsData
      : pendingSupplementsData;

  const currentRoadmap =
    activeDataRoadmap ??
    (activeTab === 'CURRENT' ? roadmap : null);

  const currentStages =
    activeDataStages?.length
      ? activeDataStages
      : activeTab === 'CURRENT'
        ? stages
        : [];

  const currentSupplements =
    activeDataSupplements?.length
      ? activeDataSupplements
      : currentRoadmap?.supplements ?? [];

  const currentProgress = Number(
    currentRoadmap?.progressPercent ?? currentRoadmap?.progress ?? 0,
  );

  const safeProgress = Math.max(0, Math.min(100, currentProgress));

  const roadmapHealthProfileId =
    currentRoadmap?.finalHealthProfileId ??
    currentRoadmap?.initialHealthProfileId ??
    null;

  useEffect(() => {
    let mounted = true;

    async function loadRoadmapHealthProfile() {
      if (!roadmapHealthProfileId) {
        setRoadmapHealthProfile(null);
        return;
      }

      try {
        setLoadingRoadmapHealthProfile(true);

        const res = await fetchHealthProfileById(
          String(roadmapHealthProfileId),
        );

        if (!mounted) return;

        if (res.ok) {
          setRoadmapHealthProfile(res.data);
        } else {
          console.log('fetch roadmap health profile error:', res.error);
          setRoadmapHealthProfile(null);
        }
      } catch (e) {
        console.log('loadRoadmapHealthProfile error:', e);
        setRoadmapHealthProfile(null);
      } finally {
        if (mounted) {
          setLoadingRoadmapHealthProfile(false);
        }
      }
    }

    loadRoadmapHealthProfile();

    return () => {
      mounted = false;
    };
  }, [roadmapHealthProfileId]);

  const roadmapHealthMapped = useMemo(() => {
    return mapStoredHealthProfile(roadmapHealthProfile);
  }, [roadmapHealthProfile]);

  const openProgressModal = () => {
    setProgressInput(String(safeProgress));
    setShowProgressModal(true);
  };

  const handleOpenBodyMetricUpdate = () => {
    setShowBodyMetricModal(false);

    navigation.navigate('InputBody' as any, {
    returnToAfterAssessment: {
      root: 'MainTabs',
      screen: 'Roadmap',
    },
  });
  };

  const handleUpdateProgress = async () => {
    try {
      const roadmapId = getRoadmapId(currentRoadmap);

      if (!roadmapId) {
        showModal({ mode: 'noti', titleText: 'Lỗi', contentText: 'Không tìm thấy roadmapId' });
        return;
      }

      const nextProgress = Number(progressInput);

      if (Number.isNaN(nextProgress)) {
        showModal({ mode: 'noti', titleText: 'Lỗi', contentText: 'Progress phải là số' });
        return;
      }

      if (nextProgress < 0 || nextProgress > 100) {
        showModal({ mode: 'noti', titleText: 'Lỗi', contentText: 'Progress phải nằm trong khoảng 0 - 100' });
        return;
      }

      setUpdatingProgress(true);

      const updatedRoadmap = await RoadmapApi.updateProgress(
        roadmapId,
        nextProgress,
      );

      if (activeTab === 'CURRENT') {
        setCurrentRoadmapData((prev: any) => ({
          ...(prev ?? currentRoadmap),
          ...updatedRoadmap,
          progressPercent: updatedRoadmap?.progressPercent ?? nextProgress,
        }));
      } else {
        setPendingRoadmapData((prev: any) => ({
          ...(prev ?? currentRoadmap),
          ...updatedRoadmap,
          progressPercent: updatedRoadmap?.progressPercent ?? nextProgress,
        }));
      }

      setShowProgressModal(false);
      showModal({ mode: 'noti', titleText: 'Thành công', contentText: `Đã cập nhật progress lên ${nextProgress}%` });
    } catch (err: any) {
      showModal({ mode: 'noti', titleText: 'Lỗi', contentText: err?.response?.data?.message ?? 'Không thể cập nhật progress' });
    } finally {
      setUpdatingProgress(false);
    }
  };

  const isApiShaped =
    Array.isArray(currentStages) &&
    currentStages.length > 0 &&
    Boolean(currentStages[0]?.stage || currentStages[0]?._raw);

  const selectedStage =
    currentStages?.[selectedStageIndex] ??
    currentStages?.[0] ??
    null;

  const completedDateMap = useMemo(() => {
    const map: Record<string, boolean> = {};

    const schedules = selectedStage?.schedules ?? [];

    schedules.forEach((item: any) => {
      const dateKey = getScheduleDateKey(item);

      if (dateKey && isScheduleCompleted(item)) {
        map[dateKey] = true;
      }
    });

    return map;
  }, [selectedStage, getScheduleDateKey, isScheduleCompleted]);

  const selectedStageId =
    selectedStage?.id ??
    selectedStage?.personalStageId ??
    selectedStage?.stage?.id ??
    null;

  const selectedStageSupplements = selectedStageId
    ? currentSupplements.filter((sp: any) => sp.personalStageId === selectedStageId)
    : currentSupplements;

  const allSchedules = currentStages.flatMap((st: any) =>
    st.schedules?.map((s: any) => s.schedule ?? s) ?? [],
  );

  const totalSessions = allSchedules.length;
  const firstSchedule = allSchedules[0];
  const lastSchedule = allSchedules[allSchedules.length - 1];

  const formatDate = (date: string) => new Date(date).toLocaleDateString('vi-VN');
  const totalAmount = currentRoadmap?.totalAmount ?? 0;

  const handleSelectDate = (date: string | null, scheduleWrapperFromCalendar?: any) => {
    console.log('[RoadMap] selected date:', date);
    console.log('[RoadMap] wrapper from calendar:', scheduleWrapperFromCalendar);

    setSelectedDate(date);
    setSelectedScheduleData(null);

    if (!scheduleWrapperFromCalendar) {
      console.log('[RoadMap] no schedule for selected date:', date);
      setShowScheduleModal(true);
      return;
    }

    const scheduleObject = getScheduleObject(scheduleWrapperFromCalendar);

    console.log('[RoadMap] final selected schedule:', {
      selectedDate: date,
      dateKey: getScheduleDateKey(scheduleWrapperFromCalendar),
      scheduledDate: scheduleObject?.scheduledDate,
      scheduleName: scheduleObject?.scheduleName,
      dayOfWeek: scheduleObject?.dayOfWeek,
      personalScheduleId: scheduleObject?.personalScheduleId,
      completed: scheduleObject?.completed,
      exercisesLength: scheduleObject?.exercises?.length,
    });

    setSelectedScheduleData(scheduleObject);
    setShowScheduleModal(true);
  };

  const renderPageHeader = () => {
    return (
      <View style={styles.pageHeader}>
        <View style={styles.pageHeaderTextWrap}>
          <Text style={styles.pageHeaderTitle}>Lộ trình</Text>
          <Text style={styles.pageHeaderSubtitle}>
            Theo dõi tiến độ tập luyện của bạn
          </Text>
        </View>

        <View style={styles.headerActionGroup}>
          <TouchableOpacity
            style={[
              styles.progressEditButton,
              (!currentRoadmap || saving || updatingProgress) &&
                styles.progressEditButtonDisabled,
            ]}
            onPress={openProgressModal}
            disabled={!currentRoadmap || saving || updatingProgress}
            activeOpacity={0.85}
          >
            <Text style={styles.progressEditButtonText}>Chỉnh progress</Text>
          </TouchableOpacity>

          {safeProgress >= 100 ? (
            <TouchableOpacity
              style={styles.bodyMetricButton}
              onPress={() => setShowBodyMetricModal(true)}
              activeOpacity={0.85}
            >
              <Text style={styles.bodyMetricButtonText}>Cập nhật số đo</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    );
  };

  const renderTabs = () => {
    const handleChangeTab = (tab: 'CURRENT' | 'PROCESSING') => {
      setActiveTab(tab);
      setSelectedStageIndex(0);
      setSelectedDate(null);
      setSelectedScheduleData(null);
    };

    return (
      <View style={styles.tabsOuter}>
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => handleChangeTab('CURRENT')}
            style={[
              styles.tabButton,
              activeTab === 'CURRENT' && styles.tabButtonActive,
            ]}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'CURRENT' && styles.tabTextActive,
              ]}
              numberOfLines={1}
            >
              Hiện tại
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => handleChangeTab('PROCESSING')}
            style={[
              styles.tabButton,
              activeTab === 'PROCESSING' && styles.tabButtonActive,
            ]}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'PROCESSING' && styles.tabTextActive,
              ]}
              numberOfLines={1}
            >
              Đang xử lý
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

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
      <SafeAreaView style={styles.screen}>
        {renderPageHeader()}

        <View style={styles.emptyContent}>
          {renderTabs()}

          <Text style={styles.emptyTitle}>
            {activeTab === 'CURRENT'
              ? 'Bạn chưa có lộ trình'
              : 'Không có lộ trình nào đang xử lý'}
          </Text>

          {activeTab === 'CURRENT' && (
            <TouchableOpacity
              onPress={() => navigation.navigate('CreateRoadmap')}
              style={styles.buttonPrimary}
              activeOpacity={0.85}
            >
              <Text style={styles.buttonPrimaryText}>Tạo lộ trình mới</Text>
            </TouchableOpacity>
          )}
        </View>

        <RoadmapBodyMetricModal
          visible={showBodyMetricModal}
          onClose={() => setShowBodyMetricModal(false)}
          onConfirm={handleOpenBodyMetricUpdate}
          roadmapTitle={currentRoadmap?.title}
          progressPercent={safeProgress}
          totalSessions={totalSessions}
          loadingProfile={loadingRoadmapHealthProfile}
          healthProfile={roadmapHealthMapped}
        />

        <ModalPopup {...(modalProps as any)} onClose={closeModal} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {renderPageHeader()}

        {renderTabs()}

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

              <View style={styles.statBox}>
                <Text style={styles.statText}>{`${safeProgress}%`}</Text>
              </View>
            </View>

            <View style={styles.progressWrap}>
              <View style={styles.progressBarBg}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${safeProgress}%`,
                    },
                  ]}
                />
              </View>
            </View>
          </View>
        </View>

        <View style={styles.stageSelector}>
          {isApiShaped ? (
            <StageRendererApi apiStages={currentStages} roadmap={currentRoadmap} />
          ) : (
            <StageCarousel
              stages={currentStages}
              onChangeIndex={(idx: number) => {
                setSelectedStageIndex(idx);
                setSelectedDate(null);
                setSelectedScheduleData(null);
              }}
            />
          )}
        </View>

        {!isApiShaped && (
          <>
            <StageCalendar
              stage={selectedStage}
              selectedDate={selectedDate}
              onSelectDate={handleSelectDate}
              completedDateMap={completedDateMap}
            />

            <Modal
              visible={showScheduleModal}
              animationType="slide"
              presentationStyle="fullScreen"
              onRequestClose={() => {
                setShowScheduleModal(false);
                setSelectedScheduleData(null);
              }}
            >
              <SafeAreaView style={styles.modalContainer as any}>
                <View style={styles.modalHeader}>
                  <TouchableOpacity
                    onPress={() => {
                      setShowScheduleModal(false);
                      setSelectedScheduleData(null);
                    }}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.closeText}>Đóng</Text>
                  </TouchableOpacity>
                </View>

                <ScrollView
                  style={styles.modalScroll}
                  contentContainerStyle={styles.modalScrollContent}
                  showsVerticalScrollIndicator={false}
                  nestedScrollEnabled
                  keyboardShouldPersistTaps="handled"
                >
                  {selectedScheduleData ? (
                    <ScheduleDetail
                      key={
                        selectedScheduleData?.personalScheduleId ??
                        selectedScheduleData?.scheduledDate ??
                        selectedDate
                      }
                      schedule={selectedScheduleData}
                      onScheduleCompleted={async () => {
                        await fetchNewest();
                      }}
                    />
                  ) : (
                    <View style={styles.modalEmpty}>
                      <Text style={styles.modalEmptyTitle}>Không có lịch cho ngày này.</Text>
                      <Text style={styles.modalEmptySubtitle}>
                        Vui lòng chọn ngày có lịch để xem bài tập.
                      </Text>
                    </View>
                  )}
                </ScrollView>
              </SafeAreaView>
            </Modal>

            <SupplementSection stage={selectedStage} />
          </>
        )}

        {currentRoadmap?.equipment &&
          Array.isArray(currentRoadmap.equipment) &&
          currentRoadmap.equipment.length > 0 && (
            <View style={styles.sectionWrap}>
              <Text style={styles.equipmentTitle}>Thiết bị tập luyện</Text>

              {currentRoadmap.equipment.map((eq: any, idx: number) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.itemCard}
                  activeOpacity={0.85}
                  onPress={() => {
                    const q = eq.equipmentName ?? eq.name ?? '';

                    navigation.navigate('ShopSearchResult' as any, {
                      q,
                      roadmapFilter: {
                        category: 'Thiết bị',
                        equipmentName: q,
                      },
                    });
                  }}
                >
                  <View style={styles.itemRow}>
                    {eq.imageUrl ||
                    eq.image ||
                    eq.thumbnailUrl ||
                    eq.equipmentImageUrl ||
                    eq.photo ? (
                      <Image
                        source={{
                          uri:
                            eq.imageUrl ||
                            eq.image ||
                            eq.thumbnailUrl ||
                            eq.equipmentImageUrl ||
                            eq.photo,
                        }}
                        style={styles.itemImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.itemImage} />
                    )}

                    <View style={styles.itemContent}>
                      <Text style={styles.itemTitle}>
                        {eq.equipmentName ?? eq.name ?? 'Thiết bị'}
                      </Text>

                      {eq.description && (
                        <Text style={styles.itemSubtitle}>{eq.description}</Text>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

        {(selectedStageSupplements?.length > 0 || currentSupplements?.length > 0) && (
          <View style={styles.sectionWrap}>
            <Text style={styles.supplementTitle}>Thực phẩm chức năng</Text>

            {(selectedStageSupplements?.length > 0
              ? selectedStageSupplements
              : currentSupplements
            ).map((sp: any, idx: number) => (
              <TouchableOpacity
                key={sp.personalStageSupplementId ?? idx}
                style={styles.itemCard}
                activeOpacity={0.85}
                onPress={() => {
                  const q = sp.supplementName ?? 'Supplement';

                  navigation.navigate('ShopSearchResult' as any, {
                    q,
                    roadmapFilter: {
                      category: 'Thực phẩm chức năng',
                      supplementName: q,
                    },
                  });
                }}
              >
                <View style={styles.itemRow}>
                  {sp.supplementImageUrl ? (
                    <Image
                      source={{ uri: sp.supplementImageUrl }}
                      style={styles.itemImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.itemImage} />
                  )}

                  <View style={styles.itemContent}>
                    <View style={styles.itemHeaderRow}>
                      <Text style={styles.itemTitle}>
                        {sp.supplementName ?? 'Supplement'}
                      </Text>

                      {sp.priority && (
                        <View style={styles.badge}>
                          <Text style={styles.badgeText}>{sp.priority}</Text>
                        </View>
                      )}
                    </View>

                    {sp.recommendedTiming && (
                      <Text style={styles.itemSubtitle}>
                        Thời điểm: {sp.recommendedTiming}
                      </Text>
                    )}

                    {sp.dosage && (
                      <Text style={styles.itemSubtitle}>
                        Liều dùng: {sp.dosage}
                      </Text>
                    )}

                    {sp.reason && (
                      <Text style={styles.itemSubtitle}>
                        Lý do: {sp.reason}
                      </Text>
                    )}

                    {sp.notes && (
                      <Text style={styles.itemSubtitle}>
                        Ghi chú: {sp.notes}
                      </Text>
                    )}

                    <Text style={styles.smallText}>
                      Optional: {sp.optional ? 'Yes' : 'No'}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

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

      {showProgressModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.progressModal}>
            <Text style={styles.progressModalTitle}>Chỉnh progress roadmap</Text>

            <Text style={styles.progressModalLabel}>
              Nhập progress mới từ 0 đến 100
            </Text>

            <TextInput
              value={progressInput}
              onChangeText={setProgressInput}
              keyboardType="numeric"
              placeholder="Ví dụ: 45"
              placeholderTextColor="#A0A0A0"
              style={styles.progressInput}
            />

            <View style={styles.quickProgressRow}>
              {[0, 25, 50, 75, 100].map(value => (
                <TouchableOpacity
                  key={value}
                  style={styles.quickProgressChip}
                  onPress={() => setProgressInput(String(value))}
                  disabled={updatingProgress}
                  activeOpacity={0.85}
                >
                  <Text style={styles.quickProgressText}>{value}%</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.progressModalButtons}>
              <TouchableOpacity
                onPress={() => setShowProgressModal(false)}
                style={styles.progressCancelButton}
                disabled={updatingProgress}
                activeOpacity={0.85}
              >
                <Text style={styles.progressCancelText}>Huỷ</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleUpdateProgress}
                style={styles.progressConfirmButton}
                disabled={updatingProgress}
                activeOpacity={0.85}
              >
                <Text style={styles.progressConfirmText}>
                  {updatingProgress ? 'Đang lưu...' : 'Lưu'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {showConfirmModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.confirmModal}>
            <Text style={styles.confirmTitle}>Xác nhận lộ trình</Text>
            <Text style={styles.confirmText}>💰 Giá: {totalAmount.toLocaleString()} VNĐ</Text>
            <Text style={styles.confirmText}>📊 Tổng số buổi: {totalSessions}</Text>

            {firstSchedule && lastSchedule && (
              <Text style={styles.confirmText}>
                📅 Thời gian: {formatDate(firstSchedule.scheduledDate)} -{' '}
                {formatDate(lastSchedule.scheduledDate)}
              </Text>
            )}

            <Text style={styles.confirmText}>
              📆 Lịch học: {[...new Set(allSchedules.map((s: any) => s.dayOfWeek))].join(', ')}
            </Text>

            <View style={styles.confirmButtons}>
              <TouchableOpacity
                onPress={() => setShowConfirmModal(false)}
                style={styles.cancelButton}
                activeOpacity={0.85}
              >
                <Text style={styles.cancelText}>Huỷ</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={async () => {
                  try {
                    setSaving(true);

                    const roadmapId = getRoadmapId(currentRoadmap);

                    const coachRequest = coachRequests.find(
                      (req: any) => req.coachId === currentRoadmap?.coachId,
                    );

                    const trainingDaySchedules =
                      coachRequest?.trainingDaySchedules ?? [];

                    const bookingSlots = currentStages.flatMap((st: any) =>
                      st.schedules?.map((scheduleWrapper: any) => {
                        const schedule = scheduleWrapper.schedule ?? scheduleWrapper;
                        const scheduledDate = new Date(schedule.scheduledDate);

                        const year = scheduledDate.getUTCFullYear();
                        const month = String(scheduledDate.getUTCMonth() + 1).padStart(2, '0');
                        const day = String(scheduledDate.getUTCDate()).padStart(2, '0');

                        const dayOfWeekMap: any = {
                          'THỨ HAI': 'MONDAY',
                          'THỨ BA': 'TUESDAY',
                          'THỨ TƯ': 'WEDNESDAY',
                          'THỨ NĂM': 'THURSDAY',
                          'THỨ SÁU': 'FRIDAY',
                          'THỨ BẢY': 'SATURDAY',
                          'CHỦ NHẬT': 'SUNDAY',
                        };

                        const dayOfWeekEng = dayOfWeekMap[schedule.dayOfWeek] || 'MONDAY';

                        const trainingSchedule = trainingDaySchedules.find(
                          (tds: any) => tds.dayOfWeek === dayOfWeekEng,
                        );

                        const startTimeStr = trainingSchedule?.startTime ?? '08:00';
                        const [hours, minutes] = startTimeStr.split(':');

                        const startDateTime =
                          `${year}-${month}-${day}T${String(hours).padStart(2, '0')}:` +
                          `${String(minutes).padStart(2, '0')}:00Z`;

                        const startDateTimeObj = new Date(startDateTime);
                        const start = new Date(startDateTimeObj.getTime() - 7 * 60 * 60 * 1000);
                        const durationMs = 60 * 60 * 1000;
                        const end = new Date(start.getTime() + durationMs);

                        return {
                          startTime: start.toISOString(),
                          endTime: end.toISOString(),
                        };
                      }) ?? [],
                    );

                    const payload1 = {
                      coachId: currentRoadmap?.coachId,
                      bookingSlots,
                      bookingType: 'PERSONAL_TRAINING_PACKAGE',
                      recurringGroupId: roadmapId,
                    };

                    console.log('Payload for booking', payload1);

                    await RoadmapApi.createBatch(payload1);
                    await RoadmapApi.approveRoadmap(roadmapId);

                    setShowConfirmModal(false);
                    showModal({ mode: 'noti', titleText: 'Thành công', contentText: 'Đã chấp nhận lộ trình' });

                    await fetchNewest();
                    await fetchProcessing();

                    setActiveTab('CURRENT');
                    setSelectedStageIndex(0);
                    setSelectedDate(null);
                    setSelectedScheduleData(null);
                  } catch (err: any) {
                    showModal({ mode: 'noti', titleText: 'Lỗi', contentText: err?.response?.data?.message ?? 'Không thể chấp nhận roadmap' });
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

      <RoadmapBodyMetricModal
        visible={showBodyMetricModal}
        onClose={() => setShowBodyMetricModal(false)}
        onConfirm={handleOpenBodyMetricUpdate}
        roadmapTitle={currentRoadmap?.title}
        progressPercent={safeProgress}
        totalSessions={totalSessions}
        loadingProfile={loadingRoadmapHealthProfile}
        healthProfile={roadmapHealthMapped}
      />

      <ModalPopup {...(modalProps as any)} onClose={closeModal} />
    </SafeAreaView>
  );
};

export default RoadMap;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFFAF0' },
  scrollContent: { paddingBottom: 140 },
  mono: { fontFamily: 'monospace', fontSize: 12 },
  errorText: { color: 'red' },

  pageHeader: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFE3D4',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  pageHeaderTextWrap: {
    flex: 1,
    paddingRight: 12,
  },
  pageHeaderTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#3A2A1A',
  },
  pageHeaderSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: '#7A6A58',
  },
  headerActionGroup: {
    alignItems: 'flex-end',
    gap: 8,
  },
  progressEditButton: {
    backgroundColor: '#8B4513',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 999,
  },
  progressEditButtonDisabled: {
    opacity: 0.5,
  },
  progressEditButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  bodyMetricButton: {
    backgroundColor: '#A0522D',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 999,
  },
  bodyMetricButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  tabsOuter: {
    paddingHorizontal: 16,
    marginTop: 14,
    marginBottom: 10,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#F4EBDD',
    padding: 5,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E1C7AC',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  tabButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  tabButtonActive: {
    backgroundColor: '#9C4F0F',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 5,
    elevation: 3,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#8A7A69',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },

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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTextWrap: { flex: 1, paddingRight: 8 },
  cardTitle: { color: '#3A2A1A', fontSize: 18, fontWeight: '700' },
  cardSubtitle: { color: '#6B6B6B', marginTop: 4, fontSize: 13 },
  statBox: {
    minWidth: 48,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F3EDE3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statText: { color: '#8B4513', fontWeight: '700' },
  progressWrap: { marginTop: 10 },
  progressBarBg: {
    width: '100%',
    height: 10,
    backgroundColor: '#F3EDE3',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressBarFill: { height: '100%', backgroundColor: '#8B4513' },

  stageSelector: { marginTop: 12 },
  sectionWrap: { paddingHorizontal: 16, marginTop: 24 },

  equipmentTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#8B4513',
  },
  supplementTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#8B4513',
  },

  itemCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  itemImage: {
    width: 72,
    height: 72,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  itemContent: { flex: 1 },
  itemHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemTitle: { fontSize: 16, color: '#3A2A1A', fontWeight: '700' },
  itemSubtitle: { fontSize: 13, color: '#6B6B6B', marginTop: 6 },
  badge: {
    backgroundColor: '#F3EDE3',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeText: { color: '#8B4513', fontWeight: '700', fontSize: 11 },
  smallText: { fontSize: 12, color: '#8B8B8B', marginTop: 6 },

  centeredContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  emptyContent: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 0,
  },
  loadingText: { marginTop: 12, fontSize: 16, color: '#8B4513' },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
    color: '#3A2A1A',
    marginTop: 20,
  },
  buttonPrimary: {
    backgroundColor: '#8B4513',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  buttonPrimaryText: { color: '#fff', fontWeight: '500', fontSize: 16 },

  modalContainer: { flex: 1, backgroundColor: '#FFFAF0' },
  modalHeader: {
    height: 56,
    paddingHorizontal: 16,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  closeText: { color: '#8B4513', fontWeight: '600' },
  modalScroll: { flex: 1 },
  modalScrollContent: { paddingBottom: 180 },
  modalEmpty: { padding: 20 },
  modalEmptyTitle: { color: '#3A2A1A', fontSize: 16 },
  modalEmptySubtitle: { color: '#6B6B6B', marginTop: 8 },

  bottomBar: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
  },

  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },

  progressModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  progressModalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#3A2A1A',
    textAlign: 'center',
    marginBottom: 10,
  },
  progressModalLabel: {
    fontSize: 14,
    color: '#6B6B6B',
    marginBottom: 10,
  },
  progressInput: {
    height: 48,
    borderWidth: 1,
    borderColor: '#D8C6B4',
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 16,
    color: '#3A2A1A',
    backgroundColor: '#FFFAF0',
  },
  quickProgressRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  quickProgressChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F3EDE3',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E2D2C1',
  },
  quickProgressText: {
    color: '#8B4513',
    fontSize: 13,
    fontWeight: '700',
  },
  progressModalButtons: {
    flexDirection: 'row',
    marginTop: 20,
  },
  progressCancelButton: {
    flex: 1,
    marginRight: 8,
    paddingVertical: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    alignItems: 'center',
  },
  progressCancelText: {
    color: '#6B6B6B',
    fontWeight: '700',
  },
  progressConfirmButton: {
    flex: 1,
    marginLeft: 8,
    paddingVertical: 12,
    backgroundColor: '#8B4513',
    borderRadius: 10,
    alignItems: 'center',
  },
  progressConfirmText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  confirmModal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  confirmTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
    color: '#3A2A1A',
  },
  confirmText: { fontSize: 16, marginBottom: 8, color: '#3A2A1A' },
  confirmTextWhite: { fontSize: 16, color: '#FFF', fontWeight: '600' },
  confirmButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    marginRight: 8,
    paddingVertical: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelText: { color: '#6B6B6B', fontWeight: '600' },
  confirmButton: {
    flex: 1,
    marginLeft: 8,
    paddingVertical: 12,
    backgroundColor: '#8B4513',
    borderRadius: 8,
    alignItems: 'center',
  },

  recreateButton: {
    backgroundColor: '#8B4513',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recreateText: { color: '#FFF', fontWeight: '500', fontSize: 14 },
});