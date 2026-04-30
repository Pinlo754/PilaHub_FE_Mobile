import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  Image,
  Pressable,
  ScrollView,
  Modal,
  TextInput,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';
import ModalPopup from '../../components/ModalPopup';

import {
  getOrderById,
  cancelOrder,
  requestOrderReturn,
  getOrderTracking,
} from '../../services/order';

const placeholderImg = require('../../assets/placeholderAvatar.png');

const COLORS = {
  bg: '#FFF9F3',
  card: '#FFFFFF',
  text: '#0F172A',
  muted: '#64748B',
  primary: '#8B3F2D',
  accent: '#CD853F',
  border: '#F1E7DC',
  danger: '#EF4444',
  dangerBg: '#FEF2F2',
  success: '#047857',
  successBg: '#ECFDF5',
  warning: '#B7791F',
  warningBg: '#FEF3C7',
  soft: '#FFF7ED',
};

const statusColor = (status?: string) => {
  switch (String(status)) {
    case 'PROCESSING':
    case 'PENDING':
    case 'CONFIRMED':
      return { backgroundColor: '#FFF7ED', color: '#D97706' };
    case 'READY':
    case 'SHIPPED':
      return { backgroundColor: '#E0F2FE', color: '#0369A1' };
    case 'DELIVERED':
    case 'COMPLETED':
      return { backgroundColor: '#ECFDF5', color: '#065F46' };
    case 'CANCELLED':
    case 'RETURNED':
    case 'REFUNDED':
    case 'FAILED_DELIVERY':
      return { backgroundColor: '#FFF1F2', color: '#BE123C' };
    default:
      return { backgroundColor: '#F3F4F6', color: '#111827' };
  }
};

const mapOrderStatusLabel = (status?: string) => {
  switch (String(status)) {
    case 'PENDING':
      return 'Chờ xử lý';
    case 'PROCESSING':
      return 'Đang xử lý';
    case 'CONFIRMED':
      return 'Đã xác nhận';
    case 'READY':
      return 'Sẵn sàng giao';
    case 'SHIPPED':
      return 'Đang giao';
    case 'DELIVERED':
      return 'Đã giao';
    case 'COMPLETED':
      return 'Hoàn tất';
    case 'CANCELLED':
      return 'Đã huỷ';
    case 'RETURNED':
      return 'Đã trả hàng';
    case 'REFUNDED':
      return 'Đã hoàn tiền';
    case 'FAILED_DELIVERY':
      return 'Giao thất bại';
    default:
      return String(status ?? 'N/A');
  }
};

const formatCurrency = (amount: any) => {
  try {
    const n = Number(amount ?? 0);
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(n);
  } catch {
    return String(amount ?? 0);
  }
};

const formatDateTime = (value?: string | null) => {
  if (!value) return '—';

  try {
    return new Date(value).toLocaleString('vi-VN');
  } catch {
    return '—';
  }
};

const formatDate = (value?: string | null) => {
  if (!value) return '—';

  try {
    return new Date(value).toLocaleDateString('vi-VN');
  } catch {
    return '—';
  }
};

const OrderDetailScreen: React.FC = () => {
  const route = useRoute();
  const navigation: any = useNavigation();
  const { orderId } = (route.params as any) ?? { orderId: '' };

  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<any | null>(null);
  const [tracking, setTracking] = useState<any | null>(null);

  const [reasonModalVisible, setReasonModalVisible] = useState(false);
  const [reasonForAction, setReasonForAction] = useState('');
  const [modalMode, setModalMode] = useState<'CANCEL' | 'RETURN'>('CANCEL');

  const [actionLoading, setActionLoading] = useState(false);
  const [expandedShipments, setExpandedShipments] = useState<Record<string, boolean>>({});

  // ModalPopup state for alerts/notifications
  const [modalState, setModalState] = useState<any>({ visible: false, mode: 'noti', message: '' });

  const showModal = (opts: { title?: string; message: string; mode?: 'noti'|'confirm'|'toast'; onConfirm?: () => void; }) => {
    setModalState({
      visible: true,
      mode: opts.mode ?? 'noti',
      title: opts.title,
      message: opts.message,
      onConfirm: () => {
        try { setModalState((s:any) => ({ ...s, visible: false })); } catch {}
        if (opts.onConfirm) opts.onConfirm();
      },
    });
  };

  const closeModal = () => setModalState((s: any) => ({ ...s, visible: false }));

  const uniqueOrderDetails = React.useMemo(() => {
    const arr = Array.isArray(order?.orderDetails) ? order.orderDetails : [];
    const seen = new Set<string>();
    const out: any[] = [];

    for (const detail of arr) {
      const id = String(detail?.orderDetailId ?? detail?.id ?? JSON.stringify(detail));
      if (seen.has(id)) continue;

      seen.add(id);
      out.push(detail);
    }

    if (out.length !== arr.length) {
      console.warn('[OrderDetail] deduped orderDetails', {
        original: arr.length,
        deduped: out.length,
      });
    }

    return out;
  }, [order]);

  useEffect(() => {
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      try {
        UIManager.setLayoutAnimationEnabledExperimental(true);
      } catch {}
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);

    try {
      const data = await getOrderById(orderId);
      setOrder(data);

      if (data?.orderNumber) {
        try {
          const trackingData = await getOrderTracking(data.orderNumber);
          setTracking(trackingData);
        } catch (e) {
          console.warn('getOrderTracking', e);
          setTracking(null);
        }
      }
    } catch (e) {
      console.warn('getOrderById', e);
      showModal({ title: 'Lỗi', message: 'Không thể tải thông tin đơn hàng', mode: 'noti' });
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    load();
  }, [load]);

  const openCancelModal = () => {
    setModalMode('CANCEL');
    setReasonForAction('');
    setReasonModalVisible(true);
  };

  const openReturnModal = () => {
    setModalMode('RETURN');
    setReasonForAction('');
    setReasonModalVisible(true);
  };

  const performReturn = async () => {
    const reason = reasonForAction.trim();

    if (!reason) {
      showModal({ title: 'Lỗi', message: 'Vui lòng nhập lý do', mode: 'noti' });
      return;
    }

    try {
      setActionLoading(true);

      await requestOrderReturn(order.orderId, reason);

      showModal({ title: 'Đã gửi', message: 'Yêu cầu trả hàng đã được gửi', mode: 'noti' });
      setReasonModalVisible(false);
      await load();
    } catch (err: any) {
      console.error('requestOrderReturn', err);
      showModal({ title: 'Lỗi', message: err?.response?.data?.message || 'Không thể gửi yêu cầu trả hàng', mode: 'noti' });
    } finally {
      setActionLoading(false);
    }
  };

  const performCancelOrder = async () => {
    const reason = reasonForAction.trim();

    if (!reason) {
      showModal({ title: 'Lỗi', message: 'Vui lòng nhập lý do', mode: 'noti' });
      return;
    }

    try {
      setActionLoading(true);

      await cancelOrder(order.orderId, reason);

      showModal({ title: 'Thành công', message: 'Đơn hàng đã được hủy', mode: 'noti' });
      setReasonModalVisible(false);
      await load();
    } catch (err: any) {
      console.error('cancelOrder', err);
      showModal({ title: 'Lỗi', message: err?.response?.data?.message || 'Không thể hủy đơn', mode: 'noti' });
    } finally {
      setActionLoading(false);
    }
  };

  const performConfirm = async () => {
    showModal({ title: 'Chưa hỗ trợ', message: 'Xác nhận nhận hàng từng sản phẩm chưa được backend hỗ trợ.', mode: 'noti' });
  };

  const submitReason = () => {
    if (modalMode === 'RETURN') {
      performReturn();
      return;
    }

    performCancelOrder();
  };

  const toggleShipment = (key: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedShipments(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const copyToClipboard = async (text: string) => {
    try {
      let copied = false;

      try {
        const Clipboard = require('@react-native-clipboard/clipboard');
        Clipboard.setString(String(text));
        copied = true;
      } catch {}

      if (copied) {
        showModal({ title: 'Đã sao chép', message: 'Mã vận đơn đã được sao chép', mode: 'noti' });
      } else {
        showModal({ title: 'Không hỗ trợ', message: 'Không thể sao chép trên thiết bị này', mode: 'noti' });
      }
    } catch (e) {
      console.warn('copyToClipboard', e);
      showModal({ title: 'Lỗi', message: 'Không thể sao chép', mode: 'noti' });
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={COLORS.primary} />
          <Text style={styles.loadingText}>Đang tải chi tiết đơn hàng...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.headerWrap}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBackBtn}>
              <Ionicons name="arrow-back" size={22} color={COLORS.text} />
            </TouchableOpacity>

            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>Chi tiết đơn hàng</Text>
              <Text style={styles.headerSub}>Không tìm thấy đơn hàng</Text>
            </View>

            <View style={styles.headerPlaceholder} />
          </View>
        </View>

        <View style={styles.emptyWrap}>
          <Ionicons name="receipt-outline" size={48} color={COLORS.accent} />
          <Text style={styles.emptyTitle}>Không tìm thấy đơn hàng</Text>
          <Text style={styles.emptyDesc}>Vui lòng quay lại và thử lại sau.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const orderStatus = statusColor(order.status);
  const canCancel = String(order.status) === 'PROCESSING' || String(order.status) === 'PENDING';
  const canReturn = String(order.status) === 'DELIVERED' || String(order.status) === 'COMPLETED';

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.headerWrap}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBackBtn}>
            <Ionicons name="arrow-back" size={22} color={COLORS.text} />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Chi tiết đơn hàng</Text>
            <Text style={styles.headerSub} numberOfLines={1}>
              {order.orderNumber ?? order.orderId}
            </Text>
          </View>

          <TouchableOpacity onPress={load} style={styles.refreshBtn}>
            <Ionicons name="refresh" size={22} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={styles.heroOrderNo} numberOfLines={1}>
                Đơn {order.orderNumber ?? order.orderId}
              </Text>

              <Text style={styles.heroDate}>
                Tạo: {formatDateTime(order.createdAt)}
              </Text>
            </View>

            <View
              style={[
                styles.orderStatusBadge,
                { backgroundColor: orderStatus.backgroundColor },
              ]}
            >
              <Text style={[styles.orderStatusText, { color: orderStatus.color }]}>
                {mapOrderStatusLabel(order.status)}
              </Text>
            </View>
          </View>

          <View style={styles.heroSummaryRow}>
            <View style={styles.heroSummaryItem}>
              <Text style={styles.summarySmall}>Tổng tiền</Text>
              <Text style={styles.summaryStrong}>{formatCurrency(order.totalAmount)}</Text>
            </View>

            <View style={styles.heroDivider} />

            <View style={styles.heroSummaryItem}>
              <Text style={styles.summarySmall}>Thanh toán</Text>
              <Text style={styles.summaryStrong}>
                {order.paid ? 'Đã thanh toán' : 'Chưa thanh toán'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Ionicons name="location-outline" size={19} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Thông tin giao nhận</Text>
          </View>

          <Text style={styles.receiverText}>
            {order.recipientName} • {order.recipientPhone}
          </Text>

          <Text style={styles.shippingAddress}>
            {order.shippingAddress}
          </Text>
        </View>

       

        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Ionicons name="bag-outline" size={19} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Sản phẩm</Text>
          </View>

          {uniqueOrderDetails.map((detail: any) => (
            <View key={detail.orderDetailId} style={styles.itemRow}>
              <Image
                source={detail.productImageUrl ? { uri: detail.productImageUrl } : placeholderImg}
                style={styles.thumb}
              />

              <View style={styles.flex1}>
                <Text style={styles.itemTitle} numberOfLines={2}>
                  {detail.productName}
                </Text>

                <Text style={styles.meta}>
                  {detail.quantity} × {formatCurrency(detail.unitPrice)}
                </Text>

                <View style={styles.detailStatusPill}>
                  <Text style={styles.detailStatusText}>
                    {String(detail.status)}
                  </Text>
                </View>

                {detail.installationRequest ? (
                  <View style={styles.installPill}>
                    <Ionicons name="construct-outline" size={13} color={COLORS.success} />
                    <Text style={styles.installText}>Có yêu cầu lắp đặt</Text>
                  </View>
                ) : null}

                {detail.status === 'DELIVERED' ? (
                  <View style={styles.itemActions}>
                    <Pressable
                      style={[styles.btn, styles.btnPrimary]}
                      onPress={performConfirm}
                      disabled={actionLoading}
                    >
                      {actionLoading ? (
                        <ActivityIndicator />
                      ) : (
                        <Text style={styles.btnPrimaryText}>Xác nhận nhận hàng</Text>
                      )}
                    </Pressable>

                    <Pressable
                      style={[styles.btn, styles.btnDanger]}
                      onPress={openReturnModal}
                      disabled={actionLoading}
                    >
                      {actionLoading ? (
                        <ActivityIndicator />
                      ) : (
                        <Text style={styles.btnDangerText}>Yêu cầu trả hàng</Text>
                      )}
                    </Pressable>
                  </View>
                ) : null}
              </View>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Ionicons name="card-outline" size={19} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Tóm tắt thanh toán</Text>
          </View>

          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Tổng tiền</Text>
            <Text style={styles.paymentValue}>{formatCurrency(order.totalAmount)}</Text>
          </View>

          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Phí vận chuyển</Text>
            <Text style={styles.paymentValue}>{formatCurrency(order.shippingFee)}</Text>
          </View>

          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Phương thức</Text>
            <Text style={styles.paymentValue}>{order.paymentMethod ?? '—'}</Text>
          </View>

          <View style={styles.paymentDivider} />

          <View style={styles.paymentRow}>
            <Text style={styles.paymentTotalLabel}>Trạng thái thanh toán</Text>
            <Text style={styles.paymentTotalValue}>
              {order.paid ? 'Đã thanh toán' : 'Chưa thanh toán'}
            </Text>
          </View>
        </View>

        {canCancel ? (
          <View style={styles.card}>
            <Pressable
              style={[styles.fullDangerBtn]}
              onPress={openCancelModal}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <ActivityIndicator />
              ) : (
                <>
                  <Ionicons name="close-circle-outline" size={18} color="#C53030" />
                  <Text style={styles.fullDangerText}>Hủy đơn</Text>
                </>
              )}
            </Pressable>
          </View>
        ) : null}

        {canReturn ? (
          <View style={styles.card}>
            <Pressable
              style={[styles.fullWarningBtn]}
              onPress={openReturnModal}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <ActivityIndicator />
              ) : (
                <>
                  <Ionicons name="arrow-undo-outline" size={18} color={COLORS.warning} />
                  <Text style={styles.fullWarningText}>Yêu cầu trả hàng</Text>
                </>
              )}
            </Pressable>
          </View>
        ) : null}
      </ScrollView>

      <Modal
        visible={reasonModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setReasonModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {modalMode === 'CANCEL' ? 'Lý do hủy đơn' : 'Lý do trả hàng'}
              </Text>

              <TouchableOpacity
                onPress={() => setReasonModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={20} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <TextInput
              placeholder="Nhập lý do..."
              value={reasonForAction}
              onChangeText={setReasonForAction}
              style={styles.modalInput}
              multiline
              textAlignVertical="top"
            />

            <View style={styles.modalActions}>
              <Pressable
                onPress={() => setReasonModalVisible(false)}
                style={styles.modalCancel}
              >
                <Text style={styles.modalCancelText}>Hủy</Text>
              </Pressable>

              <Pressable
                onPress={submitReason}
                style={styles.modalSend}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.modalSendText}>Gửi</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <ModalPopup
        {...(modalState as any)}
        titleText={modalState.title}
        contentText={modalState.message}
        onClose={closeModal}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  container: {
    padding: 16,
    paddingBottom: 32,
  },

  headerWrap: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.bg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerBackBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  headerCenter: {
    flex: 1,
    marginHorizontal: 12,
  },
  headerTitle: {
    color: COLORS.text,
    fontWeight: '900',
    fontSize: 20,
  },
  headerSub: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 3,
    fontWeight: '600',
  },
  refreshBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  headerPlaceholder: {
    width: 42,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: COLORS.muted,
    fontWeight: '600',
  },

  emptyWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyTitle: {
    marginTop: 12,
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '900',
  },
  emptyDesc: {
    marginTop: 6,
    color: COLORS.muted,
    textAlign: 'center',
  },

  heroCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  heroOrderNo: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: '900',
  },
  heroDate: {
    marginTop: 5,
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  orderStatusBadge: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 999,
  },
  orderStatusText: {
    fontWeight: '900',
    fontSize: 11,
  },
  heroSummaryRow: {
    marginTop: 16,
    backgroundColor: COLORS.soft,
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroSummaryItem: {
    flex: 1,
  },
  heroDivider: {
    width: 1,
    height: 36,
    backgroundColor: COLORS.border,
    marginHorizontal: 12,
  },
  summarySmall: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: '700',
  },
  summaryStrong: {
    marginTop: 4,
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '900',
  },

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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    marginLeft: 8,
    color: COLORS.text,
    fontWeight: '900',
    fontSize: 16,
  },
  small: {
    color: COLORS.muted,
    fontSize: 13,
    fontWeight: '600',
  },
  receiverText: {
    color: COLORS.text,
    fontWeight: '800',
    fontSize: 14,
  },
  shippingAddress: {
    marginTop: 7,
    color: '#334155',
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '600',
  },

  miniEmpty: {
    backgroundColor: COLORS.soft,
    borderRadius: 14,
    padding: 12,
  },
  shipmentCard: {
    backgroundColor: '#FFFBF7',
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F3E7D9',
  },
  shipmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vendorTitle: {
    color: COLORS.text,
    fontWeight: '900',
    fontSize: 14,
  },
  trackingNo: {
    marginTop: 4,
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  alignEnd: {
    alignItems: 'flex-end',
  },
  shipmentBadge: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
  },
  shipmentBadgeText: {
    fontSize: 11,
    fontWeight: '900',
  },
  expandRow: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  expandText: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: '700',
    marginRight: 2,
  },
  shipmentMeta: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3E7D9',
    paddingTop: 12,
  },
  shipInfoGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  shipInfoBox: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 9,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  shipInfoLabel: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: '700',
  },
  shipInfoValue: {
    marginTop: 4,
    color: COLORS.text,
    fontSize: 11,
    fontWeight: '800',
  },
  rowActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    flexWrap: 'wrap',
  },
  trackButton: {
    paddingVertical: 8,
    paddingHorizontal: 11,
    backgroundColor: '#E0F2FE',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  trackButtonText: {
    color: '#055160',
    fontWeight: '800',
    marginLeft: 5,
    fontSize: 12,
  },
  eventsWrap: {
    marginTop: 14,
  },
  timelineTitle: {
    color: COLORS.text,
    fontWeight: '900',
    marginBottom: 2,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 10,
  },
  timelineDot: {
    width: 9,
    height: 9,
    borderRadius: 9,
    backgroundColor: COLORS.success,
    marginRight: 10,
    marginTop: 5,
  },
  timelineText: {
    fontSize: 13,
    color: COLORS.text,
    fontWeight: '700',
  },
  eventTime: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 4,
  },

  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingTop: 12,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  thumb: {
    width: 66,
    height: 66,
    borderRadius: 14,
    marginRight: 12,
    backgroundColor: '#F1F5F9',
  },
  flex1: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.text,
  },
  meta: {
    color: COLORS.muted,
    marginTop: 5,
    fontSize: 12,
    fontWeight: '600',
  },
  detailStatusPill: {
    marginTop: 7,
    backgroundColor: '#F1F5F9',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  detailStatusText: {
    color: '#334155',
    fontSize: 10,
    fontWeight: '800',
  },
  installPill: {
    marginTop: 7,
    backgroundColor: COLORS.successBg,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
  },
  installText: {
    marginLeft: 5,
    color: COLORS.success,
    fontSize: 11,
    fontWeight: '800',
  },
  itemActions: {
    marginTop: 8,
  },

  btn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginTop: 8,
    alignItems: 'center',
  },
  btnDanger: {
    backgroundColor: COLORS.dangerBg,
  },
  btnDangerText: {
    color: '#C53030',
    fontWeight: '900',
  },
  btnPrimary: {
    backgroundColor: COLORS.successBg,
  },
  btnPrimaryText: {
    color: COLORS.success,
    fontWeight: '900',
  },

  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 7,
  },
  paymentLabel: {
    color: COLORS.muted,
    fontWeight: '700',
  },
  paymentValue: {
    color: COLORS.text,
    fontWeight: '800',
  },
  paymentDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 8,
  },
  paymentTotalLabel: {
    color: COLORS.text,
    fontWeight: '900',
  },
  paymentTotalValue: {
    color: COLORS.primary,
    fontWeight: '900',
  },

  fullDangerBtn: {
    backgroundColor: COLORS.dangerBg,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  fullDangerText: {
    marginLeft: 7,
    color: '#C53030',
    fontWeight: '900',
  },
  fullWarningBtn: {
    backgroundColor: COLORS.warningBg,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  fullWarningText: {
    marginLeft: 7,
    color: COLORS.warning,
    fontWeight: '900',
  },

  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  modalCard: {
    backgroundColor: COLORS.card,
    padding: 18,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    flex: 1,
    fontWeight: '900',
    fontSize: 18,
    color: COLORS.text,
  },
  modalCloseBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    padding: 12,
    minHeight: 100,
    color: COLORS.text,
    backgroundColor: '#FFFBF7',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 14,
  },
  modalCancel: {
    paddingHorizontal: 16,
    paddingVertical: 11,
    marginRight: 8,
  },
  modalCancelText: {
    color: COLORS.muted,
    fontWeight: '800',
  },
  modalSend: {
    minWidth: 88,
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
  },
  modalSendText: {
    color: '#fff',
    fontWeight: '900',
  },
});

export default OrderDetailScreen;