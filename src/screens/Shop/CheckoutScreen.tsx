import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, Image, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from '@react-native-vector-icons/ionicons';
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

function ShippingOption({ id, title, subtitle, price, selected, onSelect }: { id: ShippingId; title: string; subtitle?: string; price?: number | 'free' | undefined; selected: ShippingId; onSelect: (id: ShippingId) => void }) {
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
      <Text style={styles.optionPrice}>{price === 'free' ? 'Miễn phí' : (price === undefined ? 'Đang tính...' : formatVND(price as number))}</Text>
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
            {icon ? <Ionicons name={icon as any} size={18} color="#111" style={styles.payIcon} /> : null}
            <Text style={styles.optionTitle}>{title}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function HeaderBlock({ lines, selectedPayment, setSelectedPayment, onUpdateQuantity, address, onAddressPress, computedShippingByVendor, onToggleInstallation, allInstallation, onToggleAllInstallation, selectedShippingByItem, setSelectedShippingByItem }: { lines: any[]; selectedPayment: PaymentId; setSelectedPayment: (p: PaymentId) => void; onUpdateQuantity: (productId: string, qty: number) => void; address?: any; onAddressPress?: () => void; computedShippingByVendor?: Record<string, number | null>; onToggleInstallation?: (productId: string, value: boolean) => void; allInstallation?: boolean; onToggleAllInstallation?: (v: boolean) => void; selectedShippingByItem: Record<string, ShippingId>; setSelectedShippingByItem: React.Dispatch<React.SetStateAction<Record<string, ShippingId>>> }) {
  // group lines by vendor/shop similar to CartScreen
  const groups = React.useMemo(() => {
    const map: Record<string, { shopId: string; shopName: string; items: any[] }> = {};
    for (const l of lines) {
      const raw = l.raw ?? {};
      const vendorId = raw.vendorId ?? raw.vendor_id ?? raw.merchant_id ?? raw.shop_id ?? raw.shopId ?? l.vendorId ?? l.shop_id ?? null;
      const shopId = vendorId ? String(vendorId) : ('unknown_' + String(l.product_id));
      const shopName = String(raw.vendorBusinessName ?? raw.vendor_business_name ?? raw.businessName ?? raw.shop_name ?? raw.merchant_name ?? raw.shopName ?? l.vendorBusinessName ?? l.shop_name ?? 'Cửa hàng');
      if (!map[shopId]) map[shopId] = { shopId, shopName, items: [] };
      map[shopId].items.push(l);
    }
    return Object.values(map);
  }, [lines]);

  return (
    <View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Thông tin giao hàng</Text>
        <AddressCard address={address} onPress={onAddressPress} />
      </View>

      {/* Global installation toggle for all items */}
      <View style={styles.section}>
        <TouchableOpacity onPress={() => onToggleAllInstallation && onToggleAllInstallation(!allInstallation)} style={styles.allInstallRow}>
          <View style={styles.allInstallLeft}>
            <View style={[styles.allInstallBox, allInstallation ? styles.allInstallBoxOn : null]}>
              {allInstallation ? <Text style={styles.allInstallTick}>✓</Text> : null}
            </View>
            <Text style={styles.allInstallLabel}>Yêu cầu lắp đặt cho tất cả sản phẩm</Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sản phẩm đã chọn</Text>
        {groups.length === 0 ? (
          <View style={styles.card}><Text style={styles.emptyText}>Chưa có sản phẩm</Text></View>
        ) : (
          groups.map(g => (
            <View key={g.shopId} style={styles.vendorSection}>
              <View style={styles.card}>
                <View style={styles.vendorHeaderRow}>
                  <View>
                    <Text style={styles.vendorTitle}>{g.shopName}</Text>
                    {/* per-vendor shipping fee (computedShippingByVendor keys are vendorId strings) */}
                    <Text style={styles.vendorShippingText}>{(computedShippingByVendor && computedShippingByVendor[g.shopId] != null)
                      ? (computedShippingByVendor[g.shopId] === 0 ? 'Phí vận chuyển: Miễn phí' : `Phí vận chuyển: ${formatVND(computedShippingByVendor[g.shopId] as number)}`)
                      : 'Đang tính phí vận chuyển...'
                    }</Text>
                  </View>
                  <Text style={styles.vendorCount}>{g.items.length} sản phẩm</Text>
                </View>
                {g.items.map((item: any) => (
                  <View key={item.product_id}>
                    <View style={styles.itemRowInline}>
                      <Image source={ item.thumnail_url ? { uri: item.thumnail_url } : require('../../assets/placeholderAvatar.png') } style={styles.thumbSmall} />
                      <View style={styles.itemInfoInline}>
                        <Text style={styles.itemName}>{item.product_name}</Text>
                        {/* installation toggle */}
                        <TouchableOpacity onPress={() => onToggleInstallation && onToggleInstallation(item.product_id, !item.installationRequest)} style={styles.installToggle}>
                          <Text style={[styles.installToggleText, item.installationRequest ? styles.installOn : styles.installOff]}>{item.installationRequest ? 'Yêu cầu lắp đặt: Có' : 'Yêu cầu lắp đặt: Không'}</Text>
                        </TouchableOpacity>
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

                    <View style={styles.productShippingContainer}>
                      <ProductShippingOptions
                        productId={item.product_id}
                        vendorId={g.shopId}
                        selected={selectedShippingByItem[item.product_id]}
                        computedVendorShipping={computedShippingByVendor?.[g.shopId]}
                        onSelect={(id) => setSelectedShippingByItem((prev: Record<string, ShippingId>) => ({ ...prev, [item.product_id]: id }))}
                      />
                    </View>
                  </View>
                ))}
              </View>
            </View>
          ))
        )}
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

// Product-level shipping options: two stacked ShippingOption rows showing price on the right
function ProductShippingOptions({ productId: _productId, vendorId: _vendorId, selected, onSelect, computedVendorShipping }: { productId: string; vendorId: string; selected?: ShippingId; onSelect: (id: ShippingId) => void; computedVendorShipping?: number | null }) {
  const cur = selected ?? 'fast';
  // price for fast: undefined when calculating, 0 -> 'free', otherwise number
  const fastPrice: number | 'free' | undefined = computedVendorShipping == null ? undefined : (computedVendorShipping === 0 ? 'free' : computedVendorShipping);
  return (
    <View style={styles.productShippingCard}>
      <ShippingOption id="fast" title="Giao hàng nhanh" subtitle="Nhận trong 1-2 ngày" price={fastPrice} selected={cur} onSelect={(id) => onSelect(id)} />
      <ShippingOption id="standard" title="Giao hàng tiêu chuẩn" subtitle="Nhận trong 3-5 ngày" price={'free'} selected={cur} onSelect={(id) => onSelect(id)} />
    </View>
  );
}

export default function CheckoutScreen() {
  const navigation: any = useNavigation();
  const { lines, totalPrice, clearCart, updateQuantity, setInstallationRequest } = useCart();
  // per-item shipping selection (fast | standard)
  const [selectedShippingByItem, setSelectedShippingByItem] = useState<Record<string, ShippingId>>({} as Record<string, ShippingId>);
  const [selectedPayment, setSelectedPayment] = useState<PaymentId>('pilapay');
  const [selectedAddress, setSelectedAddress] = useState<any | undefined>(undefined);
  const [isPlacing, setIsPlacing] = useState(false);
  const [wallet, setWallet] = useState<any | null>(null);
  const [shippingCharge, setShippingCharge] = useState<number>(0);
  // Keep per-vendor computed shipping and overall sum
  const [computedShippingByVendor, setComputedShippingByVendor] = useState<Record<string, number | null>>({});

  // fetch wallet on mount
  React.useEffect(() => {
    (async () => {
      const r = await fetchMyWallet();
      if (r.ok) setWallet(r.data);
    })();
  }, []);

  // calculate shipping per-vendor when address or cart lines change (not on shipping method toggle)
  React.useEffect(() => {
    (async () => {
      if (!selectedAddress) return;
      if (!lines || lines.length === 0) return;

      // group lines by vendorId (support multiple possible fields)
      const groupByVendor: Record<string, any[]> = {};
      for (const l of lines) {
        const raw = l.raw ?? {};
        const vendorId = String(raw.vendorId ?? raw.vendor_id ?? raw.merchant_id ?? raw.shop_id ?? raw.merchantId ?? raw.shopId ?? 'unknown');
        groupByVendor[vendorId] = groupByVendor[vendorId] || [];
        groupByVendor[vendorId].push(l);
      }

      // If vendorId is 'unknown' we still attempt a single fee of 0
      const vendorIds = Object.keys(groupByVendor).filter(id => id && id !== 'unknown');
      if (vendorIds.length === 0) {
        setComputedShippingByVendor({ unknown: 0 });
        setShippingCharge(0);
        return;
      }

      // default fallback package dims (cm / grams)
      const defaultDims = { height: 10, length: 20, width: 15, weight: 500 };
      // helper to extract numeric dimension from product raw metadata
      const getNum = (obj: any, keys: string[], fallback: number) => {
        for (const k of keys) {
          const v = obj?.[k];
          if (v === undefined || v === null) continue;
          const n = Number(v);
          if (!Number.isNaN(n)) return n;
        }
        return fallback;
      };

      const next: Record<string, number | null> = {};
      try {
        await Promise.all(vendorIds.map(async (vid) => {
          const vendorLines = groupByVendor[vid] || [];
          // aggregate product-level dimensions for items that request FAST shipping
          let totalQuantity = 0;
          let totalWeight = 0; // grams
          let maxHeight = 0; let maxLength = 0; let maxWidth = 0;
          for (const it of vendorLines) {
            const q = Math.max(1, Math.floor(Number(it.quantity) || 1));
            const chosen = selectedShippingByItem[it.product_id] ?? 'fast';
            // only include in GHN request if the item selected 'fast'
            if (chosen !== 'fast') continue;
            totalQuantity += q;

            const raw = it.raw ?? {};
            // backend ProductDto exposes: height, length, width, weight (units: cm / grams)
            const w = getNum(raw, ['weight', 'packageWeight', 'weightInGrams', 'weight_g', 'grams', 'package_weight'], defaultDims.weight);
            const h = getNum(raw, ['height', 'packageHeight', 'h'], defaultDims.height);
            const l = getNum(raw, ['length', 'packageLength', 'l'], defaultDims.length);
            const wd = getNum(raw, ['width', 'packageWidth', 'w'], defaultDims.width);

            totalWeight += w * q;
            if (h > maxHeight) maxHeight = h;
            if (l > maxLength) maxLength = l;
            if (wd > maxWidth) maxWidth = wd;
          }

          // if no fast-selected items for this vendor, shipping fee is zero
          if (totalQuantity === 0) {
            next[vid] = 0;
            return;
          }

          const req = {
            serviceTypeId: 2,
            vendorId: vid,
            addressId: selectedAddress.addressId,
            height: Math.max(1, Math.floor(maxHeight) || defaultDims.height),
            length: Math.max(1, Math.floor(maxLength) || defaultDims.length),
            width: Math.max(1, Math.floor(maxWidth) || defaultDims.width),
            weight: Math.max(1, Math.floor(totalWeight) || defaultDims.weight),
            quantity: Math.max(1, Math.floor(totalQuantity)),
          };

          try {
            const res = await calculateShippingFee(req as any);
            next[vid] = Number(res.total ?? 0);
          } catch (err: any) {
            console.warn('[Checkout] Calc shipping failed for vendor', vid, err?.response?.data ?? (err && err.message) ?? err);
            next[vid] = 0;
          }
        }));
      } finally {
        setComputedShippingByVendor(next);
        const sum = Object.values(next).reduce((s: number, v) => s + (v ?? 0), 0);
        setShippingCharge(sum ?? 0);
      }
    })();
  }, [selectedAddress, lines, selectedShippingByItem]);

  // displayShippingCharge: computed value used for UI and order payload
  const displayShippingCharge = sumShippingMap(computedShippingByVendor);

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

    // Build payload with per-vendor shipping fees and sanitize installationRequest per product support
    const groupByVendor: Record<string, any[]> = {};
    for (const l of lines) {
      const raw = l.raw ?? {};
      const vendorId = String(raw.vendorId ?? raw.vendor_id ?? raw.merchant_id ?? raw.shop_id ?? raw.merchantId ?? raw.shopId ?? 'unknown');
      groupByVendor[vendorId] = groupByVendor[vendorId] || [];
      groupByVendor[vendorId].push(l);
    }

    const vendorShippings = Object.keys(groupByVendor).map(vid => ({ vendorId: vid, shippingFee: computedShippingByVendor[vid] ?? 0 }));

    // sanitize installationRequest: only send true when product supports installation (try to detect from raw fields)
    const sanitizedItems = lines.map((l: any) => {
      const raw = l.raw ?? {};
      const supportsInstall = !!(raw.isInstallationSupported ?? raw.installationSupported ?? raw.supportsInstallation ?? raw.support_installation ?? false);
      const requested = !!l.installationRequest && supportsInstall;
      if (!!l.installationRequest && !supportsInstall) {
        // inform user that installation was not available for this product
        console.warn('[Checkout] installationRequest ignored for product', l.product_id, 'not supported by product metadata');
      }
      return { productId: l.product_id, quantity: l.quantity, installationRequest: requested };
    });

    const payload = {
      recipientName: selectedAddress.receiverName,
      recipientPhone: selectedAddress.receiverPhone,
      shippingAddress: selectedAddress.addressLine,
      items: sanitizedItems,
      discountAmount: 0,
      vendorShippings,
      paymentMethod: selectedPayment === 'pilapay' ? 'WALLET' : (selectedPayment === 'card' ? 'CARD' : 'COD'),
      notes: ''
    };

    // debug log: order create payload
    console.log('[Checkout] createOrder payload', payload);

    try {
      setIsPlacing(true);
      const created = await createOrder(payload as any);
      console.log('[Checkout] createOrder response', created);
      // Backend returns list of created orders; navigate to success screen with orders
      await clearCart();
      navigation.navigate('OrderSuccess' as never, { orders: created } as never);
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
          <HeaderBlock
             lines={lines}
             selectedPayment={selectedPayment}
             setSelectedPayment={setSelectedPayment}
             onUpdateQuantity={updateQuantity}
             address={selectedAddress}
             onAddressPress={() => navigation.navigate('AddressList', { onSelect: (a: any) => setSelectedAddress(a) })}
             computedShippingByVendor={computedShippingByVendor}
             selectedShippingByItem={selectedShippingByItem}
             setSelectedShippingByItem={setSelectedShippingByItem}
             onToggleInstallation={(productId: string, value: boolean) => setInstallationRequest(productId, value)}
             allInstallation={lines.every(item => item.installationRequest)}
             onToggleAllInstallation={(value: boolean) => lines.forEach(item => setInstallationRequest(item.product_id, value))}
           />
          <WalletRowComponent wallet={wallet} />
        </>}
        data={[]}
        keyExtractor={(i: any) => i.product_id}
        renderItem={null}
        ListFooterComponent={<FooterList total={totalPrice} shippingCharge={displayShippingCharge} />}
      />

      <FooterContent total={totalPrice} shippingCharge={displayShippingCharge} onConfirm={onConfirm} busy={isPlacing} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFF9F3' },
  headerRow: { flexDirection: 'row', alignItems: 'center', padding: 12, paddingTop: 18 },
  backBtn: { width: 40, alignItems: 'flex-start' },
  backIcon: { fontSize: 18 },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 20, fontWeight: '800', color: '#8B3F2D' },
  headerPlaceholder: { width: 40 },

  listContent: { paddingBottom: 140 },
  section: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 },
  sectionTitle: { fontWeight: '800', fontSize: 16, marginBottom: 8 },

  card: { backgroundColor: '#fff', borderRadius: 12, padding: 12, elevation: 4, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8 },

  addressRow: { flexDirection: 'row', alignItems: 'center' },
  locationIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#2563EB', justifyContent: 'center', alignItems: 'center' },
  locationEmoji: { color: '#fff' },
  changeText: { color: '#2563EB', fontWeight: '700' },
  addressName: { fontWeight: '800', fontSize: 15 },
  addressText: { color: '#6B7280', marginTop: 4 },
  addressBody: { flex: 1, marginLeft: 12 },

  // product row
  itemRowInline: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  thumbSmall: { width: 56, height: 56, borderRadius: 8, resizeMode: 'cover' },
  itemInfoInline: { flex: 1, marginLeft: 12 },
  itemName: { fontWeight: '800' },
  installToggle: { marginTop: 8 },
  installToggleText: {},
  installOn: { color: '#0B8F3B' },
  installOff: { color: '#6B7280' },

  // right-side controls (fixed width so shipping block won't overlap)
  itemRightInline: { width: 100, alignItems: 'flex-end' },
  qtyRowInline: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  qtyBtn: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center' },
  qtyBtnText: { fontSize: 18, color: '#111' },
  qtyTextInline: { marginHorizontal: 10, minWidth: 20, textAlign: 'center' },
  itemPriceInline: { fontWeight: '800', marginTop: 6 },

  // product-level shipping placement: align under product info (after thumbnail)
  productShippingContainer: { marginLeft: 64, marginRight: 12, paddingTop: 6, paddingBottom: 8 },
  productShippingCard: { marginTop: 6, backgroundColor: '#fff', borderRadius: 10, padding: 8, borderWidth: 1, borderColor: '#F3F4F6', elevation: 1, overflow: 'hidden' },

  // shipping option appearance
  option: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 10, borderRadius: 8, marginBottom: 6, backgroundColor: '#fff', width: '100%' },
  optionSelected: { backgroundColor: '#E6F7FF', borderColor: '#D1EFFF', borderWidth: 1 },
  optionLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  optionTextWrap: { marginLeft: 10, flex: 1 },
  optionTitle: { fontWeight: '700', fontSize: 14 },
  optionSub: { color: '#6B7280', marginTop: 2, fontSize: 13 },
  optionPrice: { color: '#007AFF', fontWeight: '700', minWidth: 56, textAlign: 'right', flexShrink: 0, fontSize: 14 },

  radioOuter: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: '#2563EB', justifyContent: 'center', alignItems: 'center' },
  radioInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#2563EB' },
  radioSelected: { borderColor: '#2563EB' },

  // payment / summary
  footerSpacing: { paddingHorizontal: 16 },
  spacer24: { height: 24 },
  summaryCard: { backgroundColor: '#fff', borderRadius: 12, padding: 12, elevation: 2, marginTop: 8 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  summaryRowTop: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, marginTop: 10 },
  summaryLabel: { color: '#6B7280' },
  summaryLabelBold: { color: '#6B7280', fontWeight: '700' },
  summaryValueBold: { fontWeight: '700', fontSize: 18 },

  footerBar: { position: 'absolute', left: 12, right: 12, bottom: 16, backgroundColor: '#F6E6CF', borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', elevation: 6 },
  footerLabel: { color: '#6B7280' },
  footerTotal: { fontSize: 18, fontWeight: '800' },
  orderBtn: { backgroundColor: '#8B3F2D', paddingHorizontal: 18, paddingVertical: 12, borderRadius: 10 },
  orderBtnText: { color: '#fff', fontWeight: '800' },
  orderBtnBusy: { opacity: 0.6 },

  // install all
  allInstallRow: { paddingVertical: 8 },
  allInstallLeft: { flexDirection: 'row', alignItems: 'center' },
  allInstallBox: { width: 22, height: 22, borderRadius: 6, borderWidth: 1, borderColor: '#D1D5DB', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  allInstallBoxOn: { backgroundColor: '#0B8F3B', borderColor: '#0B8F3B' },
  allInstallTick: { color: '#fff', fontWeight: '700' },
  allInstallLabel: { marginLeft: 10, fontWeight: '700' },

  emptyText: { color: '#6B7280' },
});

const walletStyles = StyleSheet.create({
  row: {
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  text: {
    fontSize: 14,
    color: '#333',
  },
});

// helper function to compute sum of shipping fees
function sumShippingMap(map?: Record<string, number | null>): number {
  if (!map) return 0;
  return Object.values(map).reduce((acc: number, v) => acc + (v ?? 0), 0);
}
