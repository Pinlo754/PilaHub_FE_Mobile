import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, Alert, DeviceEventEmitter, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { getCartSummary, updateQuantity, removeFromCart, CartLine } from '../../services/cart';
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
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectMode, setSelectMode] = useState(false);
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
          // also clear from selection if present
          setSelectedIds(prev => prev.filter(id => id !== item.product_id));
          setToastMsg('Đã xoá sản phẩm'); setToastType('info'); setToastVisible(true);
       } }
    ]);
  };

  // toggle selection for multi-delete
  const toggleSelect = (productId: string) => {
    setSelectedIds(prev => {
      if (prev.includes(productId)) return prev.filter(id => id !== productId);
      return [...prev, productId];
    });
  };

  const clearAllConfirm = () => {
    Alert.alert('Xóa tất cả', 'Bạn có chắc muốn xóa toàn bộ sản phẩm trong giỏ?', [
      { text: 'Huỷ', style: 'cancel' },
      { text: 'Xóa tất cả', style: 'destructive', onPress: async () => {
        try {
          await (await import('../../services/cart')).clearCart(userId || 'guest');
          await load();
          setSelectedIds([]);
          setSelectMode(false);
          setToastMsg('Đã xóa tất cả'); setToastType('info'); setToastVisible(true);
        } catch (e) {
          console.warn(e);
          setToastMsg('Xoá không thành công'); setToastType('error'); setToastVisible(true);
        }
      } }
    ]);
  };

  const deleteSelected = () => {
    if (!selectedIds.length) return;
    Alert.alert('Xóa mục đã chọn', `Xóa ${selectedIds.length} sản phẩm đã chọn?`, [
      { text: 'Huỷ', style: 'cancel' },
      { text: 'Xóa', style: 'destructive', onPress: async () => {
        try {
          // remove in parallel
          await Promise.all(selectedIds.map(id => removeFromCart(userId || 'guest', id)));
          await load();
          setSelectedIds([]);
          setSelectMode(false);
          setToastMsg('Đã xóa mục đã chọn'); setToastType('info'); setToastVisible(true);
        } catch (e) {
          console.warn('deleteSelected err', e);
          setToastMsg('Không thể xóa mục đã chọn'); setToastType('error'); setToastVisible(true);
        }
      } }
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRowWithBack}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color="#0F172A" />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.title}>Giỏ hàng</Text>
          <Text style={styles.sub}>{summary.totalItems} sản phẩm</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => { setSelectMode(prev => !prev); if (selectMode) setSelectedIds([]); }} style={styles.actionBtn}>
            <Ionicons name={selectMode ? 'close-circle' : 'checkbox-outline'} size={20} color="#0F172A" />
          </TouchableOpacity>
          <TouchableOpacity onPress={clearAllConfirm} style={styles.actionBtn}>
            <Ionicons name="trash-outline" size={20} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={lines}
        keyExtractor={(i) => i.product_id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={[styles.itemCard, selectMode && selectedIds.includes(item.product_id) ? styles.itemCardSelected : null]}>
            {selectMode ? (
              <TouchableOpacity onPress={() => toggleSelect(item.product_id)} style={styles.selectToggle}>
                <Ionicons name={selectedIds.includes(item.product_id) ? 'checkmark-circle' : 'ellipse-outline'} size={22} color={selectedIds.includes(item.product_id) ? '#10B981' : '#9CA3AF'} />
              </TouchableOpacity>
            ) : null}
            <Image source={{ uri: item.thumnail_url || 'https://via.placeholder.com/120' }} style={styles.thumb} />
            <View style={styles.itemBody}>
              <Text style={styles.itemName}>{item.product_name}</Text>
              <Text style={styles.itemPrice}>{formatVND(item.price)}</Text>
              <View style={styles.qtyRow}>
                <TouchableOpacity onPress={() => onDec(item)} style={styles.qtyBtn}><Text>-</Text></TouchableOpacity>
                <Text style={styles.qtyCount}>{item.quantity}</Text>
                <TouchableOpacity onPress={() => onInc(item)} style={styles.qtyBtn}><Text>+</Text></TouchableOpacity>
                {!selectMode && <TouchableOpacity onPress={() => onRemove(item)} style={styles.removeBtn}><Ionicons name="trash-outline" size={18} color="#EF4444" /></TouchableOpacity>}
              </View>
            </View>
          </View>
        )}
        ListEmptyComponent={EmptyComponent}
      />

      {/* bulk actions toolbar */}
      {selectedIds.length > 0 && (
        <View style={styles.bulkBar}>
          <Text style={styles.bulkText}>{selectedIds.length} đã chọn</Text>
          <TouchableOpacity onPress={deleteSelected} style={styles.bulkDeleteBtn}><Text style={styles.bulkDeleteText}>Xóa mục đã chọn</Text></TouchableOpacity>
        </View>
      )}

      <Toast visible={toastVisible} message={toastMsg} type={toastType} onHidden={() => setToastVisible(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF8F0' },
  headerRowWithBack: { paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitleWrap: { flex: 1, marginLeft: 8 },
  spacer: { width: 36 },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  actionBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
  title: { fontSize: 20, fontWeight: '800' },
  sub: { color: '#6B7280' },
  listContent: { padding: 12 },
  itemCard: { backgroundColor: '#fff', borderRadius: 10, padding: 12, marginBottom: 12, flexDirection: 'row', alignItems: 'center' },
  itemCardSelected: { borderWidth: 1, borderColor: '#A7F3D0', backgroundColor: '#ECFDF5' },
  selectToggle: { marginRight: 8 },
  thumb: { width: 80, height: 80, borderRadius: 8 },
  itemBody: { flex: 1, marginLeft: 12 },
  itemName: { fontWeight: '700' },
  itemPrice: { color: '#D97706', fontWeight: '800', marginTop: 8 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  qtyBtn: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#F3F4F6', borderRadius: 6 },
  qtyCount: { marginHorizontal: 12, fontWeight: '700' },
  removeBtn: { marginLeft: 12 },
  footerBar: { padding: 16, borderTopWidth: 1, borderTopColor: '#F3F4F6', backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  bulkBar: { padding: 12, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#F3F4F6', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  bulkText: { color: '#374151' },
  bulkDeleteBtn: { backgroundColor: '#EF4444', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  bulkDeleteText: { color: '#fff', fontWeight: '700' },
  emptyWrap: { marginTop: 80, alignItems: 'center' },
  emptyText: { color: '#6B7280' },
});
