import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, ActivityIndicator, Alert, Pressable, StyleSheet,  RefreshControl, Image } from 'react-native';
import { Modal, TextInput } from 'react-native';
import { getMyOrders, cancelOrder, confirmOrderDetail, requestOrderDetailReturn, requestOrderReturn } from '../../services/order';
import { mapOrderStatusLabel, statusColor } from '../../utils/orderStatus';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/AppNavigator';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';

const placeholderImg = require('../../assets/placeholderAvatar.png');

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFAF0' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F0F0F3' },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  headerSub: { color: '#666', fontSize: 13 },
  list: { padding: 12 },
  card: { backgroundColor: '#fff', marginBottom: 12, borderRadius: 12, padding: 12, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  orderNumber: { fontSize: 14, fontWeight: '600' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  badgeText: { fontWeight: '600', fontSize: 12, color: '#fff' },
  detailsRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 6 },
  thumb: { width: 56, height: 56, borderRadius: 8, marginRight: 12, backgroundColor: '#f0f0f0' },
  productTitle: { fontSize: 14, fontWeight: '500' },
  productMeta: { color: '#777', marginTop: 4, fontSize: 12 },
  totalsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  totalText: { fontWeight: '700' },
  actionsRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  btn: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8, marginRight: 8 },
  btnDanger: { backgroundColor: '#FFEBEB' },
  btnDangerText: { color: '#C53030', fontWeight: '600' },
  btnPrimary: { backgroundColor: '#E8F8EF' },
  btnPrimaryText: { color: '#137547', fontWeight: '600' },
  btnWarn: { backgroundColor: '#FFF4E6' },
  btnWarnText: { color: '#B97300', fontWeight: '600' },
  small: { color: '#666', fontSize: 12 },
  rightAlign: { alignItems: 'flex-end' },
  boldWithMarginTop8: { marginTop: 8, fontWeight: '700' },
  flex1: { flex: 1 },
  rowCenter: { flexDirection: 'row', alignItems: 'center' },
  centeredFullInline: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  iconButton: { padding: 6 },
  emptyContainer: { flex: 1, alignItems: 'center', marginTop: 40 },
  emptyText: { marginTop: 12, color: '#666' },
  tabsRow: { flexDirection: 'row', backgroundColor: '#fff', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 16, margin: 12, alignItems: 'center' },
  tab: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 999, marginRight: 8 },
  tabActive: { backgroundColor: '#FDE68A', shadowColor: '#FDE68A', shadowOpacity: 0.6, shadowRadius: 6, elevation: 2 },
  tabText: { color: '#333' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.3)' },
  modalCard: { backgroundColor: '#fff', padding: 16, borderTopLeftRadius: 12, borderTopRightRadius: 12 },
  modalTitle: { fontWeight: '700', fontSize: 16, marginBottom: 8 },
  modalInput: { borderWidth: 1, borderColor: '#EEE', borderRadius: 8, padding: 10, height: 100, textAlignVertical: 'top' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12 },
  modalCancel: { padding: 10, marginRight: 8 },
  modalSend: { padding: 10, backgroundColor: '#FDE68A', borderRadius: 8 },
  shipmentBadge: { marginTop: 6 },
  shipmentBadgeSmall: { marginTop: 6, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  badgeTextSmall: { fontSize: 12 },
  detailButton: { backgroundColor: '#E1F5FE', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12, marginTop: 8 },
  detailButtonText: { color: '#01579B', fontWeight: '500' },
  alignEnd: { alignItems: 'flex-end' },
  ml8: { marginLeft: 8 },
  detailsRowStart: { justifyContent: 'flex-start' },
});

const TABS = [
  { key: 'ALL', label: 'Tất cả' },
  { key: 'PROCESSING', label: 'Đang xử lý' },
  { key: 'COMPLETED', label: 'Hoàn tất' },
  { key: 'CANCELLED', label: 'Đã huỷ' },
];

// shipment-to-tab mapping removed — tab filtering now uses order-level status only

function formatCurrency(amount: any) {
  try {
    const n = Number(amount ?? 0);
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);
  } catch {
    return (amount ?? 0).toString();
  }
}

const OrdersScreen: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]); // displayed orders after filtering
  const [allOrders, setAllOrders] = useState<any[]>([]); // full list fetched from server
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('ALL');
  // modal states for cancel/return reason
  const [reasonModalVisible, setReasonModalVisible] = useState(false);
  const [reasonForAction, setReasonForAction] = useState('');
  const [pendingAction, setPendingAction] = useState<{ type: 'CANCEL' | 'RETURN'; id: string | null; orderId?: string | null }>({ type: 'CANCEL', id: null, orderId: null });

  const isFocused = useIsFocused();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const applyFilter = (fullList: any[], tab: string) => {
  // Tabs filter strictly by order-level status only.
  if (tab === 'ALL') return fullList;
  return fullList.filter((o) => String(o.status) === tab);
};

  const load = useCallback(async () => {
    if (!isFocused) return;
    setLoading(true);
    try {
      const data = await getMyOrders();
      const list = Array.isArray(data) ? data : [];
      setAllOrders(list);
      const filtered = applyFilter(list, activeTab);
      setOrders(filtered);
    } catch (e) {
      console.warn('getMyOrders', e);
      Alert.alert('Lỗi', 'Không thể tải danh sách đơn hàng');
    } finally {
      setLoading(false);
    }
  }, [isFocused, activeTab]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try { await load(); } finally { setRefreshing(false); }
  }, [load]);

  // When tab changes on client-side, re-apply filter to already-fetched data
  useEffect(() => {
    if (!allOrders || allOrders.length === 0) return;
    const filtered = applyFilter(allOrders, activeTab);
    setOrders(filtered);
  }, [activeTab, allOrders]);

  const handleCancel = (orderId: string) => {
    setPendingAction({ type: 'CANCEL', id: orderId });
    setReasonForAction('');
    setReasonModalVisible(true);
  };

  const handleConfirmDetail = async (orderDetailId: string) => {
    try {
      await confirmOrderDetail(orderDetailId);
      Alert.alert('Cảm ơn', 'Đã xác nhận nhận hàng');
      await load();
    } catch (err: any) {
      console.error('confirmOrderDetail', err);
      // If backend removed per-order-detail endpoint, inform user / fallback
      if (err?.response?.status === 404) {
        Alert.alert('Chưa hỗ trợ', 'Hiện tại backend chưa hỗ trợ xác nhận từng sản phẩm. Vui lòng cập nhật backend.');
      } else {
        Alert.alert('Lỗi', err?.response?.data?.message || 'Không thể xác nhận');
      }
    }
  };

  const handleRequestReturn = (orderId: string, orderDetailId?: string | null) => {
    // use order-level return per backend design; store both ids for context
    setPendingAction({ type: 'RETURN', id: orderDetailId ?? null, orderId: orderId });
    setReasonForAction('');
    setReasonModalVisible(true);
  };

  const performPendingAction = async () => {
    if (!pendingAction.id) return;
    const reason = (reasonForAction || '').trim();
    if (!reason) {
      Alert.alert('Lỗi', 'Vui lòng nhập lý do');
      return;
    }
    try {
      if (pendingAction.type === 'CANCEL') {
        await cancelOrder(pendingAction.id, reason);
        Alert.alert('Thành công', 'Đơn hàng đã được hủy');
      } else if (pendingAction.type === 'RETURN') {
        // Try per-order-detail return first; if backend doesn't expose it, fall back to order-level return
        try {
          await requestOrderDetailReturn(pendingAction.id, reason);
          Alert.alert('Đã gửi', 'Yêu cầu trả hàng đã được gửi');
        } catch (e: any) {
          console.warn('requestOrderDetailReturn failed, falling back to order-level return', e);
          if (pendingAction.orderId) {
            await requestOrderReturn(String(pendingAction.orderId), reason);
            Alert.alert('Đã gửi', 'Yêu cầu trả hàng (toàn bộ đơn) đã được gửi');
          } else {
            throw e;
          }
        }
      }
      setReasonModalVisible(false);
      setPendingAction({ type: 'CANCEL', id: null, orderId: null });
      await load();
    } catch (err: any) {
      console.error('action', err);
      Alert.alert('Lỗi', err?.response?.data?.message || 'Hành động thất bại');
    }
  };

  const renderOrder = ({ item }: { item: any }) => {
    const badgeStyle = statusColor(String(item.status));
    const orderLabel = mapOrderStatusLabel(item.status);
    const firstDetail = (item.orderDetails && item.orderDetails[0]) || null;
    const totalItems = (item.orderDetails || []).reduce((s: number, d: any) => s + (d.quantity ?? 0), 0);

    return (
      <View style={styles.card}>
        <View style={styles.topRow}>
          <View>
            <Text style={styles.orderNumber}>{item.orderNumber ?? item.orderId}</Text>
            <Text style={styles.small}>{new Date(item.createdAt ?? Date.now()).toLocaleString()}</Text>
          </View>

          <View style={styles.rightAlign}>
            <View style={[styles.badge, { backgroundColor: badgeStyle.backgroundColor }]}> 
              <Text style={[styles.badgeText, { color: badgeStyle.color }]}>{orderLabel}</Text>
            </View>
            <Text style={styles.boldWithMarginTop8}>{formatCurrency(item.totalAmount)}</Text>
            <Text style={styles.small}>Ship: {formatCurrency(item.shippingFee)}</Text>
          </View>
        </View>

        <View style={[styles.detailsRow, styles.detailsRowStart]}> 
          <Image source={firstDetail && firstDetail.productImageUrl ? { uri: firstDetail.productImageUrl } : placeholderImg} style={styles.thumb} />
          <View style={styles.flex1}>
            <Text style={styles.productTitle} numberOfLines={2}>{firstDetail?.productName ?? 'Sản phẩm'}</Text>
            <Text style={styles.productMeta}>{totalItems} món • {formatCurrency(item.totalAmount)}</Text>
          </View>

          <View style={styles.alignEnd}>
            <Pressable style={[styles.btn, styles.detailButton]} onPress={() => navigation.navigate('OrderDetail', { orderId: String(item.orderId) })}>
              <View style={styles.rowCenter}><Ionicons name="document-text-outline" size={14} color="#055160" /><Text style={[styles.detailButtonText, styles.ml8]}>Chi tiết</Text></View>
            </Pressable>
          </View>
        </View>

        {(item.orderDetails || []).map((d: any) => (
          <View key={d.orderDetailId} style={styles.detailsRow}>
            <Image source={d.productImageUrl ? { uri: d.productImageUrl } : placeholderImg} style={styles.thumb} />
            <View style={styles.flex1}>
              <Text style={styles.productTitle} numberOfLines={1}>{d.productName}</Text>
              <Text style={styles.productMeta}>{d.quantity} × {formatCurrency(d.unitPrice)}</Text>
              {/* show per-line status only in OrderDetail screen; card displays order-level status */}
            </View>

            <View style={styles.rightAlign}>
              {d.status === 'DELIVERED' ? (
                <>
                  <Pressable style={[styles.btn, styles.btnPrimary]} onPress={() => handleConfirmDetail(d.orderDetailId)}>
                    <Text style={styles.btnPrimaryText}>Đã nhận</Text>
                  </Pressable>
                  <Pressable style={[styles.btn, styles.btnWarn]} onPress={() => handleRequestReturn(item.orderId, d.orderDetailId)}>
                    <Text style={styles.btnWarnText}>Yêu cầu trả</Text>
                  </Pressable>
                </>
              ) : null}
            </View>
          </View>
        ))}

        <View style={styles.totalsRow}>
          <Text style={styles.small}>Thanh toán: {formatCurrency(item.totalAmount)}</Text>
          <View style={styles.rowCenter}>
            {item.status === 'PROCESSING' && (
              <Pressable style={[styles.btn, styles.btnDanger]} onPress={() => handleCancel(item.orderId)}>
                <View style={styles.rowCenter}><Ionicons name="close-circle" size={14} color="#C53030" /><Text style={[styles.btnDangerText, styles.ml8]}>Hủy đơn</Text></View>
              </Pressable>
            )}
          </View>
        </View>
      </View>
    );
  };

  if (loading) return (
    <SafeAreaView style={styles.safe}><View style={styles.centeredFullInline}><ActivityIndicator /></View></SafeAreaView>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <Modal visible={reasonModalVisible} animationType="slide" transparent={true} onRequestClose={() => setReasonModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{pendingAction.type === 'CANCEL' ? 'Lý do hủy đơn' : 'Lý do trả hàng'}</Text>
            <TextInput placeholder='Nhập lý do...' value={reasonForAction} onChangeText={setReasonForAction} style={styles.modalInput} multiline />
            <View style={styles.modalActions}>
              <Pressable onPress={() => setReasonModalVisible(false)} style={styles.modalCancel}>
                <Text>Hủy</Text>
              </Pressable>
              <Pressable onPress={performPendingAction} style={styles.modalSend}>
                <Text>Gửi</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Đơn hàng của tôi</Text>
          <Text style={styles.headerSub}>{orders.length} đơn hàng</Text>
        </View>
        <Pressable onPress={onRefresh} style={styles.iconButton}>
          <Ionicons name="refresh" size={22} color="#444" />
        </Pressable>
      </View>

      <View style={styles.tabsRow}>
        {TABS.map(t => (
          <Pressable key={t.key} onPress={() => setActiveTab(t.key)} style={[styles.tab, activeTab === t.key ? styles.tabActive : undefined]}>
            <Text style={styles.tabText}>{t.label}</Text>
          </Pressable>
        ))}
      </View>

      <FlatList
        contentContainerStyle={styles.list}
        data={orders}
        keyExtractor={(i: any) => String(i.orderId)}
        renderItem={renderOrder}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={EmptyListComp}
      />
    </SafeAreaView>
  );

};

const EmptyListComp = () => (
  <View style={styles.emptyContainer}>
    <Ionicons name="receipt" size={48} color="#DDD" />
    <Text style={styles.emptyText}>Không có đơn hàng ở mục này</Text>
  </View>
);

export default OrdersScreen;
