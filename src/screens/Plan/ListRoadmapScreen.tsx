import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { colors } from '../../theme/colors';
import { RoadmapStackParamList } from '../../navigation/RoadmapStackNavigator';
import RoadmapApi from '../../hooks/roadmap.api';

type Props = NativeStackScreenProps<RoadmapStackParamList, 'RoadmapList'>;

type RoadmapGoal = {
  roadmapGoalId: string;
  goalId: string;
  code: string;
  vietnameseName: string;
  isPrimary: boolean;
  goalOrder: number;
};

type RoadmapItem = {
  roadmapId: string;
  title: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  progressPercent?: number;
  source?: string;
  status?: string;
  goals?: RoadmapGoal[];
  traineeId?: string | null;
  coachId?: string | null;
  initialHealthProfileId?: string | null;
  finalHealthProfileId?: string | null;
  totalAmount?: number | null;
  createdAt?: string;
  updatedAt?: string;
};

const PAGE_SIZE = 10;

const RoadmapListScreen: React.FC<Props> = ({ navigation }) => {
  const [roadmaps, setRoadmaps] = useState<RoadmapItem[]>([]);

  const [searchText, setSearchText] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'TRAINEE' | 'COACH'>('TRAINEE');

  const [page, setPage] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);

  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const [errorMessage, setErrorMessage] = useState<string>('');

  const hasMore = page + 1 < totalPages;

  const fetchRoadmaps = useCallback(
    async (targetPage = 0, mode: 'initial' | 'refresh' | 'loadMore' = 'initial') => {
      try {
        setErrorMessage('');

        if (mode === 'initial') {
          setLoading(true);
        }

        if (mode === 'refresh') {
          setRefreshing(true);
        }

        if (mode === 'loadMore') {
          setLoadingMore(true);
        }

        console.log('[RoadmapList] Fetch roadmaps:', {
          page: targetPage,
          size: PAGE_SIZE,
          mode,
        });

        const data = await RoadmapApi.getMyRoadmaps({
          page: targetPage,
          size: PAGE_SIZE,
        });

        const content: RoadmapItem[] = Array.isArray(data?.content)
          ? data.content
          : [];

        const nextTotalPages =
          typeof data?.totalPages === 'number' && data.totalPages > 0
            ? data.totalPages
            : content.length < PAGE_SIZE
              ? targetPage + 1
              : targetPage + 2;

        console.log('[RoadmapList] Roadmaps response:', {
          targetPage,
          contentLength: content.length,
          totalPages: nextTotalPages,
          raw: data,
        });

        setPage(targetPage);
        setTotalPages(nextTotalPages);

        setRoadmaps(prev => {
          if (targetPage === 0) {
            return content;
          }

          const map = new Map<string, RoadmapItem>();

          prev.forEach(item => {
            map.set(item.roadmapId, item);
          });

          content.forEach(item => {
            map.set(item.roadmapId, item);
          });

          return Array.from(map.values());
        });
      } catch (error) {
        console.log('[RoadmapList] Fetch roadmaps error:', error);
        setErrorMessage('Không thể tải danh sách lộ trình. Vui lòng thử lại.');
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [],
  );

  useEffect(() => {
    fetchRoadmaps(0, 'initial');
  }, [fetchRoadmaps]);

  // Reset and reload when tab changes
  useEffect(() => {
    setPage(0);
    setTotalPages(1);
    setRoadmaps([]);
    fetchRoadmaps(0, 'initial');
  }, [activeTab, fetchRoadmaps]);

  const filteredRoadmaps = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();

    let filtered = roadmaps;

    // Filter by tab (TRAINEE or COACH)
    filtered = filtered.filter(item => {
      const hasTraineeId = Boolean(item.traineeId);
      const hasCoachId = Boolean(item.coachId);

      if (activeTab === 'TRAINEE') {
        return hasTraineeId && !hasCoachId;
      } else {
        return hasTraineeId && hasCoachId;
      }
    });

    // Filter by search keyword
    if (!keyword) {
      return filtered;
    }

    return filtered.filter(item => {
      const title = item.title?.toLowerCase() ?? '';
      const desc = item.description?.toLowerCase() ?? '';
      const goalName =
        item.goals
          ?.map(goal => goal.vietnameseName)
          .join(' ')
          .toLowerCase() ?? '';

      return (
        title.includes(keyword) ||
        desc.includes(keyword) ||
        goalName.includes(keyword)
      );
    });
  }, [roadmaps, searchText, activeTab]);

  const onRefresh = () => {
    // Prevent refresh if already loading
    if (loading || refreshing || loadingMore) {
      return;
    }
    fetchRoadmaps(0, 'refresh');
  };

  const handleLoadMore = () => {
    if (loading || refreshing || loadingMore || !hasMore) {
      return;
    }

    fetchRoadmaps(page + 1, 'loadMore');
  };

  const handlePressRoadmap = (roadmapId: string) => {
    console.log('[RoadmapList] Press roadmap:', roadmapId);

    // Find the roadmap item from the list
    const selectedRoadmap = filteredRoadmaps.find(r => r.roadmapId === roadmapId);

    navigation.navigate('RoadmapDetail', {
      roadmapId,
      roadmap: selectedRoadmap,
      source: 'list',  // Track source
    });
  };

  const clearSearch = () => {
    setSearchText('');
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.foreground} />
        <Text style={styles.loadingText}>Đang tải lộ trình...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerCard}>
        <View style={styles.headerBadge}>
          <Ionicons name="git-network-outline" size={18} color="#FFFFFF" />
          <Text style={styles.headerBadgeText}>ROADMAP</Text>
        </View>

        <Text style={styles.title}>Lộ trình của tôi</Text>

        <Text style={styles.subtitle}>
          Chọn một lộ trình để xem chi tiết bài tập
        </Text>
      </View>

      <View style={styles.searchBox}>
        <Ionicons name="search-outline" size={20} color="#9A6A3A" />

        <TextInput
          value={searchText}
          onChangeText={setSearchText}
          placeholder="Tìm lộ trình theo tên..."
          placeholderTextColor="#B08A61"
          style={styles.searchInput}
          returnKeyType="search"
        />

        {searchText.trim().length > 0 ? (
          <Pressable style={styles.clearSearchButton} onPress={clearSearch}>
            <Ionicons name="close" size={18} color="#FFFFFF" />
          </Pressable>
        ) : null}
      </View>

      {errorMessage ? (
        <View style={styles.errorBox}>
          <Ionicons
            name="alert-circle-outline"
            size={22}
            color={colors.danger.darker}
          />

          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      ) : null}

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <Pressable
          style={[
            styles.tabButton,
            activeTab === 'TRAINEE' && styles.tabButtonActive,
          ]}
          onPress={() => setActiveTab('TRAINEE')}
        >
          <Ionicons
            name="person-outline"
            size={18}
            color={activeTab === 'TRAINEE' ? '#FFFFFF' : colors.foreground}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'TRAINEE' && styles.tabTextActive,
            ]}
          >
            Tôi tạo
          </Text>
        </Pressable>

        <Pressable
          style={[
            styles.tabButton,
            activeTab === 'COACH' && styles.tabButtonActive,
          ]}
          onPress={() => setActiveTab('COACH')}
        >
          <Ionicons
            name="fitness-outline"
            size={18}
            color={activeTab === 'COACH' ? '#FFFFFF' : colors.foreground}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'COACH' && styles.tabTextActive,
            ]}
          >
            HLV tạo
          </Text>
        </Pressable>
      </View>

      <FlatList
        data={filteredRoadmaps}
        keyExtractor={item => item.roadmapId}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.listContent,
          filteredRoadmaps.length === 0 && styles.emptyListContent,
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.foreground}
            colors={[colors.foreground]}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.35}
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.footerLoading}>
              <ActivityIndicator size="small" color={colors.foreground} />
              <Text style={styles.footerLoadingText}>Đang tải thêm...</Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <View style={styles.emptyIconBox}>
              <Ionicons
                name={searchText.trim() ? 'search-outline' : 'map-outline'}
                size={42}
                color={colors.foreground}
              />
            </View>

            <Text style={styles.emptyTitle}>
              {searchText.trim()
                ? 'Không tìm thấy lộ trình'
                : 'Chưa có lộ trình'}
            </Text>

            <Text style={styles.emptyDesc}>
              {searchText.trim()
                ? 'Thử nhập tên lộ trình khác để tìm kiếm.'
                : 'Khi bạn có lộ trình tập luyện, danh sách sẽ hiển thị ở đây.'}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <RoadmapCard item={item} onPress={handlePressRoadmap} />
        )}
      />
    </View>
  );
};

type RoadmapCardProps = {
  item: RoadmapItem;
  onPress: (roadmapId: string) => void;
};

const RoadmapCard: React.FC<RoadmapCardProps> = ({ item, onPress }) => {
  const progress = Number(item.progressPercent ?? 0);
  const safeProgress = Math.min(Math.max(progress, 0), 100);

  const primaryGoal = item.goals?.find(goal => goal.isPrimary);
  const completed = isCompletedStatus(item.status ?? '');

  return (
    <Pressable
      style={({ pressed }) => [
        styles.cardOuter,
        pressed && styles.cardPressed,
      ]}
      onPress={() => onPress(item.roadmapId)}
    >
      <View style={styles.cardInner}>
        <View style={styles.topRow}>
          <View style={styles.iconBox}>
            <Ionicons name="git-network-outline" size={28} color="#FFFFFF" />
          </View>

          <View style={styles.titleArea}>
            <Text style={styles.cardTitle} numberOfLines={2}>
              {item.title || 'Lộ trình tập luyện'}
            </Text>

            <Text style={styles.goalText} numberOfLines={1}>
              {primaryGoal?.vietnameseName || 'Lộ trình cá nhân'}
            </Text>
          </View>

          <View style={styles.chevronBox}>
            <Ionicons
              name="chevron-forward"
              size={24}
              color={colors.foreground}
            />
          </View>
        </View>

        {item.description ? (
          <Text style={styles.description} numberOfLines={3}>
            {item.description}
          </Text>
        ) : null}

        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <View style={styles.progressTitleRow}>
              <Ionicons
                name="trending-up-outline"
                size={18}
                color="#0F766E"
              />

              <Text style={styles.progressLabel}>Tiến độ</Text>
            </View>

            <Text style={styles.progressValue}>{safeProgress}%</Text>
          </View>

          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                completed && styles.progressFillCompleted,
                { width: `${safeProgress}%` },
              ]}
            />
          </View>
        </View>

        <View style={styles.footerRow}>
          <View style={styles.dateChip}>
            <Ionicons name="calendar-outline" size={16} color="#EA7A1A" />

            <Text style={styles.dateChipText}>
              {item.startDate ? formatDate(item.startDate) : '--/--/----'}
            </Text>
          </View>

          <View style={styles.dateChip}>
            <Ionicons name="flag-outline" size={16} color="#EA7A1A" />

            <Text style={styles.dateChipText}>
              {item.endDate ? formatDate(item.endDate) : '--/--/----'}
            </Text>
          </View>
        </View>

        <View style={styles.bottomRow}>
          <View
            style={[
              styles.statusBadge,
              completed ? styles.statusBadgeCompleted : styles.statusBadgeActive,
            ]}
          >
            <View
              style={[
                styles.statusDot,
                completed ? styles.statusDotCompleted : styles.statusDotActive,
              ]}
            />

            {item.status === 'PENDING' ?
              (<Text
                style={[
                  styles.statusText,
                  completed ? styles.statusTextCompleted : styles.statusTextActive,
                ]}
              >
                Chờ xác nhận

              </Text>
              ) : (
                <Text
                  style={[
                    styles.statusText,
                    completed ? styles.statusTextCompleted : styles.statusTextActive,
                  ]}
                >
                  {completed ? 'Hoàn thành' : 'Đang tập'}
                </Text>
              )
            }
          </View>
        </View>
      </View>
    </Pressable>
  );
};

const isCompletedStatus = (status: string) => {
  const normalized = String(status).toLowerCase();

  return normalized === 'completed' || normalized === 'done';
};

const formatDate = (value: string) => {
  try {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return '';
    }

    return date.toLocaleDateString('vi-VN');
  } catch {
    return '';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.DEFAULT,
    paddingHorizontal: 16,
    paddingTop: 18,
  },

  headerCard: {
    marginBottom: 14,
    padding: 18,
    borderRadius: 28,
    backgroundColor: '#FFF0D8',
    borderWidth: 1.2,
    borderColor: '#FFD9A0',
    shadowColor: '#B94E1D',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    elevation: 3,
  },
  headerBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: colors.foreground,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    marginBottom: 16,
  },
  headerBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.foreground,
  },
  subtitle: {
    marginTop: 8,
    fontSize: 15,
    color: colors.secondaryText,
    lineHeight: 22,
  },

  searchBox: {
    minHeight: 54,
    marginBottom: 14,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.4,
    borderColor: '#F3C37E',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#B94E1D',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    elevation: 2,
  },

  tabsContainer: {
    flexDirection: 'row',
    marginBottom: 14,
    gap: 10,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    gap: 6,
  },
  tabButtonActive: {
    backgroundColor: colors.foreground,
    borderColor: colors.foreground,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.foreground,
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.foreground,
    fontWeight: '700',
  },
  clearSearchButton: {
    width: 30,
    height: 30,
    borderRadius: 999,
    backgroundColor: colors.foreground,
    justifyContent: 'center',
    alignItems: 'center',
  },

  listContent: {
    paddingBottom: 150,
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },

  cardOuter: {
    marginBottom: 20,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    shadowColor: '#B94E1D',
    shadowOpacity: 0.2,
    shadowRadius: 18,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    elevation: 8,
  },
  cardInner: {
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#F3C37E',
    marginBottom: 10,
  },
  cardPressed: {
    opacity: 0.94,
    transform: [{ scale: 0.985 }],
  },

  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 64,
    height: 64,
    borderRadius: 22,
    backgroundColor: colors.foreground,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  titleArea: {
    flex: 1,
    paddingRight: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.foreground,
    lineHeight: 25,
  },
  goalText: {
    marginTop: 6,
    fontSize: 15,
    color: '#E57C20',
    fontWeight: '900',
  },
  chevronBox: {
    width: 38,
    height: 38,
    borderRadius: 999,
    backgroundColor: '#FFF1D7',
    justifyContent: 'center',
    alignItems: 'center',
  },

  description: {
    marginTop: 16,
    fontSize: 15,
    color: colors.secondaryText,
    lineHeight: 24,
  },

  progressCard: {
    marginTop: 18,
    padding: 13,
    borderRadius: 20,
    backgroundColor: '#F0FDF9',
    borderWidth: 1,
    borderColor: '#BDEFE4',
  },
  progressHeader: {
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  progressLabel: {
    fontSize: 14,
    color: '#0F766E',
    fontWeight: '900',
  },
  progressValue: {
    fontSize: 15,
    color: '#0F766E',
    fontWeight: '900',
  },
  progressTrack: {
    height: 12,
    borderRadius: 999,
    backgroundColor: '#CCFBF1',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#14B8A6',
  },
  progressFillCompleted: {
    backgroundColor: '#22C55E',
  },

  footerRow: {
    marginTop: 16,
    flexDirection: 'row',
    gap: 10,
  },
  dateChip: {
    flex: 1,
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: '#FFF4DF',
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#FFD59A',
  },
  dateChipText: {
    fontSize: 14,
    color: '#D97706',
    fontWeight: '900',
  },

  bottomRow: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },

  ownerBadge: {
    flexShrink: 1,
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  ownerBadgeTrainee: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  ownerBadgeCoach: {
    backgroundColor: '#F5F3FF',
    borderColor: '#DDD6FE',
  },
  ownerBadgeUnknown: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  ownerBadgeText: {
    fontSize: 13,
    fontWeight: '900',
  },

  statusBadge: {
    flexShrink: 0,
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 999,
  },
  statusBadgeActive: {
    backgroundColor: '#E0F2FE',
  },
  statusBadgeCompleted: {
    backgroundColor: '#DCFCE7',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
  },
  statusDotActive: {
    backgroundColor: '#0284C7',
  },
  statusDotCompleted: {
    backgroundColor: '#16A34A',
  },
  statusText: {
    fontSize: 13,
    fontWeight: '900',
  },
  statusTextActive: {
    color: '#0369A1',
  },
  statusTextCompleted: {
    color: '#15803D',
  },

  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.danger[20],
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: colors.danger.darker,
    fontWeight: '800',
  },

  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  emptyIconBox: {
    width: 82,
    height: 82,
    borderRadius: 28,
    backgroundColor: colors.background.sub2,
    borderWidth: 1,
    borderColor: colors.background.sub1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    marginTop: 14,
    fontSize: 18,
    fontWeight: '900',
    color: colors.foreground,
  },
  emptyDesc: {
    marginTop: 8,
    fontSize: 14,
    color: colors.secondaryText,
    textAlign: 'center',
    lineHeight: 20,
  },

  footerLoading: {
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  footerLoadingText: {
    fontSize: 13,
    color: colors.secondaryText,
    fontWeight: '800',
  },

  centerContainer: {
    flex: 1,
    backgroundColor: colors.background.DEFAULT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.secondaryText,
    fontWeight: '800',
  },
});

export default RoadmapListScreen;

