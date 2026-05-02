import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  Pressable,
  RefreshControl,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/AppNavigator';
import Ionicons from '@react-native-vector-icons/ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';
import ModalPopup from '../../components/ModalPopup';

import {
  getMyOrders,
  cancelOrder,
  confirmOrderDetail,
  requestOrderDetailReturn,
  requestOrderReturn,
} from '../../services/order';
import {
  mapOrderStatusLabel,
  statusColor,
  ORDER_STATUS_FILTERS,
  statusIcon,
} from '../../utils/orderStatus';

const placeholderImg = require('../../assets/placeholderAvatar.png');

const TABS = ORDER_STATUS_FILTERS;

const COLORS = {
  bg: '#FFF9F3',
  card: '#FFFFFF',
  text: '#0F172A',
  muted: '#64748B',
  primary: '#8B3F2D',
  accent: '#CD853F',
  border: '#F1E7DC',
  danger: '#EF4444',
  warning: '#F59E0B',
  soft: '#FFF7ED',
};

function formatCurrency(amount: any) {
  try {
    const n = Number(amount ?? 0);
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(n);
  } catch {
    return (amount ?? 0).toString();
  }
}

const EmptyListComp = () => (
  <View style={styles.emptyWrap}>
    <View style={styles.emptyIcon}>
      <Ionicons name="receipt-outline" size={44} color={COLORS.accent} />
    </View>

    <Text style={styles.emptyTitle}>Không có đơn hàng</Text>

    <Text style={styles.emptyDesc}>
      Hiện chưa có đơn hàng nào trong trạng thái này.
    </Text>
  </View>
);

const OrdersScreen: React.FC<any> = ({
  navigation,
}: {
  navigation: NativeStackNavigationProp<RootStackParamList>;
}) => {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  const [allOrders, setAllOrders] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('ALL');

  const [reasonModalVisible, setReasonModalVisible] = useState(false);
  const [reasonForAction, setReasonForAction] = useState('');
  const [pendingAction, setPendingAction] = useState<{
    type: 'CANCEL' | 'RETURN';
    id: string | null;
    orderId?: string | null;
  }>({
    type: 'CANCEL',
    id: null,
    orderId: null,
  });

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

  const isFocused = useIsFocused();

  const applyFilter = (fullList: any[], tab: string) => {
    if (tab === 'ALL') return fullList;
    return fullList.filter(o => String(o.status) === tab);
  };

  const load = useCallback(async () => {
    if (!isFocused) return;

    setLoading(true);

    try {
      const data = await getMyOrders();
      const list = Array.isArray(data) ? data : [];

      setAllOrders(list);
      setOrders(applyFilter(list, activeTab));
    } catch (e) {
      console.warn('getMyOrders', e);
      showModal({ title: 'Lỗi', message: 'Không thể tải danh sách đơn hàng', mode: 'noti' });
    } finally {
      setLoading(false);
    }
  }, [isFocused, activeTab]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  useEffect(() => {
    if (!allOrders || allOrders.length === 0) return;
    setOrders(applyFilter(allOrders, activeTab));
  }, [activeTab, allOrders]);

  const handleCancel = (orderId: string) => {
    setPendingAction({ type: 'CANCEL', id: orderId });
    setReasonForAction('');
    setReasonModalVisible(true);
  };

  const handleConfirmDetail = async (orderDetailId: string) => {
    try {
      await confirmOrderDetail(orderDetailId);
      showModal({ title: 'Cảm ơn', message: 'Đã xác nhận nhận hàng', mode: 'noti' });
      await load();
    } catch (err: any) {
      console.error('confirmOrderDetail', err);

      if (err?.response?.status === 404) {
        showModal({ title: 'Chưa hỗ trợ', message: 'Hiện tại backend chưa hỗ trợ xác nhận từng sản phẩm. Vui lòng cập nhật backend.', mode: 'noti' });
      } else {
        showModal({ title: 'Lỗi', message: err?.response?.data?.message || 'Không thể xác nhận', mode: 'noti' });
      }
    }
  };

  const handleRequestReturn = (orderId: string, orderDetailId?: string | null) => {
    setPendingAction({
      type: 'RETURN',
      id: orderDetailId ?? null,
      orderId,
    });
    setReasonForAction('');
    setReasonModalVisible(true);
  };

  const performPendingAction = async () => {
    const reason = (reasonForAction || '').trim();

    if (!reason) {
      showModal({ title: 'Lỗi', message: 'Vui lòng nhập lý do', mode: 'noti' });
      return;
    }

    try {
      if (pendingAction.type === 'CANCEL') {
        if (!pendingAction.id) throw new Error('Invalid cancel target');

        await cancelOrder(pendingAction.id, reason);
        showModal({ title: 'Thành công', message: 'Đơn hàng đã được hủy', mode: 'noti' });
      } else if (pendingAction.type === 'RETURN') {
        if (pendingAction.id) {
          try {
            await requestOrderDetailReturn(pendingAction.id, reason);
            showModal({ title: 'Đã gửi', message: 'Yêu cầu trả hàng đã được gửi', mode: 'noti' });
          } catch (e: any) {
            console.warn(
              'requestOrderDetailReturn failed, falling back to order-level return',
              e,
            );

            if (pendingAction.orderId) {
              await requestOrderReturn(String(pendingAction.orderId), reason);
              showModal({ title: 'Đã gửi', message: 'Yêu cầu trả hàng (toàn bộ đơn) đã được gửi', mode: 'noti' });
            } else {
              throw e;
            }
          }
        } else if (pendingAction.orderId) {
          await requestOrderReturn(String(pendingAction.orderId), reason);
          showModal({ title: 'Đã gửi', message: 'Yêu cầu trả hàng (toàn bộ đơn) đã được gửi', mode: 'noti' });
        } else {
          throw new Error('Invalid return target');
        }
      }

      setReasonModalVisible(false);
      setPendingAction({ type: 'CANCEL', id: null, orderId: null });
      await load();
    } catch (err: any) {
      console.error('action', err);
      showModal({ title: 'Lỗi', message: err?.response?.data?.message || 'Hành động thất bại', mode: 'noti' });
    }
  };

  const renderOrder = ({ item }: { item: any }) => {
    const badgeStyle = statusColor(String(item.status));
    const orderLabel = mapOrderStatusLabel(item.status);

    const rawDetails = Array.isArray(item.orderDetails) ? item.orderDetails : [];
    const details: any[] = [];
    const seen = new Set<string>();

    for (const detail of rawDetails) {
      const key = `${String(detail?.productId ?? '')}::${String(
        detail?.unitPrice ?? '',
      )}::${String(detail?.productName ?? '')}`;

      if (seen.has(key)) continue;

      seen.add(key);
      details.push(detail);
    }

    const firstDetail = details[0] || null;
    const remainingDetails = details.length > 1 ? details.slice(1) : [];
    const totalItems = details.reduce((sum: number, d: any) => {
      return sum + Number(d?.quantity ?? 0);
    }, 0);

    return (
      <View style={styles.orderCard}>
        <View style={styles.orderTopRow}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text style={styles.orderNumber} numberOfLines={1}>
              {item.orderNumber ?? item.orderId}
            </Text>

            <Text style={styles.orderDate}>
              {new Date(item.createdAt ?? Date.now()).toLocaleString()}
            </Text>
          </View>

          <View style={styles.orderStatusWrap}>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: badgeStyle.backgroundColor },
              ]}
            >
              <Text style={[styles.statusText, { color: badgeStyle.color }]}>
                {orderLabel}
              </Text>
            </View>

            <Text style={styles.orderTotal}>{formatCurrency(item.totalAmount)}</Text>

            <Text style={styles.shippingFee}>
              Ship: {formatCurrency(item.shippingFee)}
            </Text>
          </View>
        </View>

        <View style={styles.productRow}>
          <Image
            source={
              firstDetail && firstDetail.productImageUrl
                ? { uri: firstDetail.productImageUrl }
                : placeholderImg
            }
            style={styles.productImg}
          />

          <View style={styles.productInfo}>
            <Text style={styles.productName} numberOfLines={2}>
              {firstDetail?.productName ?? 'Sản phẩm'}
            </Text>

            <Text style={styles.productMeta}>
              {totalItems} món • {formatCurrency(item.totalAmount)}
            </Text>
          </View>

          <Pressable
            style={styles.detailBtn}
            onPress={() =>
              navigation.navigate('OrderDetail', {
                orderId: String(item.orderId),
              })
            }
          >
            <Ionicons name="document-text-outline" size={15} color="#055160" />
            <Text style={styles.detailBtnText}>Chi tiết</Text>
          </Pressable>
        </View>

        {remainingDetails.map((d: any) => (
          <View key={d.orderDetailId} style={styles.productRowSmall}>
            <Image
              source={d.productImageUrl ? { uri: d.productImageUrl } : placeholderImg}
              style={styles.productImg}
            />

            <View style={styles.productInfo}>
              <Text style={styles.productName} numberOfLines={1}>
                {d.productName}
              </Text>

              <Text style={styles.productMeta}>
                {d.quantity} × {formatCurrency(d.unitPrice)}
              </Text>
            </View>

            <View style={styles.productAction}>
              {d.status === 'DELIVERED' ? (
                <Pressable
                  style={styles.confirmBtn}
                  onPress={() => handleConfirmDetail(d.orderDetailId)}
                >
                  <Text style={styles.confirmBtnText}>Đã nhận</Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        ))}

        <View style={styles.orderBottomRow}>
          <Text style={styles.paymentText}>
            Thanh toán: {formatCurrency(item.totalAmount)}
          </Text>

          <View style={styles.bottomActions}>
            {item.status === 'PROCESSING' ? (
              <Pressable style={styles.cancelBtn} onPress={() => handleCancel(item.orderId)}>
                <Ionicons name="close-circle" size={14} color="#C53030" />
                <Text style={styles.cancelBtnText}>Hủy đơn</Text>
              </Pressable>
            ) : null}

            {item.status === 'DELIVERED' || item.status === 'COMPLETED' ? (
              <Pressable
                style={styles.returnBtn}
                onPress={() => handleRequestReturn(item.orderId)}
              >
                <Ionicons name="arrow-undo" size={14} color="#B7791F" />
                <Text style={styles.returnBtnText}>Trả hàng</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={COLORS.primary} />
          <Text style={styles.loadingText}>Đang tải đơn hàng...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <Modal
        visible={reasonModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setReasonModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {pendingAction.type === 'CANCEL' ? 'Lý do hủy đơn' : 'Lý do trả hàng'}
            </Text>

            <TextInput
              placeholder="Nhập lý do..."
              value={reasonForAction}
              onChangeText={setReasonForAction}
              style={styles.reasonInput}
              multiline
              textAlignVertical="top"
            />

            <View style={styles.modalActions}>
              <Pressable
                onPress={() => setReasonModalVisible(false)}
                style={styles.modalCancelBtn}
              >
                <Text style={styles.modalCancelText}>Hủy</Text>
              </Pressable>

              <Pressable onPress={performPendingAction} style={styles.modalSubmitBtn}>
                <Text style={styles.modalSubmitText}>Gửi</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <View style={styles.headerWrap}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => (navigation as any).reset({ index: 0, routes: [{ name: 'MainTabs', params: { screen: 'TraineeProfile' } }] })} style={styles.headerBackBtn}>
            <Ionicons name="arrow-back" size={22} color={COLORS.text} />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Đơn hàng của tôi</Text>
            <Text style={styles.headerSub}>{allOrders.length} đơn hàng</Text>
          </View>

          <TouchableOpacity onPress={onRefresh} style={styles.refreshBtn}>
            <Ionicons name="refresh" size={22} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.tabsWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContent}
        >
          {TABS.map(tab => {
            const active = activeTab === tab.key;

            return (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                style={[styles.tabButton, active ? styles.tabActive : null]}
              >
                <View style={styles.tabInner}>
                  <Ionicons
                    name={statusIcon(tab.key)}
                    size={16}
                    color={active ? COLORS.primary : COLORS.muted}
                    style={styles.iconMargin}
                  />

                  <Text style={[styles.tabLabel, active ? styles.tabLabelActive : null]}>
                    {tab.label}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <FlatList
        contentContainerStyle={styles.flatListContent}
        data={orders}
        keyExtractor={(item: any, index) => String(item.orderId ?? index)}
        renderItem={renderOrder}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={EmptyListComp}
        showsVerticalScrollIndicator={false}
      />
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
  root: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },

  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: COLORS.muted,
    fontWeight: '600',
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

  tabsWrap: {
    backgroundColor: COLORS.bg,
    paddingVertical: 10,
  },
  tabsContent: {
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  tabButton: {
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 999,
    marginRight: 8,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tabActive: {
    backgroundColor: COLORS.soft,
    borderColor: COLORS.accent,
  },
  tabInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconMargin: {
    marginRight: 7,
  },
  tabLabel: {
    color: COLORS.muted,
    fontSize: 13,
    fontWeight: '700',
  },
  tabLabelActive: {
    color: COLORS.primary,
    fontWeight: '900',
  },

  flatListContent: {
    padding: 16,
    paddingTop: 6,
    paddingBottom: 32,
  },

  orderCard: {
    backgroundColor: COLORS.card,
    marginBottom: 14,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  orderTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  orderNumber: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '900',
  },
  orderDate: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 4,
  },
  orderStatusWrap: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  statusText: {
    fontWeight: '800',
    fontSize: 11,
  },
  orderTotal: {
    marginTop: 8,
    fontWeight: '900',
    color: COLORS.text,
  },
  shippingFee: {
    color: COLORS.muted,
    fontSize: 11,
    marginTop: 2,
  },

  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  productRowSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  productImg: {
    width: 58,
    height: 58,
    borderRadius: 12,
    marginRight: 12,
    backgroundColor: '#F1F5F9',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '800',
  },
  productMeta: {
    color: COLORS.muted,
    marginTop: 5,
    fontSize: 12,
    fontWeight: '600',
  },
  productAction: {
    alignItems: 'flex-end',
  },

  detailBtn: {
    paddingVertical: 9,
    paddingHorizontal: 11,
    borderRadius: 12,
    backgroundColor: '#E0F2FE',
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailBtnText: {
    color: '#055160',
    fontWeight: '800',
    marginLeft: 5,
    fontSize: 12,
  },

  confirmBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#ECFDF5',
  },
  confirmBtnText: {
    color: '#047857',
    fontWeight: '800',
    fontSize: 12,
  },

  orderBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  paymentText: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: '700',
  },
  bottomActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cancelBtn: {
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#FEF2F2',
    marginLeft: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#C53030',
    fontWeight: '800',
    marginLeft: 5,
    fontSize: 12,
  },
  returnBtn: {
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#FEF3C7',
    marginLeft: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  returnBtnText: {
    color: '#B7791F',
    fontWeight: '800',
    marginLeft: 5,
    fontSize: 12,
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
  modalTitle: {
    fontWeight: '900',
    fontSize: 18,
    marginBottom: 12,
    color: COLORS.text,
  },
  reasonInput: {
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
  modalCancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 11,
    marginRight: 8,
  },
  modalCancelText: {
    color: COLORS.muted,
    fontWeight: '800',
  },
  modalSubmitBtn: {
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
  },
  modalSubmitText: {
    color: '#fff',
    fontWeight: '900',
  },

  emptyWrap: {
    alignItems: 'center',
    marginTop: 70,
    paddingHorizontal: 28,
  },
  emptyIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: COLORS.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    color: COLORS.text,
    fontWeight: '900',
    fontSize: 18,
    marginTop: 14,
  },
  emptyDesc: {
    color: COLORS.muted,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
  },
});

export default OrdersScreen;