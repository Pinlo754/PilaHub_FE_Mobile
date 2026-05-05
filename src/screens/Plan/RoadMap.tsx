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
import Ionicons from '@react-native-vector-icons/ionicons';
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
  const routeRoadmapId = route.params?.roadmapId ?? null;

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
  const [selectedScheduleData, setSelectedScheduleData] = useState<any | null>(
    null,
  );
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [currentRoadmapData, setCurrentRoadmapData] = useState<any | null>(
    roadmap,
  );
  const [currentStagesData, setCurrentStagesData] = useState<any[]>(stages);
  const [currentSupplementsData, setCurrentSupplementsData] = useState<any[]>(
    [],
  );

  const [pendingRoadmapData, setPendingRoadmapData] = useState<any | null>(
    null,
  );
  const [pendingStagesData, setPendingStagesData] = useState<any[]>([]);
  const [pendingSupplementsData, setPendingSupplementsData] = useState<any[]>(
    [],
  );

  const [activeTab, setActiveTab] = useState<'CURRENT' | 'PROCESSING'>(
    'CURRENT',
  );
  const [coachRequests, setCoachRequests] = useState<any[]>([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const [showProgressModal, setShowProgressModal] = useState(false);
  const [progressInput, setProgressInput] = useState('');
  const [updatingProgress, setUpdatingProgress] = useState(false);

  const [showBodyMetricModal, setShowBodyMetricModal] = useState(false);

  const [bodyMetricMode, setBodyMetricMode] = useState<'INITIAL' | 'FINAL'>(
    'INITIAL',
  );

  const [roadmapInitialHealthProfile, setRoadmapInitialHealthProfile] =
    useState<any | null>(null);

  const [roadmapFinalHealthProfile, setRoadmapFinalHealthProfile] =
    useState<any | null>(null);

  const [loadingRoadmapHealthProfile, setLoadingRoadmapHealthProfile] =
    useState(false);

  const [
    loadingRoadmapFinalHealthProfile,
    setLoadingRoadmapFinalHealthProfile,
  ] = useState(false);

  const [modalProps, setModalProps] = useState<any>({ visible: false });

  const showModal = (p: any) => setModalProps({ ...p, visible: true });
  const closeModal = () => setModalProps({ visible: false });

  const toVietnamDateKey = useCallback(
    (dateInput: string | Date | null | undefined) => {
      if (!dateInput) return null;

      const date = new Date(dateInput);

      if (isNaN(date.getTime())) return null;

      const vietnamDate = new Date(date.getTime() + 7 * 60 * 60 * 1000);

      const year = vietnamDate.getUTCFullYear();
      const month = String(vietnamDate.getUTCMonth() + 1).padStart(2, '0');
      const day = String(vietnamDate.getUTCDate()).padStart(2, '0');

      return `${year}-${month}-${day}`;
    },
    [],
  );

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
        scheduleWrapper?.scheduledDate ?? innerSchedule?.scheduledDate ?? null,
      exercises: scheduleWrapper?.exercises ?? innerSchedule?.exercises ?? [],
      personalScheduleId:
        scheduleWrapper?.personalScheduleId ??
        innerSchedule?.personalScheduleId ??
        scheduleWrapper?.id ??
        innerSchedule?.id ??
        null,
      completed:
        scheduleWrapper?.completed ?? innerSchedule?.completed ?? false,
      scheduleName:
        scheduleWrapper?.scheduleName ??
        innerSchedule?.scheduleName ??
        innerSchedule?.name ??
        'Lịch tập',
      dayOfWeek: scheduleWrapper?.dayOfWeek ?? innerSchedule?.dayOfWeek ?? '',
      durationMinutes:
        scheduleWrapper?.durationMinutes ?? innerSchedule?.durationMinutes ?? 0,
      description:
        scheduleWrapper?.description ?? innerSchedule?.description ?? '',
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

      const newestData = routeRoadmapId
        ? await RoadmapApi.getRoadmapDetail(String(routeRoadmapId))
        : await RoadmapApi.getNewest();

      console.log('roadmap current response:', newestData);

      const roadmapFromServer = newestData?.roadmap ?? newestData ?? null;

      const stagesFromServer =
        newestData?.stages ??
        roadmapFromServer?.stages ??
        route.params?.stages ??
        paramAdded?.stages ??
        [];

      if (!roadmapFromServer) {
        setCurrentRoadmapData(null);
        setCurrentStagesData([]);
        setCurrentSupplementsData([]);
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
          console.warn('Lỗi khi lấy equipment/supplements Current', err);
          roadmapFromServer.supplements = [];
          setCurrentSupplementsData([]);
        }
      } else {
        roadmapFromServer.supplements = [];
        setCurrentSupplementsData([]);
      }

      setCurrentRoadmapData(roadmapFromServer);
      setCurrentStagesData(
        Array.isArray(stagesFromServer) ? stagesFromServer : [],
      );
    } catch (err: any) {
      console.warn('fetchNewest error', err);
    } finally {
      setSaving(false);
    }
  }, [
    getRoadmapId,
    routeRoadmapId,
    route.params?.stages,
    paramAdded?.stages,
  ]);

  const fetchProcessing = useCallback(async () => {
    try {
      setSaving(true);

      const processingResponse = await RoadmapApi.getPending();
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
        setPendingRoadmapData(null);
        setPendingStagesData([]);
        setPendingSupplementsData([]);
        return;
      }

      const roadmapFromServer = actualData?.roadmap ?? actualData ?? null;
      const stagesFromServer = actualData?.stages ?? [];
      const roadmapId = getRoadmapId(roadmapFromServer);

      if (!roadmapId) {
        setPendingRoadmapData(null);
        setPendingStagesData([]);
        setPendingSupplementsData([]);
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
        console.warn('Lỗi khi lấy equipment/supplements Pending', err);
        roadmapFromServer.supplements = [];
        setPendingSupplementsData([]);
      }

      setPendingRoadmapData(roadmapFromServer);
      setPendingStagesData(
        Array.isArray(stagesFromServer) ? stagesFromServer : [],
      );
    } catch (err: any) {
      console.warn('fetchProcessing error', err);
    } finally {
      setSaving(false);
    }
  }, [getRoadmapId]);

  useFocusEffect(
    useCallback(() => {
      if (activeTab === 'CURRENT') {
        fetchNewest();
      } else {
        fetchProcessing();
      }

      fetchCoachRequests();

      return () => {};
    }, [fetchNewest, fetchProcessing, activeTab]),
  );

  const fetchEquipmentAndSupplements = useCallback(
    async (rm: any) => {
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

          return Array.isArray(res) ? res : val ?? [];
        };

        const equipment =
          eqRes.status === 'fulfilled' ? normalizePayload(eqRes.value) : [];

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
    },
    [getRoadmapId],
  );

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
    activeTab === 'CURRENT' ? currentSupplementsData : pendingSupplementsData;

  const currentRoadmap =
    activeDataRoadmap ?? (activeTab === 'CURRENT' ? roadmap : null);

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

  const roadmapInitialHealthProfileId =
    currentRoadmap?.initialHealthProfileId ?? null;

  const roadmapFinalHealthProfileId =
    currentRoadmap?.finalHealthProfileId ?? null;

  useEffect(() => {
    let mounted = true;

    async function loadInitialHealthProfile() {
      if (!roadmapInitialHealthProfileId) {
        setRoadmapInitialHealthProfile(null);
        return;
      }

      try {
        setLoadingRoadmapHealthProfile(true);

        const res = await fetchHealthProfileById(
          String(roadmapInitialHealthProfileId),
        );

        if (!mounted) return;

        if (res.ok) {
          setRoadmapInitialHealthProfile(res.data);
        } else {
          setRoadmapInitialHealthProfile(null);
        }
      } catch (e) {
        console.log('loadInitialHealthProfile error:', e);
        setRoadmapInitialHealthProfile(null);
      } finally {
        if (mounted) {
          setLoadingRoadmapHealthProfile(false);
        }
      }
    }

    loadInitialHealthProfile();

    return () => {
      mounted = false;
    };
  }, [roadmapInitialHealthProfileId]);

  useEffect(() => {
    let mounted = true;

    async function loadFinalHealthProfile() {
      if (!roadmapFinalHealthProfileId) {
        setRoadmapFinalHealthProfile(null);
        return;
      }

      try {
        setLoadingRoadmapFinalHealthProfile(true);

        const res = await fetchHealthProfileById(
          String(roadmapFinalHealthProfileId),
        );

        if (!mounted) return;

        if (res.ok) {
          setRoadmapFinalHealthProfile(res.data);
        } else {
          setRoadmapFinalHealthProfile(null);
        }
      } catch (e) {
        console.log('loadFinalHealthProfile error:', e);
        setRoadmapFinalHealthProfile(null);
      } finally {
        if (mounted) {
          setLoadingRoadmapFinalHealthProfile(false);
        }
      }
    }

    loadFinalHealthProfile();

    return () => {
      mounted = false;
    };
  }, [roadmapFinalHealthProfileId]);

  const roadmapInitialHealthMapped = useMemo(() => {
    return mapStoredHealthProfile(roadmapInitialHealthProfile);
  }, [roadmapInitialHealthProfile]);

  const roadmapFinalHealthMapped = useMemo(() => {
    return mapStoredHealthProfile(roadmapFinalHealthProfile);
  }, [roadmapFinalHealthProfile]);

  const activeBodyMetricProfile =
    bodyMetricMode === 'FINAL'
      ? roadmapFinalHealthMapped
      : roadmapInitialHealthMapped;

  const activeBodyMetricLoading =
    bodyMetricMode === 'FINAL'
      ? loadingRoadmapFinalHealthProfile
      : loadingRoadmapHealthProfile;

  const activeBodyMetricTitle =
    bodyMetricMode === 'FINAL'
      ? roadmapFinalHealthProfileId
        ? 'Số đo sau lộ trình'
        : 'Cập nhật số đo sau lộ trình'
      : 'Số đo hiện tại';

  const openInitialMetricModal = () => {
    setBodyMetricMode('INITIAL');
    setShowBodyMetricModal(true);
  };

  const openFinalMetricModal = () => {
    setBodyMetricMode('FINAL');
    setShowBodyMetricModal(true);
  };

  const openProgressModal = () => {
    setProgressInput(String(safeProgress));
    setShowProgressModal(true);
  };

  const handleOpenBodyMetricUpdate = () => {
    if (bodyMetricMode !== 'FINAL') {
      setShowBodyMetricModal(false);
      return;
    }

    if (roadmapFinalHealthProfileId) {
      setShowBodyMetricModal(false);
      return;
    }

    if (safeProgress < 100) {
      showModal({
        mode: 'noti',
        titleText: 'Chưa thể cập nhật',
        contentText:
          'Bạn cần hoàn thành 100% lộ trình thì mới có thể cập nhật số đo lần cuối.',
      });
      return;
    }

    setShowBodyMetricModal(false);

    const roadmapId = getRoadmapId(currentRoadmap);

    if (!roadmapId) {
      showModal({
        mode: 'noti',
        titleText: 'Lỗi',
        contentText: 'Không tìm thấy roadmapId để cập nhật số đo cuối.',
      });
      return;
    }

    navigation.navigate('InputBody' as any, {
      returnToAfterAssessment: {
        root: 'MainTabs',
        screen: 'Roadmap',
        nestedScreen: 'RoadmapDetail',
        params: {
          roadmapId,
        },
      },
      roadmapFinalUpdate: {
        roadmapId,
      },
      bodyInputSeed: roadmapInitialHealthProfile
        ? {
            source: 'RoadmapInitialHealthProfile',
            profile: roadmapInitialHealthProfile,
          }
        : null,
    });
  };

  const handleUpdateProgress = async () => {
    try {
      const roadmapId = getRoadmapId(currentRoadmap);

      if (!roadmapId) {
        showModal({
          mode: 'noti',
          titleText: 'Lỗi',
          contentText: 'Không tìm thấy roadmapId',
        });
        return;
      }

      const nextProgress = Number(progressInput);

      if (Number.isNaN(nextProgress)) {
        showModal({
          mode: 'noti',
          titleText: 'Lỗi',
          contentText: 'Progress phải là số',
        });
        return;
      }

      if (nextProgress < 0 || nextProgress > 100) {
        showModal({
          mode: 'noti',
          titleText: 'Lỗi',
          contentText: 'Progress phải nằm trong khoảng 0 - 100',
        });
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

      showModal({
        mode: 'noti',
        titleText: 'Thành công',
        contentText: `Đã cập nhật progress lên ${nextProgress}%`,
      });
    } catch (err: any) {
      showModal({
        mode: 'noti',
        titleText: 'Lỗi',
        contentText:
          err?.response?.data?.message ?? 'Không thể cập nhật progress',
      });
    } finally {
      setUpdatingProgress(false);
    }
  };

  const handleNavigateResult = () => {
    const roadmapId = getRoadmapId(currentRoadmap);

    console.log('[RoadMap] Press xem kết quả lộ trình:', {
      roadmapId,
      progress: safeProgress,
      initialHealthProfileId: roadmapInitialHealthProfileId,
      finalHealthProfileId: roadmapFinalHealthProfileId,
    });

    if (!roadmapId) {
      showModal({
        mode: 'noti',
        titleText: 'Lỗi',
        contentText: 'Không tìm thấy roadmapId để xem kết quả.',
      });
      return;
    }

    navigation.navigate('RoadmapResult' as any, {
      roadmapId,
    });
  };

  const hasStages = Array.isArray(currentStages) && currentStages.length > 0;

  const isApiShaped =
    hasStages && Boolean(currentStages[0]?.stage || currentStages[0]?._raw);

  const selectedStage = hasStages
    ? currentStages?.[selectedStageIndex] ?? currentStages?.[0] ?? null
    : null;

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
    ? currentSupplements.filter(
        (sp: any) => sp.personalStageId === selectedStageId,
      )
    : currentSupplements;

  const allSchedules = hasStages
    ? currentStages.flatMap(
        (st: any) => st.schedules?.map((s: any) => s.schedule ?? s) ?? [],
      )
    : [];

  const totalSessions = allSchedules.length;

  const handleSelectDate = (
    date: string | null,
    scheduleWrapperFromCalendar?: any,
  ) => {
    setSelectedDate(date);
    setSelectedScheduleData(null);

    if (!scheduleWrapperFromCalendar) {
      setShowScheduleModal(true);
      return;
    }

    const scheduleObject = getScheduleObject(scheduleWrapperFromCalendar);

    setSelectedScheduleData(scheduleObject);
    setShowScheduleModal(true);
  };

  const handleGoBack = () => {
    navigation.navigate('RoadmapList' as never);
  };

  const renderPageHeader = () => {
    return (
      <View style={styles.pageHeader}>
        <View style={styles.pageHeaderTopRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleGoBack}
            activeOpacity={0.85}
          >
            <Ionicons name="chevron-back" size={22} color="#8B4513" />
          </TouchableOpacity>

          <View style={styles.pageHeaderTextWrap}>
            <Text style={styles.pageHeaderTitle}>Lộ trình</Text>
            <Text style={styles.pageHeaderSubtitle}>
              Theo dõi tiến độ tập luyện của bạn
            </Text>
          </View>
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

          <View style={styles.bodyMetricButtonGroup}>
            <TouchableOpacity
              style={styles.bodyMetricButton}
              onPress={openInitialMetricModal}
              activeOpacity={0.85}
            >
              <Text style={styles.bodyMetricButtonText}>Xem số đo trước tập</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.bodyMetricButtonSecondary,
                safeProgress < 100 &&
                  !roadmapFinalHealthProfileId &&
                  styles.bodyMetricButtonDisabled,
              ]}
              onPress={openFinalMetricModal}
              activeOpacity={0.85}
            >
              <Text style={styles.bodyMetricButtonText}>
                {roadmapFinalHealthProfileId
                  ? 'Xem số đo sau lộ trình'
                  : safeProgress >= 100
                    ? 'Cập nhật số đo lần cuối'
                    : 'Số đo sau lộ trình'}
              </Text>
            </TouchableOpacity>
          </View>
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

  if (!currentRoadmap) {
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
          roadmapTitle={activeBodyMetricTitle}
          progressPercent={safeProgress}
          totalSessions={totalSessions}
          loadingProfile={activeBodyMetricLoading}
          healthProfile={activeBodyMetricProfile}
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

        {safeProgress >= 100 && roadmapFinalHealthProfileId ? (
          <View style={styles.sectionWrap}>
            <View style={styles.finalNoticeCard}>
              <Text style={styles.finalNoticeTitle}>
                Kết quả lộ trình đã sẵn sàng 🎉
              </Text>

              <Text style={styles.finalNoticeText}>
                Bạn đã hoàn thành lộ trình và có số đo sau cùng. Nhấn nút bên
                dưới để xem đánh giá thay đổi trước / sau.
              </Text>

              <TouchableOpacity
                style={styles.resultButton}
                onPress={handleNavigateResult}
                activeOpacity={0.85}
              >
                <Ionicons name="analytics-outline" size={18} color="#FFFFFF" />

                <Text style={styles.resultButtonText}>
                  Xem kết quả lộ trình
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : safeProgress >= 100 ? (
          <View style={styles.sectionWrap}>
            <View style={styles.finalNoticeCard}>
              <Text style={styles.finalNoticeTitle}>
                Hoàn thành lộ trình rồi 🎉
              </Text>

              <Text style={styles.finalNoticeText}>
                Hãy cập nhật số đo lần cuối để xem kết quả thay đổi trước và sau
                lộ trình.
              </Text>

              <TouchableOpacity
                style={styles.finalNoticeButton}
                onPress={() => {
                  setBodyMetricMode('FINAL');
                  setShowBodyMetricModal(true);
                }}
                activeOpacity={0.85}
              >
                <Text style={styles.finalNoticeButtonText}>
                  Cập nhật số đo lần cuối
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        {hasStages ? (
          <View style={styles.stageSelector}>
            {isApiShaped ? (
              <StageRendererApi
                apiStages={currentStages}
                roadmap={currentRoadmap}
              />
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
        ) : (
          <View style={styles.sectionWrap}>
            <View style={styles.card}>
              <Text style={styles.noStageTitle}>Chưa có dữ liệu giai đoạn</Text>
              <Text style={styles.noStageText}>
                API thông tin roadmap hiện chỉ trả về thông tin lộ trình, chưa
                có danh sách giai đoạn hoặc lịch tập.
              </Text>
            </View>
          </View>
        )}

        {hasStages && !isApiShaped && (
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
                      <Text style={styles.modalEmptyTitle}>
                        Không có lịch cho ngày này.
                      </Text>
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
                        <Text style={styles.itemSubtitle}>
                          {eq.description}
                        </Text>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

        {(selectedStageSupplements?.length > 0 ||
          currentSupplements?.length > 0) && (
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
            showAccept={
              currentRoadmap?.status === 'PENDING' ||
              activeTab === 'PROCESSING'
            }
            showSave={false}
            onAccept={handleAcceptRoadmap}
            accepting={saving}
          />
        </View>
      )}

      {showProgressModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.progressModal}>
            <Text style={styles.progressModalTitle}>
              Chỉnh progress roadmap
            </Text>

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
              {[0,100].map(value => (
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

      <RoadmapBodyMetricModal
        visible={showBodyMetricModal}
        onClose={() => setShowBodyMetricModal(false)}
        onConfirm={handleOpenBodyMetricUpdate}
        roadmapTitle={activeBodyMetricTitle}
        progressPercent={safeProgress}
        totalSessions={totalSessions}
        loadingProfile={activeBodyMetricLoading}
        healthProfile={activeBodyMetricProfile}
      />

      <ModalPopup {...(modalProps as any)} onClose={closeModal} />
    </SafeAreaView>
  );
};

export default RoadMap;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFFAF0' },
  scrollContent: { paddingBottom: 140 },

  pageHeader: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    padding: 16,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFE3D4',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  pageHeaderTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 999,
    backgroundColor: '#F3EDE3',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E2D2C1',
  },
  pageHeaderTextWrap: {
    flex: 1,
  },
  pageHeaderTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#3A2A1A',
  },
  pageHeaderSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: '#7A6A58',
  },
  headerActionGroup: {
    marginTop: 14,
    gap: 8,
  },
  progressEditButton: {
    backgroundColor: '#8B4513',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
    alignItems: 'center',
  },
  progressEditButtonDisabled: { opacity: 0.5 },
  progressEditButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '800',
  },

  bodyMetricButtonGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  bodyMetricButton: {
    flex: 1,
    backgroundColor: '#A0522D',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
    alignItems: 'center',
  },
  bodyMetricButtonSecondary: {
    flex: 1,
    backgroundColor: '#7A3E12',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
    alignItems: 'center',
  },
  bodyMetricButtonDisabled: {
    opacity: 0.55,
  },
  bodyMetricButtonSecondary: {
    backgroundColor: '#7A3E12',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 999,
  },
  bodyMetricButtonDisabled: {
    opacity: 0.55,
  },
  bodyMetricButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '800',
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
    fontWeight: '800',
    color: '#8A7A69',
  },
  tabTextActive: { color: '#FFFFFF' },

  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EFE3D4',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 7,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTextWrap: { flex: 1, paddingRight: 8 },
  cardTitle: { color: '#3A2A1A', fontSize: 18, fontWeight: '900' },
  cardSubtitle: { color: '#6B6B6B', marginTop: 4, fontSize: 13 },
  statBox: {
    minWidth: 52,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#F3EDE3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statText: { color: '#8B4513', fontWeight: '900' },
  progressWrap: { marginTop: 12 },
  progressBarBg: {
    width: '100%',
    height: 10,
    backgroundColor: '#F3EDE3',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressBarFill: { height: '100%', backgroundColor: '#8B4513' },

  stageSelector: { marginTop: 12 },
  sectionWrap: { paddingHorizontal: 16, marginTop: 20 },

  noStageTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#3A2A1A',
    textAlign: 'center',
  },
  noStageText: {
    marginTop: 8,
    fontSize: 13,
    color: '#6B6B6B',
    textAlign: 'center',
    lineHeight: 20,
  },

  finalNoticeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EFE3D4',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 7,
    elevation: 2,
  },
  finalNoticeTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#3A2A1A',
  },
  finalNoticeText: {
    marginTop: 6,
    fontSize: 13,
    color: '#6B6B6B',
    lineHeight: 19,
  },
  finalNoticeButton: {
    marginTop: 14,
    backgroundColor: '#A0522D',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  finalNoticeButtonText: {
    color: '#FFFFFF',
    fontWeight: '900',
  },

  resultButton: {
    marginTop: 14,
    backgroundColor: '#8B4513',
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  resultButtonText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 14,
  },

  equipmentTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
    color: '#8B4513',
  },
  supplementTitle: {
    fontSize: 16,
    fontWeight: '700',
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
  itemTitle: { fontSize: 16, color: '#3A2A1A', fontWeight: '800' },
  itemSubtitle: { fontSize: 13, color: '#6B6B6B', marginTop: 6 },
  badge: {
    backgroundColor: '#F3EDE3',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeText: { color: '#8B4513', fontWeight: '800', fontSize: 11 },
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
    fontWeight: '700',
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
  buttonPrimaryText: { color: '#fff', fontWeight: '600', fontSize: 16 },

  modalContainer: { flex: 1, backgroundColor: '#FFFAF0' },
  modalHeader: {
    height: 56,
    paddingHorizontal: 16,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  closeText: { color: '#8B4513', fontWeight: '700' },
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
    fontWeight: '900',
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
    fontWeight: '800',
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
    fontWeight: '800',
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
    fontWeight: '800',
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
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 16,
    color: '#3A2A1A',
  },
  confirmText: { fontSize: 16, marginBottom: 8, color: '#3A2A1A' },
  confirmTextWhite: { fontSize: 16, color: '#FFF', fontWeight: '700' },
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
  cancelText: { color: '#6B6B6B', fontWeight: '700' },
  confirmButton: {
    flex: 1,
    marginLeft: 8,
    paddingVertical: 12,
    backgroundColor: '#8B4513',
    borderRadius: 8,
    alignItems: 'center',
  },
});