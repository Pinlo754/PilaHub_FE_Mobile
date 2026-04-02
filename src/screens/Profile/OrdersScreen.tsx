import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, ActivityIndicator, Alert, Pressable, RefreshControl, Image, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Modal, TextInput } from 'react-native';
import { getMyOrders, cancelOrder, confirmOrderDetail, requestOrderDetailReturn, requestOrderReturn } from '../../services/order';
import { mapOrderStatusLabel, statusColor, ORDER_STATUS_FILTERS, statusIcon } from '../../utils/orderStatus';
import { useIsFocused } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/AppNavigator';
import Ionicons from '@react-native-vector-icons/ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';

const placeholderImg = require('../../assets/placeholderAvatar.png');

const TABS = ORDER_STATUS_FILTERS;
// ORDER_STATUS_FILTERS includes 'ALL' plus every backend OrderStatus (PENDING, CONFIRMED, READY, SHIPPED, DELIVERED, FAILED_DELIVERY, COMPLETED, CANCELLED, RETURNED, REFUNDED)

function formatCurrency(amount: any) {
  try {
    const n = Number(amount ?? 0);
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);
  } catch {
    return (amount ?? 0).toString();
  }
}

const OrdersScreen: React.FC<any> = ({ navigation }: { navigation: NativeStackNavigationProp<RootStackParamList> }) => {
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
    const reason = (reasonForAction || '').trim();
    if (!reason) {
      Alert.alert('Lỗi', 'Vui lòng nhập lý do');
      return;
    }
    try {
      if (pendingAction.type === 'CANCEL') {
        if (!pendingAction.id) throw new Error('Invalid cancel target');
        await cancelOrder(pendingAction.id, reason);
        Alert.alert('Thành công', 'Đơn hàng đã được hủy');
      } else if (pendingAction.type === 'RETURN') {
        // If orderDetailId provided, try per-order-detail return first; otherwise directly call order-level return
        if (pendingAction.id) {
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
        } else if (pendingAction.orderId) {
          await requestOrderReturn(String(pendingAction.orderId), reason);
          Alert.alert('Đã gửi', 'Yêu cầu trả hàng (toàn bộ đơn) đã được gửi');
        } else {
          throw new Error('Invalid return target');
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
    // normalize and dedupe orderDetails (prevent duplicate product rows from backend)
    const rawDetails = Array.isArray(item.orderDetails) ? item.orderDetails : [];
    const details: any[] = [];
    const seen = new Set<string>();
    for (const d of rawDetails) {
      // key by productId + unitPrice + variant/name to catch duplicate rows
      const key = `${String(d?.productId ?? '')}::${String(d?.unitPrice ?? '')}::${String(d?.productName ?? '')}`;
      if (seen.has(key)) continue;
      seen.add(key);
      details.push(d);
    }
    const firstDetail = details[0] || null;
    const remainingDetails = details.length > 1 ? details.slice(1) : [];
    const totalItems = details.reduce((s: number, d: any) => s + (Number(d?.quantity ?? 0)), 0);

    return (
      <View className="bg-white mb-3 rounded-xl p-3 shadow-md">
        <View className="flex-row justify-between items-center mb-2">
          <View>
            <Text className="text-base font-semibold">{item.orderNumber ?? item.orderId}</Text>
            <Text className="text-[#666] text-xs">{new Date(item.createdAt ?? Date.now()).toLocaleString()}</Text>
          </View>

          <View className="items-end">
            <View className="px-3 py-1 rounded-full" style={{ backgroundColor: badgeStyle.backgroundColor }}>
              <Text className="font-semibold text-xs" style={{ color: badgeStyle.color }}>{orderLabel}</Text>
            </View>
            <Text className="mt-2 font-bold">{formatCurrency(item.totalAmount)}</Text>
            <Text className="text-[#666] text-xs">Ship: {formatCurrency(item.shippingFee)}</Text>
          </View>
        </View>

        <View className="flex-row items-center my-1.5 justify-start">
          <Image source={firstDetail && firstDetail.productImageUrl ? { uri: firstDetail.productImageUrl } : placeholderImg} className="w-14 h-14 rounded-lg mr-3 bg-gray-100" />
          <View className="flex-1">
            <Text className="text-sm font-medium" numberOfLines={2}>{firstDetail?.productName ?? 'Sản phẩm'}</Text>
            <Text className="text-[#777] mt-1 text-xs">{totalItems} món • {formatCurrency(item.totalAmount)}</Text>
          </View>

          <View className="items-end">
            <Pressable className="py-2 px-3 rounded-lg bg-blue-50" onPress={() => navigation.navigate('OrderDetail', { orderId: String(item.orderId) })}>
              <View className="flex-row items-center"><Ionicons name="document-text-outline" size={14} color="#055160" /><Text className="text-blue-800 font-medium ml-2">Chi tiết</Text></View>
            </Pressable>
          </View>
        </View>

        {remainingDetails.map((d: any) => (
          <View key={d.orderDetailId} className="flex-row items-center my-1.5">
            <Image source={d.productImageUrl ? { uri: d.productImageUrl } : placeholderImg} className="w-14 h-14 rounded-lg mr-3 bg-gray-100" />
            <View className="flex-1">
              <Text className="text-sm font-medium" numberOfLines={1}>{d.productName}</Text>
              <Text className="text-[#777] mt-1 text-xs">{d.quantity} × {formatCurrency(d.unitPrice)}</Text>
            </View>

            <View className="items-end">
              {d.status === 'DELIVERED' ? (
                <Pressable className="py-2 px-4 rounded-lg bg-green-50" onPress={() => handleConfirmDetail(d.orderDetailId)}>
                  <Text className="text-green-700 font-semibold">Đã nhận</Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        ))}

        <View className="flex-row justify-between items-center mt-2">
          <Text className="text-[#666] text-xs">Thanh toán: {formatCurrency(item.totalAmount)}</Text>
          <View className="flex-row items-center">
            {item.status === 'PROCESSING' && (
              <Pressable className="py-2 px-4 rounded-lg bg-red-50 mr-2" onPress={() => handleCancel(item.orderId)}>
                <View className="flex-row items-center"><Ionicons name="close-circle" size={14} color="#C53030" /><Text className="text-red-600 font-semibold ml-2">Hủy đơn</Text></View>
              </Pressable>
            )}
            {(item.status === 'DELIVERED' || item.status === 'COMPLETED') && (
              <Pressable className="py-2 px-4 rounded-lg bg-yellow-50" onPress={() => handleRequestReturn(item.orderId)}>
                <View className="flex-row items-center"><Ionicons name="arrow-undo" size={14} color="#B7791F" /><Text className="text-yellow-700 font-semibold ml-2">Trả hàng</Text></View>
              </Pressable>
            )}
          </View>
        </View>
      </View>
    );
  };

  if (loading) return (
    <SafeAreaView className="flex-1 bg-[#FFFAF0]"><View className="flex-1 justify-center items-center"><ActivityIndicator /></View></SafeAreaView>
  );

  return (
    <SafeAreaView className="flex-1 bg-[#FFFAF0]">
      <Modal visible={reasonModalVisible} animationType="slide" transparent={true} onRequestClose={() => setReasonModalVisible(false)}>
        <View className="flex-1 justify-end bg-black/30">
          <View className="bg-white p-4 rounded-tl-xl rounded-tr-xl">
            <Text className="font-bold text-lg mb-2">{pendingAction.type === 'CANCEL' ? 'Lý do hủy đơn' : 'Lý do trả hàng'}</Text>
            <TextInput placeholder='Nhập lý do...' value={reasonForAction} onChangeText={setReasonForAction} className="border border-[#EEE] rounded-lg p-3 h-24 text-top" multiline />
            <View className="flex-row justify-end mt-3">
              <Pressable onPress={() => setReasonModalVisible(false)} className="p-3 mr-2">
                <Text>Hủy</Text>
              </Pressable>
              <Pressable onPress={performPendingAction} className="p-3 bg-[#FDE68A] rounded-lg">
                <Text>Gửi</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <View className="flex-row justify-between items-center p-4 bg-white border-b border-[#F0F0F3]">
        <View>
          <Text className="text-lg font-bold">Đơn hàng của tôi</Text>
          <Text className="text-[#666] text-sm">{allOrders.length} đơn hàng</Text>
        </View>
        <Pressable onPress={onRefresh} className="p-2">
          <Ionicons name="refresh" size={22} color="#444" />
        </Pressable>
      </View>

      <View className="bg-white py-2 px-3 rounded-xl m-3">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={localStyles.tabsContent}
          className="px-3"
        >
          {TABS.map(t => (
            <TouchableOpacity key={t.key} onPress={() => setActiveTab(t.key)} style={[localStyles.tabButton, activeTab === t.key ? localStyles.tabActive : null]}>
              <View style={localStyles.tabInner}>
                <Ionicons name={statusIcon(t.key)} size={16} color={activeTab === t.key ? '#111' : '#666'} style={localStyles.iconMargin} />
                <Text style={localStyles.tabLabel}>{t.label}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        contentContainerStyle={localStyles.flatListContent}
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
  <View className="flex-1 items-center mt-10">
    <Ionicons name="receipt" size={48} color="#DDD" />
    <Text className="mt-3 text-[#666]">Không có đơn hàng ở mục này</Text>
  </View>
);

const localStyles = StyleSheet.create({
  tabsContent: { paddingHorizontal: 12, alignItems: 'center' },
  flatListContent: { padding: 12 },
  tabButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 9999,
    marginRight: 8,
  },
  tabActive: {
    backgroundColor: '#FDE68A',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  tabInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconMargin: { marginRight: 8 },
  tabLabel: { color: '#333', fontSize: 14 },
});

export default OrdersScreen;
