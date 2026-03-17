import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, Image, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useCart } from '../../context/CartContext';
import { formatVND } from '../../utils/number';
import { createOrder } from '../../services/order';
import { fetchMyWallet } from '../../services/wallet';
import { calculateShippingFee } from '../../services/shipping';

type ShippingId = 'fast' | 'standard';
type PaymentId = 'cod' | 'card' | 'pilapay';

function AddressCard({ address, onPress }: { address?: any; onPress?: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.card}>
      <View style={styles.addressRow}>
        <View style={styles.locationIcon}><Text style={styles.locationEmoji}>📍</Text></View>
        <View style={styles.addressBody}>
          <Text style={styles.addressName}>{address ? address.receiverName : 'Chưa có địa chỉ'}</Text>
          <Text style={styles.addressText}>{address ? address.addressLine : 'Vui lòng thêm địa chỉ giao hàng'}</Text>
          {address ? <Text style={styles.addressText}>{address.receiverPhone}</Text> : null}
        </View>
        <TouchableOpacity onPress={onPress}>
          <Text style={styles.changeText}>{address ? 'Thay đổi' : 'Thêm'}</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

function ShippingOption({ id, title, subtitle, price, selected, onSelect }: { id: ShippingId; title: string; subtitle?: string; price?: number | 'free'; selected: ShippingId; onSelect: (id: ShippingId) => void }) {
  return (
    <TouchableOpacity onPress={() => onSelect(id)} style={[styles.option, selected === id && styles.optionSelected]}>
      <View style={styles.optionLeft}>
        <View style={[styles.radioOuter, selected === id && styles.radioSelected]}>
          {selected === id && <View style={styles.radioInner} />}
        </View>
        <View style={styles.optionTextWrap}>
          <Text style={styles.optionTitle}>{title}</Text>
          {subtitle ? <Text style={styles.optionSub}>{subtitle}</Text> : null}
        </View>
      </View>
      <Text style={styles.optionPrice}>{price === 'free' ? 'Miễn phí' : (price ? formatVND(price) : '')}</Text>
    </TouchableOpacity>
  );
}

function PaymentOption({ id, title, icon, selected, onSelect }: { id: PaymentId; title: string; icon?: string; selected: PaymentId; onSelect: (id: PaymentId) => void }) {
  return (
    <TouchableOpacity onPress={() => onSelect(id)} style={[styles.option, selected === id && styles.optionSelected]}>
      <View style={styles.optionLeft}>
        <View style={[styles.radioOuter, selected === id && styles.radioSelected]}>
          {selected === id && <View style={styles.radioInner} />}
        </View>
        <View style={styles.optionTextWrap}>
          <View style={styles.payRow}>
            {icon ? <Ionicons name={icon as string} size={18} color="#111" style={styles.payIcon} /> : null}
            <Text style={styles.optionTitle}>{title}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function HeaderBlock({ lines, selectedShipping, setSelectedShipping, selectedPayment, setSelectedPayment, onUpdateQuantity, address, onAddressPress }: { lines: any[]; selectedShipping: ShippingId; setSelectedShipping: (s: ShippingId) => void; selectedPayment: PaymentId; setSelectedPayment: (p: PaymentId) => void; onUpdateQuantity: (productId: string, qty: number) => void; address?: any; onAddressPress?: () => void }) {
  return (
    <View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Thông tin giao hàng</Text>
        <AddressCard address={address} onPress={onAddressPress} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sản phẩm đã chọn</Text>
        <View style={styles.card}>
          {lines.length === 0 ? (
            <Text style={styles.emptyText}>Chưa có sản phẩm</Text>
          ) : (
            lines.map((item) => (
              <View key={item.product_id} style={styles.itemRowInline}>
                <Image source={ item.thumnail_url ? { uri: item.thumnail_url } : require('../../assets/placeholderAvatar.png') } style={styles.thumbSmall} />
                <View style={styles.itemInfoInline}>
                  <Text style={styles.itemName}>{item.product_name}</Text>
                  <Text style={styles.itemMetaInline}>Màu: -  | Size: -</Text>
                </View>
                <View style={styles.itemRightInline}>
                  <View style={styles.qtyRowInline}>
                    <TouchableOpacity style={styles.qtyBtn} onPress={() => onUpdateQuantity(item.product_id, Math.max(0, item.quantity - 1))}>
                      <Text style={styles.qtyBtnText}>−</Text>
                    </TouchableOpacity>
                    <Text style={styles.qtyTextInline}>{item.quantity}</Text>
                    <TouchableOpacity style={styles.qtyBtn} onPress={() => onUpdateQuantity(item.product_id, item.quantity + 1)}>
                      <Text style={styles.qtyBtnText}>+</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.itemPriceInline}>{formatVND(item.price * item.quantity)}</Text>
                </View>
              </View>
            ))
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Phương thức giao hàng</Text>
        <View style={styles.card}>
          <ShippingOption id="fast" title="Giao hàng nhanh" subtitle="Nhận trong 1-2 ngày" price={30000} selected={selectedShipping} onSelect={setSelectedShipping} />
          <ShippingOption id="standard" title="Giao hàng tiêu chuẩn" subtitle="Nhận trong 3-5 ngày" price={'free'} selected={selectedShipping} onSelect={setSelectedShipping} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Phương thức thanh toán</Text>
        <View style={styles.card}>
          <PaymentOption id="pilapay" title="PilaPay" icon={'wallet-outline'} selected={selectedPayment} onSelect={setSelectedPayment} />
          <PaymentOption id="card" title="Thẻ / Ngân hàng" icon={'card-outline'} selected={selectedPayment} onSelect={setSelectedPayment} />
          <PaymentOption id="cod" title="Thanh toán khi nhận (COD)" icon={'cash-outline'} selected={selectedPayment} onSelect={setSelectedPayment} />
        </View>
      </View>
    </View>
  );
}

function FooterList({ total, shippingCharge }: { total: number; shippingCharge: number }) {
  return (
    <View style={styles.footerSpacing}>
      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Tạm tính</Text><Text>{formatVND(total)}</Text></View>
        <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Phí vận chuyển</Text><Text>{shippingCharge > 0 ? formatVND(shippingCharge) : 'Miễn phí'}</Text></View>
        <View style={styles.summaryRowTop}><Text style={styles.summaryLabelBold}>Tổng cộng</Text><Text style={styles.summaryValueBold}>{formatVND(total + shippingCharge)}</Text></View>
      </View>

      <View style={styles.spacer24} />
    </View>
  );
}

function FooterContent({ total, shippingCharge, onConfirm, busy }: { total: number; shippingCharge: number; onConfirm: () => void; busy?: boolean }) {
  return (
    <View style={styles.footerBar}>
      <View>
        <Text style={styles.footerLabel}>Tổng thanh toán</Text>
        <Text style={styles.footerTotal}>{formatVND(total + shippingCharge)}</Text>
      </View>
      <TouchableOpacity style={[styles.orderBtn, busy && styles.orderBtnBusy]} onPress={onConfirm} disabled={!!busy}>
        <Text style={styles.orderBtnText}>{busy ? 'Đang xử lý...' : 'Đặt hàng'}</Text>
      </TouchableOpacity>
    </View>
  );
}

function WalletRowComponent({ wallet }: { wallet: any | null }) {
  if (!wallet) return null;
  const avail = Number(wallet.availableVND ?? wallet.available ?? 0);
  return (
    <View style={walletStyles.row}>
      <Text style={walletStyles.text}>Số dư ví: {formatVND(avail)}</Text>
    </View>
  );
}

export default function CheckoutScreen() {
  const navigation: any = useNavigation();
  const { lines, totalPrice, clearCart, updateQuantity } = useCart();
  const [selectedShipping, setSelectedShipping] = useState<ShippingId>('fast');
  const [selectedPayment, setSelectedPayment] = useState<PaymentId>('pilapay');
  const [selectedAddress, setSelectedAddress] = useState<any | undefined>(undefined);
  const [isPlacing, setIsPlacing] = useState(false);
  const [wallet, setWallet] = useState<any | null>(null);
  const [shippingCharge, setShippingCharge] = useState<number>(30000);
  const [isCalcShipping, setIsCalcShipping] = useState(false);

  // fetch wallet on mount
  React.useEffect(() => {
    (async () => {
      const r = await fetchMyWallet();
      if (r.ok) setWallet(r.data);
    })();
  }, []);

  // calculate shipping when address or shipping method changes
  React.useEffect(() => {
    (async () => {
      if (!selectedAddress) return;
      const serviceTypeId = selectedShipping === 'fast' ? 5 : 2;
      // choose a vendorId for GHN calc — try product raw vendorId if available
      const vendorId = (lines && lines.length > 0) ? (lines[0]?.raw?.vendorId ?? '') : '';
      const defaultDims = { height: 10, length: 20, width: 15, weight: 500 };
      const totalQuantity = lines.reduce((s: number, l: any) => s + (l.quantity || 1), 0);

      const req = {
        serviceTypeId,
        vendorId,
        addressId: selectedAddress.addressId,
        height: defaultDims.height,
        length: defaultDims.length,
        width: defaultDims.width,
        weight: defaultDims.weight,
        quantity: totalQuantity,
      };

      try {
        setIsCalcShipping(true);
        const res = await calculateShippingFee(req as any);
        setShippingCharge(res.total ?? 0);
      } catch (e) {
        console.warn('Calc shipping failed', e);
        setShippingCharge(selectedShipping === 'fast' ? 30000 : 0);
      } finally {
        setIsCalcShipping(false);
      }
    })();
  }, [selectedAddress, selectedShipping, lines]);

  const onConfirm = async () => {
    if (!selectedAddress) {
      Alert.alert('Thiếu địa chỉ', 'Vui lòng chọn địa chỉ giao hàng');
      return;
    }

    // wallet pre-check if paying with wallet
    const willUseWallet = selectedPayment === 'pilapay';
    const grandTotal = totalPrice + (shippingCharge || 0);
    if (willUseWallet && wallet) {
      const available = Number(wallet.availableVND ?? wallet.available ?? 0);
      if (available < grandTotal) {
        Alert.alert('Số dư không đủ', `Số dư khả dụng hiện tại là ${formatVND(available)}. Vui lòng nạp thêm.`, [
          { text: 'Hủy', style: 'cancel' },
          { text: 'Nạp tiền', onPress: () => navigation.navigate('Wallet') }
        ]);
        return;
      }
    }

    const payload = {
      recipientName: selectedAddress.receiverName,
      recipientPhone: selectedAddress.receiverPhone,
      shippingAddress: selectedAddress.addressLine,
      items: lines.map((l: any) => ({ productId: l.product_id, quantity: l.quantity })),
      discountAmount: 0,
      shippingFee: shippingCharge,
      paymentMethod: selectedPayment === 'pilapay' ? 'WALLET' : (selectedPayment === 'card' ? 'CARD' : 'COD'),
      notes: ''
    };

    try {
      setIsPlacing(true);
      await createOrder(payload as any);
      // Backend may return list of orders; if payment URL provided in some response (e.g., for VNPAY), open webview
      await clearCart();
      Alert.alert('Thành công', 'Đơn hàng đã được tạo', [{ text: 'OK', onPress: () => navigation.navigate('Home') }]);
    } catch (err: any) {
      console.warn('Order create error', err);
      const apiErr = err?.response?.data;
      const message = apiErr?.message || 'Không thể tạo đơn hàng';
      // Handle insufficient balance specially
      if (apiErr?.errorCode === 'INSUFFICIENT_BALANCE' || (err?.response?.status === 400 && message.toLowerCase().includes('insufficient'))) {
        Alert.alert('Số dư không đủ', message, [
          { text: 'Hủy', style: 'cancel' },
          { text: 'Nạp tiền', onPress: () => navigation.navigate('Wallet') }
        ]);
      } else {
        Alert.alert('Lỗi', message);
      }
    } finally {
      setIsPlacing(false);
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.headerRow}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}><Text style={styles.backIcon}>←</Text></Pressable>
        <Text style={styles.headerTitle}>Thanh Toán</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <FlatList
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={<>
          <HeaderBlock lines={lines} selectedShipping={selectedShipping} setSelectedShipping={setSelectedShipping} selectedPayment={selectedPayment} setSelectedPayment={setSelectedPayment} onUpdateQuantity={updateQuantity} address={selectedAddress} onAddressPress={() => navigation.navigate('AddressList', { onSelect: (a: any) => setSelectedAddress(a) })} />
          <WalletRowComponent wallet={wallet} />
        </>}
        data={[]}
        keyExtractor={(i: any) => i.product_id}
        renderItem={null}
        ListFooterComponent={<FooterList total={totalPrice} shippingCharge={shippingCharge} />}
      />

      <FooterContent total={totalPrice} shippingCharge={shippingCharge} onConfirm={onConfirm} busy={isPlacing || isCalcShipping} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFF9F3' },
  headerRow: { flexDirection: 'row', alignItems: 'center', padding: 12, paddingTop: 18 },
  backBtn: { width: 40, alignItems: 'flex-start' },
  backIcon: { fontSize: 18 },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 20, fontWeight: '800', color: '#8B3F2F' },
  headerPlaceholder: { width: 40 },
  section: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 },
  sectionTitle: { fontWeight: '800', fontSize: 16, marginBottom: 8 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 12, elevation: 4, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8 },
  cardPadded: { backgroundColor: '#fff', borderRadius: 12, padding: 12, elevation: 4, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, height: 8 },
  addressRow: { flexDirection: 'row', alignItems: 'center' },
  locationIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#2563EB', justifyContent: 'center', alignItems: 'center' },
  locationEmoji: { color: '#fff' },
  changeText: { color: '#2563EB', fontWeight: '700' },
  addressName: { fontWeight: '800', fontSize: 15 },
  addressText: { color: '#6B7280', marginTop: 4 },
  addressBody: { flex: 1, marginLeft: 12 },

  itemRowInline: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  thumbSmall: { width: 56, height: 56, borderRadius: 8, resizeMode: 'cover' },
  itemInfoInline: { flex: 1, marginLeft: 12 },
  itemRightInline: { alignItems: 'flex-end' },
  itemName: { fontWeight: '800' },
  itemMetaInline: { color: '#9CA3AF', marginTop: 4 },
  qtyRowInline: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  qtyBtn: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center' },
  qtyBtnText: { fontSize: 18, color: '#111' },
  qtyTextInline: { marginHorizontal: 10, minWidth: 20, textAlign: 'center' },
  itemPriceInline: { fontWeight: '800', marginTop: 6 },

  itemRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 12, marginVertical: 8, marginHorizontal: 16, elevation: 2 },
  thumb: { width: 64, height: 64, borderRadius: 8, resizeMode: 'cover' },
  itemInfo: { flex: 1, marginLeft: 12 },
  itemMeta: { color: '#9CA3AF', marginTop: 4 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  qtyText: { marginHorizontal: 10, minWidth: 20, textAlign: 'center' },
  itemPrice: { fontWeight: '800', marginLeft: 8 },

  option: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  optionLeft: { flexDirection: 'row', alignItems: 'center' },
  optionTextWrap: { marginLeft: 12 },
  optionTitle: { fontWeight: '700' },
  optionSub: { color: '#6B7280', marginTop: 4 },
  optionPrice: { color: '#111', fontWeight: '700' },
  radioOuter: { width: 22, height: 22, borderRadius: 11, borderWidth: 1, borderColor: '#D1D5DB', justifyContent: 'center', alignItems: 'center' },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#2563EB' },
  radioSelected: { borderColor: '#2563EB' },
  optionSelected: { backgroundColor: '#F3F9FF', borderRadius: 8, paddingHorizontal: 8 },
  payRow: { flexDirection: 'row', alignItems: 'center' },
  payIcon: { marginRight: 8 },

  summaryCard: { backgroundColor: '#fff', borderRadius: 12, padding: 12, elevation: 2, marginTop: 8 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  summaryLabel: { color: '#6B7280' },
  summaryRowTop: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, marginTop: 10 },
  summaryLabelBold: { color: '#6B7280', fontWeight: '700' },
  summaryValueBold: { fontWeight: '700', fontSize: 18 },

  footerBar: { position: 'absolute', left: 12, right: 12, bottom: 16, backgroundColor: '#F6E6CF', borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', elevation: 6 },
  footerLabel: { color: '#6B7280' },
  footerTotal: { fontSize: 18, fontWeight: '800' },
  orderBtn: { backgroundColor: '#8B3F2F', paddingHorizontal: 18, paddingVertical: 12, borderRadius: 10 },
  orderBtnText: { color: '#fff', fontWeight: '800' },
  orderBtnBusy: { opacity: 0.6 },

  listContent: { paddingBottom: 140 },
  footerSpacing: { paddingHorizontal: 16 },
  spacer24: { height: 24 },
  emptyText: { color: '#6B7280' },
});

const walletStyles = StyleSheet.create({
  row: { marginTop: 8, paddingHorizontal: 16 },
  text: { color: '#374151' }
});
