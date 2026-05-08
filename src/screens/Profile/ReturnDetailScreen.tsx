import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import Ionicons from '@react-native-vector-icons/ionicons';

import { getOrderReturnById } from '../../services/order';

const placeholderImg = require('../../assets/placeholderAvatar.png');

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

const STATUS_MAP: Record<string, { label: string; bg: string; color: string; icon: string }> = {
  PENDING:   { label: 'Chờ duyệt', bg: COLORS.warningBg, color: COLORS.warning, icon: 'time-outline' },
  APPROVED:  { label: 'Đã duyệt',  bg: COLORS.successBg, color: COLORS.success, icon: 'checkmark-circle-outline' },
  REJECTED:  { label: 'Từ chối',   bg: COLORS.dangerBg,  color: COLORS.danger,  icon: 'close-circle-outline' },
  COMPLETED: { label: 'Hoàn tất',  bg: COLORS.successBg, color: COLORS.success, icon: 'checkmark-done-circle-outline' },
  CANCELLED: { label: 'Đã huỷ',   bg: COLORS.dangerBg,  color: COLORS.danger,  icon: 'ban-outline' },
};

const statusInfo = (status: string) =>
  STATUS_MAP[String(status)] ?? {
    label: String(status),
    bg: '#F3F4F6',
    color: '#111827',
    icon: 'help-circle-outline',
  };

const formatCurrency = (amount: any) => {
  try {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
      Number(amount ?? 0)
    );
  } catch {
    return String(amount ?? 0);
  }
};

const formatDateTime = (value?: string | null) => {
  if (!value) return '—';
  try { return new Date(value).toLocaleString('vi-VN'); } catch { return '—'; }
};

// ─── Timeline steps ───────────────────────────────────────────────────────────

const RETURN_STEPS = [
  { status: 'PENDING',   label: 'Đã gửi yêu cầu' },
  { status: 'APPROVED',  label: 'Shop đã duyệt' },
  { status: 'COMPLETED', label: 'Hoàn tất' },
];

const REJECTED_STEPS = [
  { status: 'PENDING',  label: 'Đã gửi yêu cầu' },
  { status: 'REJECTED', label: 'Shop từ chối' },
];

// ─── Component ────────────────────────────────────────────────────────────────

const ReturnDetailScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route      = useRoute();
  const { returnId } = (route.params as any) ?? { returnId: '' };

  const [loading, setLoading] = useState(true);
  const [data, setData]       = useState<any | null>(null);
  const [error, setError]     = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getOrderReturnById(returnId);
      setData(res);
    } catch (e: any) {
      console.warn('getOrderReturnById', e);
      setError('Không thể tải chi tiết yêu cầu trả hàng.');
    } finally {
      setLoading(false);
    }
  }, [returnId]);

  useEffect(() => { load(); }, [load]);

  // ── Loading ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={COLORS.primary} size="large" />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────

  if (error || !data) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.headerWrap}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBackBtn}>
              <Ionicons name="arrow-back" size={22} color={COLORS.text} />
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>Chi tiết yêu cầu</Text>
            </View>
            <View style={styles.headerPlaceholder} />
          </View>
        </View>
        <View style={styles.emptyWrap}>
          <Ionicons name="cloud-offline-outline" size={52} color={COLORS.accent} />
          <Text style={styles.emptyTitle}>Không tải được</Text>
          <Text style={styles.emptyDesc}>{error ?? 'Không tìm thấy yêu cầu trả hàng.'}</Text>
          <Pressable style={styles.retryBtn} onPress={load}>
            <Text style={styles.retryText}>Thử lại</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // ── Derived values ────────────────────────────────────────────────────────

  const st          = statusInfo(data.status);
  const itemReturns = Array.isArray(data.itemReturns) ? data.itemReturns : [];
  const totalRefund = itemReturns.reduce(
    (sum: number, it: any) => sum + Number(it.refundAmount ?? 0),
    0
  );

  const isRejected = String(data.status) === 'REJECTED';
  const steps      = isRejected ? REJECTED_STEPS : RETURN_STEPS;

  // Which step index is "current" (last reached)
  const currentStepIdx = (() => {
    const statusOrder = isRejected
      ? ['PENDING', 'REJECTED']
      : ['PENDING', 'APPROVED', 'COMPLETED'];
    const idx = statusOrder.indexOf(String(data.status));
    return idx === -1 ? 0 : idx;
  })();

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.headerWrap}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBackBtn}>
            <Ionicons name="arrow-back" size={22} color={COLORS.text} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Chi tiết yêu cầu</Text>
            <Text style={styles.headerSub} numberOfLines={1}>
              #{String(data.returnId).slice(0, 8).toUpperCase()}
            </Text>
          </View>
          <TouchableOpacity onPress={load} style={styles.refreshBtn}>
            <Ionicons name="refresh" size={22} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

        {/* ── Hero status card ── */}
        <View style={styles.heroCard}>
          <View style={[styles.statusIconWrap, { backgroundColor: st.bg }]}>
            <Ionicons name={st.icon as any} size={32} color={st.color} />
          </View>
          <Text style={[styles.statusLabel, { color: st.color }]}>{st.label}</Text>
          <Text style={styles.heroDate}>Tạo lúc {formatDateTime(data.createdAt)}</Text>

          {/* Timeline */}
          <View style={styles.timelineRow}>
            {steps.map((step, idx) => {
              const isPast    = idx < currentStepIdx;
              const isCurrent = idx === currentStepIdx;
              const dotColor  = isPast || isCurrent
                ? (isRejected && isCurrent ? COLORS.danger : COLORS.success)
                : '#CBD5E1';
              const lineColor = isPast
                ? (isRejected ? COLORS.danger : COLORS.success)
                : '#E2E8F0';

              return (
                <React.Fragment key={step.status}>
                  <View style={styles.timelineStep}>
                    <View style={[
                      styles.timelineDot,
                      {
                        backgroundColor: dotColor,
                        borderColor: dotColor,
                        transform: [{ scale: isCurrent ? 1.2 : 1 }],
                      },
                    ]}>
                      {(isPast || isCurrent) && (
                        <Ionicons
                          name={
                            isRejected && isCurrent
                              ? 'close'
                              : 'checkmark'
                          }
                          size={10}
                          color="#fff"
                        />
                      )}
                    </View>
                    <Text style={[
                      styles.timelineLabel,
                      {
                        color: isCurrent ? (isRejected ? COLORS.danger : COLORS.success) : isPast ? COLORS.muted : '#CBD5E1',
                        fontWeight: isCurrent ? '800' : '600',
                      },
                    ]}>
                      {step.label}
                    </Text>
                  </View>

                  {idx < steps.length - 1 && (
                    <View style={[styles.timelineConnector, { backgroundColor: lineColor }]} />
                  )}
                </React.Fragment>
              );
            })}
          </View>
        </View>

        {/* ── Reason card ── */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Ionicons name="chatbubble-ellipses-outline" size={18} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Lý do trả hàng</Text>
          </View>
          <Text style={styles.reasonText}>{data.reason || '—'}</Text>
        </View>

        {/* ── Items card ── */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Ionicons name="bag-outline" size={18} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Sản phẩm trả ({itemReturns.length})</Text>
          </View>

          {itemReturns.length === 0 ? (
            <Text style={styles.emptyInline}>Không có sản phẩm nào.</Text>
          ) : (
            itemReturns.map((item: any, idx: number) => (
              <View
                key={item.itemReturnId ?? idx}
                style={[styles.itemRow, idx === 0 && styles.itemRowFirst]}
              >
                {/* Placeholder thumbnail – no productImageUrl in API response */}
                <Image source={placeholderImg} style={styles.thumb} />

                <View style={styles.flex1}>
                  {/* Product ID as fallback label */}
                  <Text style={styles.itemId} numberOfLines={1}>
                    Sản phẩm #{String(item.productId ?? '').slice(0, 8).toUpperCase()}
                  </Text>

                  <Text style={styles.itemMeta}>
                    Số lượng trả: <Text style={styles.itemMetaStrong}>{item.quantity}</Text>
                  </Text>

                  {item.reason ? (
                    <Text style={styles.itemReason} numberOfLines={2}>
                      {item.reason}
                    </Text>
                  ) : null}

                  {item.refundAmount != null ? (
                    <View style={styles.refundPill}>
                      <Ionicons name="wallet-outline" size={12} color={COLORS.success} />
                      <Text style={styles.refundText}>
                        Hoàn tiền: {formatCurrency(item.refundAmount)}
                      </Text>
                    </View>
                  ) : null}

                  <Text style={styles.itemDate}>
                    {formatDateTime(item.createdAt)}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* ── Refund summary ── */}
        {totalRefund > 0 && (
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <Ionicons name="cash-outline" size={18} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>Tóm tắt hoàn tiền</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tổng hoàn tiền dự kiến</Text>
              <Text style={styles.summaryValue}>{formatCurrency(totalRefund)}</Text>
            </View>
            <Text style={styles.summaryNote}>
              * Số tiền thực tế có thể thay đổi sau khi shop xác nhận.
            </Text>
          </View>
        )}

        {/* ── Meta info ── */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Ionicons name="information-circle-outline" size={18} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Thông tin yêu cầu</Text>
          </View>
          <View style={styles.metaGrid}>
            <View style={styles.metaBox}>
              <Text style={styles.metaLabel}>Mã yêu cầu</Text>
              <Text style={styles.metaValue} numberOfLines={1}>
                {String(data.returnId).slice(0, 8).toUpperCase()}
              </Text>
            </View>
            <View style={styles.metaBox}>
              <Text style={styles.metaLabel}>Mã đơn hàng</Text>
              <Text style={styles.metaValue} numberOfLines={1}>
                {String(data.orderId ?? '—').slice(0, 8).toUpperCase()}
              </Text>
            </View>
            <View style={styles.metaBox}>
              <Text style={styles.metaLabel}>Ngày tạo</Text>
              <Text style={styles.metaValue}>{formatDateTime(data.createdAt)}</Text>
            </View>
            <View style={styles.metaBox}>
              <Text style={styles.metaLabel}>Cập nhật</Text>
              <Text style={styles.metaValue}>{formatDateTime(data.updatedAt)}</Text>
            </View>
          </View>

          {/* Link back to original order */}
          {data.orderId ? (
            <Pressable
              style={styles.orderLinkBtn}
              onPress={() =>
                navigation.navigate('OrderDetail', { orderId: data.orderId })
              }
            >
              <Ionicons name="receipt-outline" size={15} color={COLORS.primary} />
              <Text style={styles.orderLinkText}>Xem đơn hàng gốc</Text>
              <Ionicons name="chevron-forward" size={14} color={COLORS.primary} />
            </Pressable>
          ) : null}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: COLORS.bg },
  container: { padding: 16, paddingBottom: 36 },

  headerWrap: {
    paddingHorizontal: 16, paddingTop: 8, paddingBottom: 14,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
    backgroundColor: COLORS.bg,
  },
  headerRow:         { flexDirection: 'row', alignItems: 'center' },
  headerBackBtn:     { width: 42, height: 42, borderRadius: 21, backgroundColor: COLORS.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.border },
  headerCenter:      { flex: 1, marginHorizontal: 12 },
  headerTitle:       { color: COLORS.text, fontWeight: '900', fontSize: 20 },
  headerSub:         { color: COLORS.muted, fontSize: 12, marginTop: 3, fontWeight: '600' },
  refreshBtn:        { width: 42, height: 42, borderRadius: 21, backgroundColor: COLORS.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.border },
  headerPlaceholder: { width: 42 },

  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, color: COLORS.muted, fontWeight: '600' },

  emptyWrap:  { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  emptyTitle: { marginTop: 14, color: COLORS.text, fontSize: 18, fontWeight: '900', textAlign: 'center' },
  emptyDesc:  { marginTop: 8, color: COLORS.muted, textAlign: 'center', lineHeight: 20 },
  retryBtn:   { marginTop: 16, paddingHorizontal: 24, paddingVertical: 10, backgroundColor: COLORS.primary, borderRadius: 12 },
  retryText:  { color: '#fff', fontWeight: '900' },

  // Hero
  heroCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 20,
    marginBottom: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  statusIconWrap: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  statusLabel:    { fontSize: 18, fontWeight: '900', marginBottom: 4 },
  heroDate:       { color: COLORS.muted, fontSize: 12, fontWeight: '600', marginBottom: 20 },

  // Horizontal timeline
  timelineRow:      { flexDirection: 'row', alignItems: 'center', width: '100%', paddingHorizontal: 8 },
  timelineStep:     { alignItems: 'center', flex: 1 },
  timelineDot:      { width: 24, height: 24, borderRadius: 12, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  timelineLabel:    { fontSize: 10, textAlign: 'center', lineHeight: 14 },
  timelineConnector:{ height: 2, flex: 1, marginBottom: 20, marginHorizontal: 2 },

  // Cards
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  sectionTitle:  { marginLeft: 8, color: COLORS.text, fontWeight: '900', fontSize: 16 },

  reasonText:  { color: '#334155', fontSize: 14, lineHeight: 22, fontWeight: '600' },
  emptyInline: { color: COLORS.muted, fontSize: 13, textAlign: 'center', paddingVertical: 12 },

  // Item rows
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingTop: 12,
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  itemRowFirst: { marginTop: 0, paddingTop: 0, borderTopWidth: 0 },
  thumb:        { width: 56, height: 56, borderRadius: 12, marginRight: 12, backgroundColor: '#F1F5F9' },
  flex1:        { flex: 1 },
  itemId:       { color: COLORS.text, fontWeight: '900', fontSize: 13 },
  itemMeta:     { color: COLORS.muted, fontSize: 12, marginTop: 4, fontWeight: '600' },
  itemMetaStrong:{ color: COLORS.text, fontWeight: '800' },
  itemReason:   { color: '#475569', fontSize: 12, marginTop: 5, lineHeight: 17 },
  itemDate:     { color: COLORS.muted, fontSize: 11, marginTop: 5, fontWeight: '600' },
  refundPill:   { flexDirection: 'row', alignItems: 'center', marginTop: 6, backgroundColor: COLORS.successBg, alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  refundText:   { marginLeft: 5, color: COLORS.success, fontSize: 11, fontWeight: '800' },

  // Refund summary
  summaryRow:   { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  summaryLabel: { color: COLORS.muted, fontWeight: '700' },
  summaryValue: { color: COLORS.success, fontWeight: '900', fontSize: 15 },
  summaryNote:  { marginTop: 8, color: COLORS.muted, fontSize: 11, lineHeight: 16 },

  // Meta grid
  metaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  metaBox:  { flex: 1, minWidth: '48%', backgroundColor: COLORS.soft, borderRadius: 12, padding: 10 },
  metaLabel:{ color: COLORS.muted, fontSize: 10, fontWeight: '700' },
  metaValue:{ marginTop: 4, color: COLORS.text, fontSize: 12, fontWeight: '800' },

  orderLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: COLORS.soft,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  orderLinkText: { flex: 1, marginLeft: 8, color: COLORS.primary, fontWeight: '800', fontSize: 13 },
});

export default ReturnDetailScreen;