import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Image, Pressable, Alert, ScrollView, Linking } from 'react-native';
import { Modal, TextInput } from 'react-native';
import { getOrderById, cancelOrder, confirmOrderDetail, requestOrderDetailReturn } from '../../services/order';
import { getOrderTracking } from '../../services/order';
import { mapShipmentStatus } from '../../utils/shipmentStatus';
import { useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LayoutAnimation, Platform, UIManager } from 'react-native';

const placeholderImg = require('../../assets/placeholderAvatar.png');

function statusColor(status?: string) {
  switch (String(status)) {
    case 'PROCESSING': return { backgroundColor: '#FFF7ED', color: '#D97706' };
    case 'COMPLETED': return { backgroundColor: '#ECFDF5', color: '#065F46' };
    case 'CANCELLED': return { backgroundColor: '#FFF1F2', color: '#BE123C' };
    default: return { backgroundColor: '#F3F4F6', color: '#111827' };
  }
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFAF0' },
  container: { padding: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerBadgesRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  orderStatusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  orderStatusText: { fontWeight: '700', color: '#333' },
  shipmentCard: { backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#F0F0F3' },
  shipmentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  shipmentMeta: { marginTop: 8 },
  trackButton: { marginTop: 8, paddingVertical: 8, paddingHorizontal: 12, backgroundColor: '#E6F6FF', borderRadius: 8 },
  eventTime: { color: '#999', fontSize: 12, marginTop: 4 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 12 },
  badgeText: { fontWeight: '700' },
  vendorTitle: { fontWeight: '700' },
  trackButtonText: { color: '#055160' },
  alignEnd: { alignItems: 'flex-end' },
  rowActions: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  eventsWrap: { marginTop: 10 },
  shippingAddress: { marginTop: 6, color: '#333' },
  sectionTitle: { fontWeight: '700', marginBottom: 8 },
  timelineItem: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 10 },
  timelineDot: { width: 8, height: 8, borderRadius: 8, backgroundColor: '#0ea5a0', marginRight: 10, marginTop: 6 },
  timelineText: { fontSize: 13, color: '#111' },
  flex1: { flex: 1 },
  badge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  badgeTextProcessing: { color: '#0C4A6E' },
  badgeTextDelivered: { color: '#065F46' },
  shipmentBadge: { marginTop: 6 },
  btn: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8, marginTop: 10 },
  btnDanger: { backgroundColor: '#FFEBEB' },
  btnDangerText: { color: '#C53030', fontWeight: '700' },
  btnPrimary: { backgroundColor: '#E8F8EF' },
  btnPrimaryText: { color: '#137547', fontWeight: '700' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  shipmentBox: { marginTop: 10 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.3)' },
  modalCard: { backgroundColor: '#fff', padding: 16, borderTopLeftRadius: 12, borderTopRightRadius: 12 },
  modalTitle: { fontWeight: '700', fontSize: 16, marginBottom: 8 },
  modalInput: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 8, minHeight: 80, textAlignVertical: 'top' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12 },
  modalCancel: { padding: 10, marginRight: 8 },
  modalSend: { backgroundColor: '#fff', padding: 16, borderRadius: 10 },
  title: { fontSize: 18, fontWeight: '700' },
  small: { color: '#6b7280', fontSize: 13 },
  itemRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  thumb: { width: 60, height: 60, borderRadius: 8, marginRight: 12 },
  itemTitle: { fontSize: 15, fontWeight: '600' },
  meta: { color: '#6b7280', marginTop: 4 },
});

function formatCurrency(amount: any) {
  try {
    const n = Number(amount ?? 0);
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);
  } catch {
    return (amount ?? 0).toString();
  }
}

function mapOrderStatusLabel(status?: string) {
  switch (String(status)) {
    case 'PROCESSING': return 'Đang xử lý';
    case 'COMPLETED': return 'Hoàn tất';
    case 'CANCELLED': return 'Đã huỷ';
    default: return String(status ?? 'N/A');
  }
}

const OrderDetailScreen: React.FC = () => {
  const route = useRoute();
  const { orderId } = (route.params as any) ?? { orderId: '' };

  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<any | null>(null);
  const [tracking, setTracking] = useState<any | null>(null);
  const [reasonModalVisible, setReasonModalVisible] = useState(false);
  const [reasonForAction, setReasonForAction] = useState('');
  const [pendingReturnDetailId, setPendingReturnDetailId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [expandedShipments, setExpandedShipments] = useState<Record<string, boolean>>({});

  // enable LayoutAnimation on Android
  useEffect(() => {
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      try { UIManager.setLayoutAnimationEnabledExperimental(true); } catch {}
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getOrderById(orderId);
      setOrder(data);
      // try fetch tracking if orderNumber exists
      if (data?.orderNumber) {
        try {
          const t = await getOrderTracking(data.orderNumber);
          setTracking(t);
        } catch (e) {
          console.warn('getOrderTracking', e);
          setTracking(null);
        }
      }
    } catch (e) {
      console.warn('getOrderById', e);
      Alert.alert('Lỗi', 'Không thể tải thông tin đơn hàng');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => { load(); }, [load]);

  const handleCancel = () => {
    setReasonForAction('');
    setReasonModalVisible(true);
  };

  const handleRequestReturn = (orderDetailId: string) => {
    setPendingReturnDetailId(orderDetailId);
    setReasonForAction('');
    setReasonModalVisible(true);
  };

  const performReturn = async () => {
    if (!pendingReturnDetailId) return;
    const reason = (reasonForAction || '').trim();
    if (!reason) { Alert.alert('Lỗi', 'Vui lòng nhập lý do'); return; }
    try {
      setActionLoading(true);
      await requestOrderDetailReturn(pendingReturnDetailId, reason);
      Alert.alert('Đã gửi', 'Yêu cầu trả hàng đã được gửi');
      setReasonModalVisible(false);
      setPendingReturnDetailId(null);
      await load();
    } catch (err: any) {
      console.error('requestOrderDetailReturn', err);
      Alert.alert('Lỗi', err?.response?.data?.message || 'Không thể gửi yêu cầu trả hàng');
    } finally {
      setActionLoading(false);
    }
  };

  const performConfirm = async (orderDetailId: string) => {
    try {
      setActionLoading(true);
      await confirmOrderDetail(orderDetailId);
      Alert.alert('Cảm ơn', 'Đã xác nhận nhận hàng');
      await load();
    } catch (err: any) {
      console.error('confirmOrderDetail', err);
      Alert.alert('Lỗi', err?.response?.data?.message || 'Không thể xác nhận');
    } finally {
      setActionLoading(false);
    }
  };

  const performCancelOrder = async () => {
    const reason = (reasonForAction || '').trim();
    if (!reason) { Alert.alert('Lỗi', 'Vui lòng nhập lý do'); return; }
    try {
      setActionLoading(true);
      await cancelOrder(order.orderId, reason);
      Alert.alert('Thành công', 'Đơn hàng đã được hủy');
      setReasonModalVisible(false);
      await load();
    } catch (err: any) {
      console.error('cancelOrder', err);
      Alert.alert('Lỗi', err?.response?.data?.message || 'Không thể hủy đơn');
    } finally {
      setActionLoading(false);
    }
  };

  const toggleShipment = (key: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedShipments(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const copyToClipboard = async (text: string) => {
    try {
      let copied = false;
      try {
        const Clipboard = require('@react-native-clipboard/clipboard');
        Clipboard.setString(String(text));
        copied = true;
      } catch {
        // ignore
      }
      if (copied) Alert.alert('Đã sao chép', 'Mã vận đơn đã được sao chép');
      else Alert.alert('Không hỗ trợ', 'Không thể sao chép trên thiết bị này');
    } catch (e) {
      console.warn('copyToClipboard', e);
      Alert.alert('Lỗi', 'Không thể sao chép');
    }
  };

  if (loading) return (
    <SafeAreaView style={styles.safe}><View style={styles.loadingContainer}><ActivityIndicator /></View></SafeAreaView>
  );

  if (!order) return (
    <SafeAreaView style={styles.safe}><View style={styles.container}><Text>Không tìm thấy đơn hàng</Text></View></SafeAreaView>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.title}>Đơn {order.orderNumber}</Text>
              <Text style={styles.small}>Tạo: {new Date(order.createdAt).toLocaleString()}</Text>
            </View>
            <View style={styles.headerBadgesRow}>
              <View style={[styles.orderStatusBadge, { backgroundColor: statusColor(order.status).backgroundColor }]}> 
                <Text style={[styles.orderStatusText, { color: statusColor(order.status).color }]}>{mapOrderStatusLabel(order.status)}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Thông tin giao nhận</Text>
          <Text style={styles.small}>{order.recipientName} • {order.recipientPhone}</Text>
          <Text style={styles.shippingAddress}>{order.shippingAddress}</Text>
          {/* Render all shipments (one per vendor) */}
          {(order.shipments || []).map((s: any) => {
            const sm = mapShipmentStatus(s?.status);
            // try to find events specific to this shipment in tracking response
            let events: any[] = [];
            if (tracking) {
              // if tracking.shipments array provided, match by trackingNumber
              if (Array.isArray(tracking.shipments)) {
                const matched = tracking.shipments.find((ts: any) => ts.trackingNumber === s.trackingNumber);
                events = matched?.events ?? [];
              }
              // fallback to top-level events
              if ((!events || events.length === 0) && Array.isArray(tracking.events)) events = tracking.events;
            }

            const key = String(s.trackingNumber ?? s.shipmentId);
            const expanded = !!expandedShipments[key];
            return (
              <View key={key} style={styles.shipmentCard}>
                <Pressable onPress={() => toggleShipment(key)} style={styles.shipmentHeader}>
                  <View>
                    <Text style={styles.vendorTitle}>{s.vendorName ?? s.shippingProvider ?? 'Nhà vận chuyển'}</Text>
                    <Text style={styles.small}>{s.trackingNumber ?? '—'}</Text>
                  </View>
                  <View style={styles.alignEnd}>
                    <View style={[styles.badge, { backgroundColor: sm.bgColor }]}> 
                      <Text style={[styles.badgeText, { color: sm.textColor }]}>{sm.label}</Text>
                    </View>
                    <Text style={styles.small}>{expanded ? 'Ẩn' : 'Xem'}</Text>
                  </View>
                </Pressable>

                {expanded && (
                  <View style={styles.shipmentMeta}>
                    <Text style={styles.small}>Dự kiến: {s.estimatedDeliveryAt ? new Date(s.estimatedDeliveryAt).toLocaleString() : '—'}</Text>
                    <Text style={styles.small}>Đã giao: {s.deliveredAt ? new Date(s.deliveredAt).toLocaleString() : '—'}</Text>
                    <Text style={styles.small}>Hạn trả: {s.returnDeadline ? new Date(s.returnDeadline).toLocaleDateString() : '—'}</Text>
                    <View style={styles.rowActions}>
                      { (s.trackingUrl || s.trackingWebsite || (tracking && tracking.trackingUrl)) && (
                        <Pressable style={styles.trackButton} onPress={() => {
                          const url = s.trackingUrl ?? s.trackingWebsite ?? tracking.trackingUrl;
                          if (url) Linking.openURL(url).catch(()=> Alert.alert('Lỗi', 'Không thể mở đường dẫn'));
                        }}>
                          <Text style={styles.trackButtonText}>Mở theo dõi</Text>
                        </Pressable>
                      )}
                      {s.trackingNumber && (
                        <Pressable style={styles.trackButton} onPress={() => copyToClipboard(s.trackingNumber)}>
                          <Text style={styles.trackButtonText}>Sao chép mã</Text>
                        </Pressable>
                      )}
                    </View>

                    {events && events.length > 0 && (
                      <View style={styles.eventsWrap}>
                        <Text style={styles.sectionTitle}>Lịch sử vận chuyển</Text>
                        {events.map((ev: any, i: number) => (
                          <View key={i} style={styles.timelineItem}>
                            <View style={styles.timelineDot} />
                            <View style={styles.flex1}>
                              <Text style={styles.timelineText}>{ev.status} {ev.location ? `• ${ev.location}` : ''}</Text>
                              <Text style={styles.eventTime}>{ev.timestamp ? new Date(ev.timestamp).toLocaleString() : ''}</Text>
                            </View>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                )}
              </View>
            );
          })}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Sản phẩm</Text>
          {(order.orderDetails || []).map((d: any) => (
            <View key={d.orderDetailId} style={styles.itemRow}>
              <Image source={d.productImageUrl ? { uri: d.productImageUrl } : placeholderImg} style={styles.thumb} />
              <View style={styles.flex1}>
                <Text style={styles.itemTitle}>{d.productName}</Text>
                <Text style={styles.meta}>{d.quantity} × {formatCurrency(d.unitPrice)}</Text>
                <Text style={styles.small}>Trạng thái: {String(d.status)}</Text>

                {d.status === 'DELIVERED' && (
                  <View>
                    <Pressable style={[styles.btn, styles.btnPrimary]} onPress={() => performConfirm(d.orderDetailId)} disabled={actionLoading}>
                      {actionLoading ? <ActivityIndicator /> : <Text style={styles.btnPrimaryText}>Xác nhận nhận hàng</Text>}
                    </Pressable>
                    <Pressable style={[styles.btn, styles.btnDanger]} onPress={() => handleRequestReturn(d.orderDetailId)} disabled={actionLoading}>
                      {actionLoading ? <ActivityIndicator /> : <Text style={styles.btnDangerText}>Yêu cầu trả hàng</Text>}
                    </Pressable>
                  </View>
                )}
              </View>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Tóm tắt thanh toán</Text>
          <Text style={styles.small}>Tổng tiền: {formatCurrency(order.totalAmount)}</Text>
          <Text style={styles.small}>Phí vận chuyển: {formatCurrency(order.shippingFee)}</Text>
          <Text style={styles.small}>Đã thanh toán: {order.paid ? 'Có' : 'Chưa'}</Text>
        </View>

        {order.status === 'PROCESSING' && (
          <View style={styles.card}>
            <Pressable style={[styles.btn, styles.btnDanger]} onPress={handleCancel} disabled={actionLoading}>
              {actionLoading ? <ActivityIndicator /> : <Text style={styles.btnDangerText}>Hủy đơn</Text>}
            </Pressable>
          </View>
        )}

        <Modal visible={reasonModalVisible} animationType="slide" transparent={true} onRequestClose={() => setReasonModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Lý do</Text>
              <TextInput placeholder='Nhập lý do...' value={reasonForAction} onChangeText={setReasonForAction} style={styles.modalInput} multiline />
              <View style={styles.modalActions}>
                <Pressable onPress={() => setReasonModalVisible(false)} style={styles.modalCancel}>
                  <Text>Hủy</Text>
                </Pressable>
                <Pressable onPress={pendingReturnDetailId ? performReturn : performCancelOrder} style={styles.modalSend} disabled={actionLoading}>
                  {actionLoading ? <ActivityIndicator /> : <Text>Gửi</Text>}
                </Pressable>
               </View>
             </View>
           </View>
         </Modal>

     </ScrollView>
   </SafeAreaView>
 );
};

export default OrderDetailScreen;
