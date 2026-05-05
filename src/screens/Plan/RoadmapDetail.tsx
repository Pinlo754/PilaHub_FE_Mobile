import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@react-native-vector-icons/ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';

import ModalPopup from '../../components/ModalPopup';
import RoadmapApi from '../../hooks/roadmap.api';

const getStageObj = (item: any) => item?.stage ?? item;
const getSchedules = (item: any) => item?.schedules ?? [];

const RoadmapDetailScreen = () => {
  const nav: any = useNavigation();
  const route: any = useRoute();

  const roadmapId = route.params?.roadmapId;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [roadmap, setRoadmap] = useState<any>(null);
  const [stages, setStages] = useState<any[]>([]);

  const [modalProps, setModalProps] = useState<any>({
    visible: false,
    mode: 'noti',
    titleText: '',
    contentText: '',
  });

  const showModal = (props: any) => {
    setModalProps({ ...props, visible: true });
  };

  const closeModal = () => {
    setModalProps((prev: any) => ({ ...prev, visible: false }));
  };

  const loadDetail = async (isRefresh = false) => {
    if (!roadmapId) {
      setLoading(false);
      showModal({
        mode: 'noti',
        titleText: 'Thiếu dữ liệu',
        contentText: 'Không tìm thấy roadmapId.',
      });
      return;
    }

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const data = await RoadmapApi.getRoadmapDetail(roadmapId);

      const roadmapData = data?.roadmap ?? data?.data?.roadmap ?? data;
      const stageData = data?.stages ?? data?.data?.stages ?? [];

      setRoadmap(roadmapData);
      setStages(Array.isArray(stageData) ? stageData : []);
    } catch (err: any) {
      console.error('Load roadmap detail error:', err);

      showModal({
        mode: 'noti',
        titleText: 'Lỗi',
        contentText:
          err?.response?.data?.message ||
          err?.message ||
          'Không thể tải chi tiết lộ trình.',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDetail();
  }, [roadmapId]);

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#8B4513" />
        <Text style={styles.loadingText}>Đang tải lộ trình...</Text>
      </SafeAreaView>
    );
  }

  if (!roadmap) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.emptyTitle}>Không có dữ liệu lộ trình</Text>

        <TouchableOpacity style={styles.backButton} onPress={() => nav.goBack()}>
          <Text style={styles.backButtonText}>Quay lại</Text>
        </TouchableOpacity>

        <ModalPopup {...modalProps} onClose={closeModal} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => nav.goBack()}
          style={styles.headerBackButton}
        >
          <Ionicons name="arrow-back" size={22} color="#3A2A1A" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Chi tiết lộ trình</Text>

        <View style={styles.headerBackButton} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadDetail(true)}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <Text style={styles.roadmapTitle}>
            {roadmap?.title ?? 'Lộ trình tập luyện'}
          </Text>

          {!!roadmap?.description && (
            <Text style={styles.roadmapDescription}>{roadmap.description}</Text>
          )}

          <View style={styles.infoGrid}>
            <InfoBox
              label="Tiến độ"
              value={`${roadmap?.progressPercent ?? 0}%`}
              icon="trending-up-outline"
            />

            <InfoBox
              label="Nguồn"
              value={roadmap?.source ?? 'N/A'}
              icon="sparkles-outline"
            />

            <InfoBox
              label="Trạng thái"
              value={String(roadmap?.status ?? 'N/A')}
              icon="checkmark-circle-outline"
            />

            <InfoBox
              label="Tổng phí"
              value={
                roadmap?.totalAmount
                  ? `${Number(roadmap.totalAmount).toLocaleString('vi-VN')}đ`
                  : 'N/A'
              }
              icon="cash-outline"
            />
          </View>
        </View>

        <Text style={styles.sectionTitle}>Các giai đoạn</Text>

        {stages.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>Chưa có giai đoạn nào.</Text>
          </View>
        ) : (
          stages.map((stageWrapper, index) => {
            const stage = getStageObj(stageWrapper);
            const schedules = getSchedules(stageWrapper);

            return (
              <View key={stage?.personalStageId ?? index} style={styles.stageCard}>
                <View style={styles.stageHeader}>
                  <View style={styles.stageOrderBadge}>
                    <Text style={styles.stageOrderText}>{index + 1}</Text>
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.stageName}>
                      {stage?.stageName ?? `Giai đoạn ${index + 1}`}
                    </Text>

                    {!!stage?.stageDescription && (
                      <Text style={styles.stageDescription}>
                        {stage.stageDescription}
                      </Text>
                    )}

                    {!!stage?.description && !stage?.stageDescription && (
                      <Text style={styles.stageDescription}>
                        {stage.description}
                      </Text>
                    )}
                  </View>
                </View>

                <View style={styles.stageMetaRow}>
                  <Text style={styles.stageMeta}>
                    Bắt đầu: {formatDate(stage?.startDate)}
                  </Text>
                  <Text style={styles.stageMeta}>
                    Kết thúc: {formatDate(stage?.endDate)}
                  </Text>
                </View>

                <Text style={styles.scheduleTitle}>
                  Lịch tập ({schedules.length})
                </Text>

                {schedules.length === 0 ? (
                  <Text style={styles.noScheduleText}>Chưa có lịch tập.</Text>
                ) : (
                  schedules.map((scheduleWrapper: any, sIndex: number) => {
                    const schedule = scheduleWrapper?.schedule ?? scheduleWrapper;
                    const exercises = scheduleWrapper?.exercises ?? schedule?.exercises ?? [];

                    return (
                      <View
                        key={schedule?.personalScheduleId ?? sIndex}
                        style={styles.scheduleCard}
                      >
                        <Text style={styles.scheduleName}>
                          {schedule?.scheduleName ?? `Buổi tập ${sIndex + 1}`}
                        </Text>

                        {!!schedule?.description && (
                          <Text style={styles.scheduleDescription}>
                            {schedule.description}
                          </Text>
                        )}

                        <View style={styles.scheduleMetaRow}>
                          <Text style={styles.scheduleMeta}>
                            Ngày: {formatDate(schedule?.scheduledDate)}
                          </Text>
                          <Text style={styles.scheduleMeta}>
                            {schedule?.durationMinutes ?? 0} phút
                          </Text>
                        </View>

                        <Text style={styles.exerciseTitle}>
                          Bài tập ({exercises.length})
                        </Text>

                        {exercises.map((ex: any, eIndex: number) => (
                          <View
                            key={ex?.personalExerciseId ?? ex?.exerciseId ?? eIndex}
                            style={styles.exerciseRow}
                          >
                            <View style={styles.exerciseNumber}>
                              <Text style={styles.exerciseNumberText}>
                                {eIndex + 1}
                              </Text>
                            </View>

                            <View style={{ flex: 1 }}>
                              <Text style={styles.exerciseName}>
                                {ex?.exerciseName ?? ex?.name ?? 'Bài tập'}
                              </Text>

                              <Text style={styles.exerciseMeta}>
                                {ex?.sets ?? 0} sets • {ex?.reps ?? 0} reps •{' '}
                                {ex?.durationSeconds ?? 0}s tập •{' '}
                                {ex?.restSeconds ?? 0}s nghỉ
                              </Text>

                              {!!ex?.notes && (
                                <Text style={styles.exerciseNotes}>
                                  {ex.notes}
                                </Text>
                              )}
                            </View>
                          </View>
                        ))}
                      </View>
                    );
                  })
                )}
              </View>
            );
          })
        )}
      </ScrollView>

      <ModalPopup {...modalProps} onClose={closeModal} />
    </SafeAreaView>
  );
};

type InfoBoxProps = {
  label: string;
  value: string;
  icon: string;
};

const InfoBox = ({ label, value, icon }: InfoBoxProps) => {
  return (
    <View style={styles.infoBox}>
      <Ionicons name={icon as any} size={18} color="#8B4513" />
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
};

const formatDate = (date?: string | null) => {
  if (!date) return 'N/A';

  try {
    return new Date(date).toLocaleDateString('vi-VN');
  } catch {
    return date;
  }
};

export default RoadmapDetailScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3EDE3',
  },
  center: {
    flex: 1,
    backgroundColor: '#F3EDE3',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    color: '#6B6B6B',
    fontWeight: '600',
  },
  emptyTitle: {
    fontSize: 16,
    color: '#3A2A1A',
    fontWeight: '700',
  },
  backButton: {
    marginTop: 16,
    backgroundColor: '#8B4513',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  header: {
    height: 56,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5D6C8',
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerBackButton: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '800',
    color: '#3A2A1A',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 120,
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: '#EFE2D6',
  },
  roadmapTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#8B4513',
  },
  roadmapDescription: {
    marginTop: 8,
    color: '#6B6B6B',
    lineHeight: 21,
  },
  infoGrid: {
    marginTop: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  infoBox: {
    width: '47%',
    backgroundColor: '#FFF8F2',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F1DFD0',
  },
  infoLabel: {
    marginTop: 6,
    color: '#6B6B6B',
    fontSize: 12,
    fontWeight: '600',
  },
  infoValue: {
    marginTop: 3,
    color: '#3A2A1A',
    fontSize: 14,
    fontWeight: '800',
  },
  sectionTitle: {
    marginTop: 22,
    marginBottom: 12,
    fontSize: 18,
    fontWeight: '900',
    color: '#8B4513',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#EFE2D6',
  },
  emptyText: {
    color: '#6B6B6B',
    textAlign: 'center',
  },
  stageCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#EFE2D6',
  },
  stageHeader: {
    flexDirection: 'row',
    gap: 12,
  },
  stageOrderBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#8B4513',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stageOrderText: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  stageName: {
    fontSize: 16,
    fontWeight: '900',
    color: '#3A2A1A',
  },
  stageDescription: {
    marginTop: 5,
    color: '#6B6B6B',
    lineHeight: 20,
  },
  stageMetaRow: {
    marginTop: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  stageMeta: {
    color: '#8B4513',
    fontSize: 12,
    fontWeight: '700',
    backgroundColor: '#FFF8F2',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 99,
  },
  scheduleTitle: {
    marginTop: 16,
    marginBottom: 8,
    color: '#8B4513',
    fontWeight: '900',
  },
  noScheduleText: {
    color: '#6B6B6B',
  },
  scheduleCard: {
    backgroundColor: '#FFFDFB',
    borderRadius: 16,
    padding: 13,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F1DFD0',
  },
  scheduleName: {
    color: '#3A2A1A',
    fontWeight: '900',
    fontSize: 15,
  },
  scheduleDescription: {
    marginTop: 5,
    color: '#6B6B6B',
  },
  scheduleMetaRow: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  scheduleMeta: {
    color: '#8B4513',
    fontSize: 12,
    fontWeight: '700',
  },
  exerciseTitle: {
    marginTop: 14,
    marginBottom: 8,
    color: '#3A2A1A',
    fontWeight: '900',
  },
  exerciseRow: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1DFD0',
  },
  exerciseNumber: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#F3EDE3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  exerciseNumberText: {
    color: '#8B4513',
    fontWeight: '900',
    fontSize: 12,
  },
  exerciseName: {
    color: '#3A2A1A',
    fontWeight: '800',
  },
  exerciseMeta: {
    marginTop: 4,
    color: '#6B6B6B',
    fontSize: 12,
  },
  exerciseNotes: {
    marginTop: 4,
    color: '#8B4513',
    fontSize: 12,
    fontStyle: 'italic',
  },
});