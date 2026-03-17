import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, Alert, DeviceEventEmitter, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { getCart, getCartSummary, updateQuantity, removeFromCart, CartLine } from '../../services/cart';
import { formatVND } from '../../utils/number';
import Toast from '../../components/Toast';
import Ionicons from '@react-native-vector-icons/ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const EmptyComponent = () => (
  <View style={styles.emptyWrap}>
    <Text style={styles.emptyText}>Giỏ hàng trống</Text>
  </View>
);

export default function CartScreen() {
  const focused = useIsFocused();
  const navigation: any = useNavigation();
  const [lines, setLines] = useState<CartLine[]>([]);
  const [summary, setSummary] = useState({ totalItems: 0, totalPrice: 0 });
  const [userId, setUserId] = useState<string>('guest');
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState<'success'|'error'|'info'>('info');

  const load = useCallback(async () => {
    try {
      const res = await getCartSummary(userId || 'guest');
      setLines(res.lines || []);
      setSummary({ totalItems: res.totalItems, totalPrice: res.totalPrice });
    } catch {
      console.warn('load cart error');
    }
  }, [userId]);

  useEffect(() => { if (focused) load(); }, [focused, load]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const rawId = await AsyncStorage.getItem('id');
        let uid: string | null = null;
        try { const p = rawId ? JSON.parse(rawId) : null; uid = p || rawId; } catch { uid = rawId; }
        const final = uid ? String(uid) : 'guest';
        if (mounted) setUserId(final);
      } catch {
        /* ignore */
      }
    })();

    const sub = DeviceEventEmitter.addListener('cartUpdated', (evt: any) => {
      try {
        if (!evt) return;
        const evtUser = evt.userId ?? 'guest';
        if (evtUser === (userId || 'guest')) load();
        if ((userId || 'guest') === 'guest' && evtUser === 'guest') load();
      } catch {
        /* ignore */
      }
    });

    return () => { mounted = false; sub.remove(); };
  }, [userId, load]);

  const onInc = async (item: CartLine) => {
    try {
      const updated = await updateQuantity(userId || 'guest', item.product_id, item.quantity + 1);
      setLines(updated);
      const s = await getCartSummary(userId || 'guest');
      setSummary({ totalItems: s.totalItems, totalPrice: s.totalPrice });
    } catch {
      setToastMsg('Không thể cập nhật số lượng'); setToastType('error'); setToastVisible(true);
    }
  };

  const onDec = async (item: CartLine) => {
    try {
      const updated = await updateQuantity(userId || 'guest', item.product_id, Math.max(0, item.quantity - 1));
      setLines(updated);
      const s = await getCartSummary(userId || 'guest');
      setSummary({ totalItems: s.totalItems, totalPrice: s.totalPrice });
    } catch {
      setToastMsg('Không thể cập nhật số lượng'); setToastType('error'); setToastVisible(true);
    }
  };

  const onRemove = async (item: CartLine) => {
    Alert.alert('Xoá', 'Bạn có muốn xoá sản phẩm khỏi giỏ?', [
      { text: 'Huỷ', style: 'cancel' },
      { text: 'Xoá', style: 'destructive', onPress: async () => {
        const updated = await removeFromCart(userId || 'guest', item.product_id);
        setLines(updated);
        const s = await getCartSummary(userId || 'guest');
        setSummary({ totalItems: s.totalItems, totalPrice: s.totalPrice });
        setToastMsg('Đã xoá sản phẩm'); setToastType('info'); setToastVisible(true);
      } }
    ]);
  };

  const onCheckout = () => {
    navigation.navigate('Checkout' as any);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Giỏ hàng</Text>
        <Text style={styles.sub}>{summary.totalItems} sản phẩm</Text>
      </View>

      <FlatList
        data={lines}
        keyExtractor={(i) => i.product_id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.itemCard}>
            <Image source={{ uri: item.thumnail_url || 'https://via.placeholder.com/120' }} style={styles.thumb} />
            <View style={styles.itemBody}>
              <Text style={styles.itemName}>{item.product_name}</Text>
              <Text style={styles.itemPrice}>{formatVND(item.price)}</Text>
              <View style={styles.qtyRow}>
                <TouchableOpacity onPress={() => onDec(item)} style={styles.qtyBtn}><Text>-</Text></TouchableOpacity>
                <Text style={styles.qtyCount}>{item.quantity}</Text>
                <TouchableOpacity onPress={() => onInc(item)} style={styles.qtyBtn}><Text>+</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => onRemove(item)} style={styles.removeBtn}><Ionicons name="trash-outline" size={18} color="#EF4444" /></TouchableOpacity>
              </View>
            </View>
          </View>
        )}
        ListEmptyComponent={EmptyComponent}
      />

      <View style={styles.footerBar}>
        <View style={styles.footerLeft}>
          <Text style={styles.footerLabel}>Tổng</Text>
          <Text style={styles.footerAmount}>{formatVND(summary.totalPrice)}</Text>
        </View>
        <TouchableOpacity onPress={onCheckout} style={styles.checkoutBtn}>
          <Text style={styles.checkoutText}>Thanh toán</Text>
        </TouchableOpacity>
      </View>

      <Toast visible={toastVisible} message={toastMsg} type={toastType} onHidden={() => setToastVisible(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF8F0' },
  headerRow: { paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: '800' },
  sub: { color: '#6B7280' },
  listContent: { padding: 12 },
  itemCard: { backgroundColor: '#fff', borderRadius: 10, padding: 12, marginBottom: 12, flexDirection: 'row', alignItems: 'center' },
  thumb: { width: 80, height: 80, borderRadius: 8 },
  itemBody: { flex: 1, marginLeft: 12 },
  itemName: { fontWeight: '700' },
  itemPrice: { color: '#D97706', fontWeight: '800', marginTop: 8 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  qtyBtn: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#F3F4F6', borderRadius: 6 },
  qtyCount: { marginHorizontal: 12, fontWeight: '700' },
  removeBtn: { marginLeft: 12 },
  footerBar: { padding: 16, borderTopWidth: 1, borderTopColor: '#F3F4F6', backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  footerLeft: { flex: 1 },
  footerLabel: { color: '#6B7280' },
  footerAmount: { fontWeight: '900', fontSize: 18 },
  checkoutBtn: { backgroundColor: '#F59E0B', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10 },
  checkoutText: { color: '#fff', fontWeight: '800' },
  emptyWrap: { marginTop: 80, alignItems: 'center' },
  emptyText: { color: '#6B7280' },
});
