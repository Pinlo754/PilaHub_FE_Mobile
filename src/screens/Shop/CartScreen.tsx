import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, Image, TouchableOpacity, Alert, ScrollView, TextInput, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { CartLine } from '../../services/cart';
import { useCart } from '../../context/CartContext';
import { formatVND } from '../../utils/number';
import Toast from '../../components/Toast';
import Ionicons from '@react-native-vector-icons/ionicons';

const EmptyComponent = () => (
  <View className="mt-20 items-center">
    <Text className="text-gray-500">Giỏ hàng trống</Text>
  </View>
);

const localStyles = StyleSheet.create({
  qtyInput: { minWidth: 48, textAlign: 'center' },
});

// CheckoutBar defined outside of CartScreen to avoid recreating on every render
function CheckoutBar({ total, disabled, onCheckout, selectedCount }: { total: number; disabled: boolean; onCheckout: () => void; selectedCount: number }) {
  return (
    <View className="absolute left-4 right-4 bottom-4 bg-white rounded-xl p-3 flex-row items-center justify-between shadow">
      <View>
        <Text className="text-gray-500 text-sm">{selectedCount} đã chọn</Text>
        <Text className="text-black text-lg font-extrabold">{formatVND(total)}</Text>
      </View>
      <TouchableOpacity disabled={disabled} onPress={onCheckout} className={`px-5 py-3 rounded-lg ${disabled ? 'bg-gray-400' : 'bg-red-500'}`}>
        <Text className="text-white font-extrabold">{disabled ? 'Chọn sản phẩm' : 'Thanh toán'}</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function CartScreen() {
  const focused = useIsFocused();
  const navigation: any = useNavigation();
  const { lines, totalItems, totalPrice, loadCart, userId, updateQuantity: ctxUpdateQuantity, removeFromCart: ctxRemoveFromCart, clearCart: ctxClearCart } = useCart();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectMode, setSelectMode] = useState(false);
  // map product_id -> input string so user can type freely
  const [qtyInputs, setQtyInputs] = useState<Record<string,string>>({});
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState<'success'|'error'|'info'>('info');

  // Helpers for grouping by shop and selection
  const grouped = useMemo(() => {
    // infer vendor/shop id and display name from common fields in each line.raw or line
    // prefer vendorId/vendorBusinessName coming from backend ProductDto
    const map: Record<string, { shopId: string; shopName: string; items: any[] }> = {};
    for (const l of lines) {
      const raw = (l as any).raw || {};
      // prefer vendorId for grouping, fall back to shop_id/merchant_id
      const vendorId = raw.vendorId ?? raw.vendor_id ?? raw.merchant_id ?? raw.shop_id ?? raw.shopId ?? (l as any).vendorId ?? (l as any).shop_id ?? null;
      const shopId = vendorId ? String(vendorId) : ('unknown_' + String((l as any).product_id));

      // detect business name from multiple possible fields returned by backend
      const shopName = String(
        raw.vendorBusinessName ?? raw.vendor_business_name ?? raw.businessName ?? raw.shop_name ?? raw.merchant_name ?? raw.shopName ?? (l as any).vendorBusinessName ?? (l as any).shop_name ?? 'Cửa hàng'
      );

      if (!map[shopId]) map[shopId] = { shopId, shopName, items: [] };
      map[shopId].items.push(l);
    }
    return Object.values(map);
  }, [lines]);

  const areAllSelected = useCallback((shopId: string) => {
    const group = grouped.find(g => g.shopId === shopId);
    if (!group) return false;
    return group.items.every((it: any) => selectedIds.includes(it.product_id));
  }, [grouped, selectedIds]);

  const toggleSelectShop = useCallback((shopId: string) => {
    const group = grouped.find(g => g.shopId === shopId);
    if (!group) return;
    const allSelected = group.items.every((it: any) => selectedIds.includes(it.product_id));
    setSelectedIds(prev => {
      if (allSelected) {
        // deselect all in group
        return prev.filter(id => !group.items.some((it: any) => it.product_id === id));
      }
      // add missing ids
      const toAdd = group.items.map((it: any) => it.product_id).filter((id: string) => !prev.includes(id));
      return [...prev, ...toAdd];
    });
  }, [grouped, selectedIds]);

  const totalSelectedPrice = useMemo(() => {
    if (!selectedIds || selectedIds.length === 0) return 0;
    return (lines || []).reduce((s, l) => s + (selectedIds.includes(l.product_id) ? l.price * l.quantity : 0), 0);
  }, [lines, selectedIds]);

  // Checkout handler
  function getStockForItem(it: any) {
    const raw = it.raw ?? {};
    return raw.stockQuantity ?? raw.stock_quantity ?? raw.stock ?? raw.availableQuantity ?? null;
  }

  const handleCheckout = useCallback(async () => {
    if (!selectedIds.length) {
      setToastMsg('Vui lòng chọn sản phẩm để thanh toán'); setToastType('info'); setToastVisible(true); return;
    }

    const items = lines.filter(l => selectedIds.includes(l.product_id));

    // validate items: quantity >= 1 and vendorId present
    const invalid = items.find((it: any) => {
      const qty = Number(it.quantity) || 0;
      if (!qty || qty < 1) return true;
      const raw = it.raw ?? {};
      const vendorId = raw.vendorId ?? raw.vendor_id ?? raw.merchant_id ?? raw.shop_id ?? raw.merchantId ?? it.vendorId ?? it.shop_id ?? null;
      if (!vendorId) return true;
      return false;
    });

    if (invalid) {
      setToastMsg('Một số sản phẩm thiếu thông tin nhà cung cấp hoặc số lượng không hợp lệ');
      setToastType('error'); setToastVisible(true);
      return;
    }

    // check stock for each selected item; if any exceeds, adjust and stop checkout so user can review
    for (const it of items) {
      const stock = getStockForItem(it);
      if (stock !== null && typeof stock !== 'undefined' && Number(it.quantity) > Number(stock)) {
        // adjust server-side quantity to available stock
        try {
          await ctxUpdateQuantity(it.product_id, Number(stock));
          setToastMsg(`Sản phẩm "${it.product_name ?? it.product_id}" đã vượt quá tồn kho. Đã điều chỉnh về ${stock}.`);
          setToastType('error'); setToastVisible(true);
          await loadCart();
        } catch (e) {
          console.warn('adjust qty on checkout failed', e);
          setToastMsg('Không thể điều chỉnh số lượng theo tồn kho'); setToastType('error'); setToastVisible(true);
        }
        return; // stop checkout, let user review
      }
    }

    // navigate to checkout with validated items
    navigation.navigate('Checkout' as never, { items } as never);
  }, [selectedIds, lines, navigation, ctxUpdateQuantity, loadCart]);

  // Load cart when screen focused or when userId changes
  useEffect(() => { if (focused) loadCart(); }, [focused, loadCart]);
  useEffect(() => { if (userId) loadCart(); }, [userId, loadCart]);

  // sync qtyInputs when cart lines change
  useEffect(() => {
    const next: Record<string,string> = {};
    for (const l of lines) next[l.product_id] = String(l.quantity ?? 1);
    setQtyInputs(next);
  }, [lines]);

  const onInc = async (item: CartLine) => {
    try {
      await ctxUpdateQuantity(item.product_id, item.quantity + 1);
      setQtyInputs(prev => ({ ...prev, [item.product_id]: String(Math.max(1, item.quantity + 1)) }));
      // context will refresh lines/summary
    } catch {
      setToastMsg('Không thể cập nhật số lượng'); setToastType('error'); setToastVisible(true);
    }
  };

  const onDec = async (item: CartLine) => {
    try {
      await ctxUpdateQuantity(item.product_id, Math.max(0, item.quantity - 1));
      setQtyInputs(prev => ({ ...prev, [item.product_id]: String(Math.max(0, item.quantity - 1)) }));
    } catch {
      setToastMsg('Không thể cập nhật số lượng'); setToastType('error'); setToastVisible(true);
    }
  };

  const onRemove = async (item: CartLine) => {
    Alert.alert('Xoá', 'Bạn có muốn xoá sản phẩm khỏi giỏ?', [
      { text: 'Huỷ', style: 'cancel' },
      { text: 'Xoá', style: 'destructive', onPress: async () => {
          await ctxRemoveFromCart(item.product_id);
          // context will refresh lines/summary
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
          await ctxClearCart();
          await loadCart();
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

  return (
    <SafeAreaView className="flex-1 bg-[#FFF8F0]">
      <View className="px-4 py-3 flex-row items-center justify-between border-b border-gray-100">
        <TouchableOpacity onPress={() => navigation.goBack()} className="w-9 h-9 items-center justify-center">
          <Ionicons name="arrow-back" size={20} color="#0F172A" />
        </TouchableOpacity>
        <View className="flex-1 ml-2">
          <Text className="text-2xl font-extrabold">Giỏ hàng</Text>
          <Text className="text-gray-500">{totalItems} sản phẩm</Text>
        </View>
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => { setSelectMode(prev => !prev); if (selectMode) setSelectedIds([]); }} className="w-9 h-9 items-center justify-center">
            <Ionicons name={selectMode ? 'close-circle' : 'checkbox-outline'} size={20} color="#0F172A" />
          </TouchableOpacity>
          <TouchableOpacity onPress={clearAllConfirm} className="w-9 h-9 items-center justify-center">
            <Ionicons name="trash-outline" size={20} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="p-3 pb-36">
        {(!grouped || grouped.length === 0) && <EmptyComponent />}
        {grouped.map((g) => (
          <View key={g.shopId} className="mb-4">
            <View className="p-3 bg-white rounded-lg mb-2 flex-row items-center justify-between">
              <View className="flex-row items-center">
                {selectMode && (
                  <TouchableOpacity onPress={() => toggleSelectShop(g.shopId)} className="mr-2">
                    <Ionicons name={areAllSelected(g.shopId) ? 'checkmark-circle' : 'ellipse-outline'} size={22} color={areAllSelected(g.shopId) ? '#10B981' : '#9CA3AF'} />
                  </TouchableOpacity>
                )}
                <Text className="font-extrabold">{g.shopName}</Text>
              </View>
              <Text className="text-gray-500">{g.items.length} sản phẩm</Text>
            </View>

            {g.items.map((item: any) => {
              const stock = getStockForItem(item);
              return (
                <View key={item.product_id} className={`bg-white rounded-xl p-3 mb-3 flex-row items-center ${selectMode && selectedIds.includes(item.product_id) ? 'border border-green-200 bg-green-50' : ''}`}>
                  {selectMode ? (
                    <TouchableOpacity onPress={() => toggleSelect(item.product_id)} className="mr-2">
                      <Ionicons name={selectedIds.includes(item.product_id) ? 'checkmark-circle' : 'ellipse-outline'} size={22} color={selectedIds.includes(item.product_id) ? '#10B981' : '#9CA3AF'} />
                    </TouchableOpacity>
                  ) : null}
                  <Image source={{ uri: item.thumnail_url || 'https://via.placeholder.com/120' }} className="w-20 h-20 rounded-lg" />
                  <View className="flex-1 ml-3">
                    {/* show vendor/shop name per item (in case group name is generic) */}
                    <Text className="text-gray-500 text-xs mb-1">{(item.raw?.vendorBusinessName ?? item.raw?.vendor_business_name ?? g.shopName) as string}</Text>
                    <Text className="font-bold">{item.product_name}</Text>
                    <Text className="text-orange-600 font-extrabold mt-2">{formatVND(item.price)}</Text>
                    {stock !== null ? (
                      stock > 0 ? <Text className="text-sm text-gray-500 mt-1">Còn {stock} sản phẩm</Text> : <Text className="text-sm text-red-600 mt-1">Hết hàng</Text>
                    ) : null}
                    <View className="flex-row items-center mt-2">
                      <TouchableOpacity onPress={() => onDec(item)} className="px-3 py-1 bg-gray-100 rounded"><Text>-</Text></TouchableOpacity>
                      <TextInput
                        value={qtyInputs[item.product_id] ?? String(item.quantity)}
                        onChangeText={(t) => setQtyInputs(prev => ({ ...prev, [item.product_id]: t.replace(/[^0-9]/g, '') }))}
                        onBlur={async () => {
                          const raw = qtyInputs[item.product_id] ?? String(item.quantity);
                          const n = Math.max(1, parseInt(raw || '0', 10) || 1);
                          const final = (stock !== null && !isNaN(Number(stock))) ? Math.min(n, Number(stock)) : n;
                          try { await ctxUpdateQuantity(item.product_id, final); await loadCart(); } catch { setToastMsg('Không thể cập nhật số lượng'); setToastType('error'); setToastVisible(true); }
                        }}
                        keyboardType="number-pad"
                        returnKeyType="done"
                        className="mx-3 font-bold text-center bg-white px-2 py-1 rounded"
                        style={localStyles.qtyInput}
                      />
                      <TouchableOpacity onPress={() => onInc(item)} className="px-3 py-1 bg-gray-100 rounded"><Text>+</Text></TouchableOpacity>
                      {!selectMode && <TouchableOpacity onPress={() => onRemove(item)} className="ml-3"><Ionicons name="trash-outline" size={18} color="#EF4444" /></TouchableOpacity>}
                    </View>
                  </View>
                </View>
              );
            })}

          </View>
        ))}
      </ScrollView>

      {/* sticky checkout bar */}
      <CheckoutBar total={totalSelectedPrice} disabled={selectedIds.length === 0} onCheckout={handleCheckout} selectedCount={selectedIds.length} />

      <Toast visible={toastVisible} message={toastMsg} type={toastType} onHidden={() => setToastVisible(false)} />
    </SafeAreaView>
  );
}
