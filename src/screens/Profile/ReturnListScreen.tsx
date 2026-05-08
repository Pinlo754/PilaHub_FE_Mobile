import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Ionicons from '@react-native-vector-icons/ionicons';

import { getMyOrderReturns } from '../../services/order';

// ─── Constants ────────────────────────────────────────────────────────────────

const COLORS = {
  bg: '#FFF9F3',
  card: '#FFFFFF',
  text: '#0F172A',
  muted: '#64748B',
  primary: '#8B3F2D',
  accent: '#CD853F',
  border: '#F1E7DC',
  soft: '#FFF7ED',
  warning: '#B7791F',
  warningBg: '#FEF3C7',
  success: '#047857',
  successBg: '#ECFDF5',
  danger: '#BE123C',
  dangerBg: '#FFF1F2',
};

const STATUS_MAP: Record<string, { label: string; bg: string; color: string }> = {
  PENDING:   { label: 'Chờ duyệt',    bg: COLORS.warningBg, color: COLORS.warning },
  APPROVED:  { label: 'Đã duyệt',     bg: COLORS.successBg, color: COLORS.success },
  REJECTED:  { label: 'Từ chối',      bg: COLORS.dangerBg,  color: COLORS.danger  },
  COMPLETED: { label: 'Hoàn tất',     bg: COLORS.successBg, color: COLORS.success },
  CANCELLED: { label: 'Đã huỷ',       bg: COLORS.dangerBg,  color: COLORS.danger  },
};

const statusStyle = (status: string) =>
  STATUS_MAP[String(status)] ?? { label: String(status), bg: '#F3F4F6', color: '#111827' };

const formatDateTime = (value?: string | null) => {
  if (!value) return '—';
  try { return new Date(value).toLocaleString('vi-VN'); } catch { return '—'; }
};

// ─── Component ────────────────────────────────────────────────────────────────

const ReturnListScreen: React.FC = () => {
  const navigation = useNavigation<any>();

  const [returns, setReturns]   = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const data = await getMyOrderReturns();
      setReturns(Array.isArray(data) ? data : []);
    } catch (e: any) {
      console.warn('getMyOrderReturns', e);
      setError('Không thể tải danh sách yêu cầu trả hàng.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Render item ──────────────────────────────────────────────────────────

  const renderItem = ({ item }: { item: any }) => {
    const st = statusStyle(item.status);
    const itemCount = Array.isArray(item.itemReturns) ? item.itemReturns.length : 0;

    return (
      <Pressable
        style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
        onPress={() =>
          navigation.navigate('ReturnDetail', { returnId: item.returnId })
        }
      >
        {/* Top row: return ID + status badge */}
        <View style={styles.cardTop}>
          <View style={styles.flex1}>
            <Text style={styles.returnId} numberOfLines={1}>
              #{String(item.returnId).slice(0, 8).toUpperCase()}
            </Text>
            <Text style={styles.returnDate}>{formatDateTime(item.createdAt)}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: st.bg }]}>
            <Text style={[styles.badgeText, { color: st.color }]}>{st.label}</Text>
          </View>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Reason */}
        <View style={styles.infoRow}>
          <Ionicons name="chatbubble-ellipses-outline" size={14} color={COLORS.muted} />
          <Text style={styles.infoText} numberOfLines={2}>{item.reason || '—'}</Text>
        </View>

        {/* Item count */}
        <View style={styles.infoRow}>
          <Ionicons name="bag-outline" size={14} color={COLORS.muted} />
          <Text style={styles.infoText}>
            {itemCount} sản phẩm yêu cầu trả
          </Text>
        </View>

        {/* Arrow hint */}
        <View style={styles.cardFooter}>
          <Text style={styles.viewDetail}>Xem chi tiết</Text>
          <Ionicons name="chevron-forward" size={14} color={COLORS.primary} />
        </View>
      </Pressable>
    );
  };

  // ── States ───────────────────────────────────────────────────────────────

  const renderEmpty = () => (
    <View style={styles.emptyWrap}>
      <Ionicons name="arrow-undo-circle-outline" size={52} color={COLORS.accent} />
      <Text style={styles.emptyTitle}>Chưa có yêu cầu trả hàng</Text>
      <Text style={styles.emptyDesc}>
        Các yêu cầu trả hàng của bạn sẽ hiển thị tại đây.
      </Text>
    </View>
  );

  const renderError = () => (
    <View style={styles.emptyWrap}>
      <Ionicons name="cloud-offline-outline" size={52} color={COLORS.accent} />
      <Text style={styles.emptyTitle}>Đã xảy ra lỗi</Text>
      <Text style={styles.emptyDesc}>{error}</Text>
      <Pressable style={styles.retryBtn} onPress={() => load()}>
        <Text style={styles.retryText}>Thử lại</Text>
      </Pressable>
    </View>
  );

  // ── Layout ───────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.headerWrap}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.headerBackBtn}
          >
            <Ionicons name="arrow-back" size={22} color={COLORS.text} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Yêu cầu trả hàng</Text>
            {returns.length > 0 && (
              <Text style={styles.headerSub}>{returns.length} yêu cầu</Text>
            )}
          </View>
          <TouchableOpacity onPress={() => load()} style={styles.refreshBtn}>
            <Ionicons name="refresh" size={22} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={COLORS.primary} size="large" />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      ) : error ? (
        renderError()
      ) : (
        <FlatList
          data={returns}
          keyExtractor={item => String(item.returnId)}
          renderItem={renderItem}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={[
            styles.listContent,
            returns.length === 0 && styles.listContentEmpty,
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => load(true)}
              tintColor={COLORS.primary}
              colors={[COLORS.primary]}
            />
          }
        />
      )}
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },

  headerWrap: {
    paddingHorizontal: 16, paddingTop: 8, paddingBottom: 14,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
    backgroundColor: COLORS.bg,
  },
  headerRow:        { flexDirection: 'row', alignItems: 'center' },
  headerBackBtn:    { width: 42, height: 42, borderRadius: 21, backgroundColor: COLORS.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.border },
  headerCenter:     { flex: 1, marginHorizontal: 12 },
  headerTitle:      { color: COLORS.text, fontWeight: '900', fontSize: 20 },
  headerSub:        { color: COLORS.muted, fontSize: 12, marginTop: 3, fontWeight: '600' },
  refreshBtn:       { width: 42, height: 42, borderRadius: 21, backgroundColor: COLORS.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.border },

  loadingWrap:  { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText:  { marginTop: 10, color: COLORS.muted, fontWeight: '600' },

  listContent:      { padding: 16, paddingBottom: 32 },
  listContentEmpty: { flex: 1 },

  card: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardPressed: { opacity: 0.85 },

  cardTop:    { flexDirection: 'row', alignItems: 'flex-start' },
  flex1:      { flex: 1, paddingRight: 8 },
  returnId:   { color: COLORS.text, fontWeight: '900', fontSize: 15 },
  returnDate: { color: COLORS.muted, fontSize: 11, marginTop: 3, fontWeight: '600' },

  badge:     { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  badgeText: { fontSize: 11, fontWeight: '900' },

  divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 10 },

  infoRow:  { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6 },
  infoText: { flex: 1, marginLeft: 7, color: '#334155', fontSize: 13, fontWeight: '600', lineHeight: 18 },

  cardFooter:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 6 },
  viewDetail:  { color: COLORS.primary, fontSize: 12, fontWeight: '800', marginRight: 2 },

  emptyWrap:  { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  emptyTitle: { marginTop: 14, color: COLORS.text, fontSize: 18, fontWeight: '900', textAlign: 'center' },
  emptyDesc:  { marginTop: 8, color: COLORS.muted, textAlign: 'center', lineHeight: 20 },

  retryBtn:  { marginTop: 16, paddingHorizontal: 24, paddingVertical: 10, backgroundColor: COLORS.primary, borderRadius: 12 },
  retryText: { color: '#fff', fontWeight: '900' },
});

export default ReturnListScreen;