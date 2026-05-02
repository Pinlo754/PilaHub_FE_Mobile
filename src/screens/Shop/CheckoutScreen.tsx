import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import Ionicons from '@react-native-vector-icons/ionicons';

import { useCart } from '../../context/CartContext';
import { formatVND } from '../../utils/number';
import { createOrder } from '../../services/order';
import { fetchMyWallet } from '../../services/wallet';
import { calculateShippingFee } from '../../services/shipping';
import { CartLine } from '../../services/cart';

import {
  validateCartItem,
  CartValidationResult,
  getStockLabel,
  getExpiryLabel,
  getMainInvalidReason,
} from './utils/cartValidation';
import ModalPopup from '../../components/ModalPopup';

type ShippingId = 'fast' | 'standard';
type PaymentId = 'cod' | 'card' | 'pilapay';

type VendorGroup = {
  shopId: string;
  shopName: string;
  items: CartLine[];
};

function getVendorId(item: any): string {
  const raw = item.raw ?? {};

  return String(
    raw.vendorId ??
      raw.vendor_id ??
      raw.merchant_id ??
      raw.shop_id ??
      raw.merchantId ??
      raw.shopId ??
      item.vendorId ??
      item.shop_id ??
      'unknown',
  );
}

function getVendorName(item: any): string {
  const raw = item.raw ?? {};

  return String(
    raw.vendorBusinessName ??
      raw.vendor_business_name ??
      raw.businessName ??
      raw.shop_name ??
      raw.merchant_name ??
      raw.shopName ??
      item.vendorBusinessName ??
      item.shop_name ??
      'Cửa hàng',
  );
}

function supportsInstallation(item: any): boolean {
  const raw = item.raw ?? {};

  const value =
    raw.isInstallationSupported ??
    raw.installationSupported ??
    raw.installation_supported ??
    raw.supportsInstallation ??
    raw.supports_installation ??
    raw.support_installation ??
    raw.haveInstallation ??
    raw.hasInstallation ??
    raw.installationAvailable ??
    raw.installation_available ??
    item.isInstallationSupported ??
    item.installationSupported ??
    item.installation_supported ??
    item.supportsInstallation;

  if (typeof value === 'boolean') return value;

  if (typeof value === 'string') {
    return ['true', '1', 'yes', 'y', 'co', 'có'].includes(
      value.trim().toLowerCase(),
    );
  }

  if (typeof value === 'number') return value === 1;

  return false;
}

function sumShippingMap(map?: Record<string, number | null>): number {
  if (!map) return 0;

  return Object.values(map).reduce((acc: number, value) => {
    return acc + (value ?? 0);
  }, 0);
}

function AddressCard({
  address,
  onPress,
}: {
  address?: any;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.card}>
      <View style={styles.addressRow}>
        <View style={styles.locationIcon}>
          <Ionicons name="location-outline" size={22} color="#fff" />
        </View>

        <View style={styles.addressBody}>
          <Text style={styles.addressName}>
            {address ? address.receiverName : 'Chưa có địa chỉ'}
          </Text>

          <Text style={styles.addressText}>
            {address ? address.addressLine : 'Vui lòng thêm địa chỉ giao hàng'}
          </Text>

          {address ? (
            <Text style={styles.addressText}>{address.receiverPhone}</Text>
          ) : null}
        </View>

        <TouchableOpacity onPress={onPress}>
          <Text style={styles.changeText}>{address ? 'Thay đổi' : 'Thêm'}</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

function PaymentOption({
  id,
  title,
  subtitle,
  icon,
  selected,
  onSelect,
}: {
  id: PaymentId;
  title: string;
  subtitle?: string;
  icon?: string;
  selected: PaymentId;
  onSelect: (id: PaymentId) => void;
}) {
  const active = selected === id;

  return (
    <TouchableOpacity
      onPress={() => onSelect(id)}
      style={[styles.paymentOption, active && styles.paymentOptionSelected]}
    >
      <View style={styles.optionLeft}>
        <View style={[styles.radioOuter, active && styles.radioSelected]}>
          {active ? <View style={styles.radioInner} /> : null}
        </View>

        <View style={styles.paymentIconBox}>
          <Ionicons
            name={icon as any}
            size={20}
            color={active ? '#8B3F2D' : '#64748B'}
          />
        </View>

        <View style={styles.optionTextWrap}>
          <Text style={styles.optionTitle}>{title}</Text>
          {subtitle ? <Text style={styles.optionSub}>{subtitle}</Text> : null}
        </View>
      </View>
    </TouchableOpacity>
  );
}

function ShippingOption({
  id,
  title,
  subtitle,
  price,
  selected,
  onSelect,
}: {
  id: ShippingId;
  title: string;
  subtitle?: string;
  price?: number | 'free';
  selected: ShippingId;
  onSelect: (id: ShippingId) => void;
}) {
  return (
    <TouchableOpacity
      onPress={() => onSelect(id)}
      style={[styles.option, selected === id && styles.optionSelected]}
    >
      <View style={styles.optionLeft}>
        <View style={[styles.radioOuter, selected === id && styles.radioSelected]}>
          {selected === id ? <View style={styles.radioInner} /> : null}
        </View>

        <View style={styles.optionTextWrap}>
          <Text style={styles.optionTitle}>{title}</Text>
          {subtitle ? <Text style={styles.optionSub}>{subtitle}</Text> : null}
        </View>
      </View>

      <Text style={styles.optionPrice}>
        {price === 'free'
          ? 'Miễn phí'
          : price === undefined
            ? 'Đang tính...'
            : formatVND(price)}
      </Text>
    </TouchableOpacity>
  );
}

function ProductShippingOptions({
  selected,
  onSelect,
  computedVendorShipping,
}: {
  selected?: ShippingId;
  onSelect: (id: ShippingId) => void;
  computedVendorShipping?: number | null;
}) {
  const cur = selected ?? 'fast';

  const fastPrice: number | 'free' | undefined =
    computedVendorShipping == null
      ? undefined
      : computedVendorShipping === 0
        ? 'free'
        : computedVendorShipping;

  return (
    <View style={styles.productShippingCard}>
      <ShippingOption
        id="fast"
        title="Giao hàng nhanh"
        subtitle="Nhận trong 1-2 ngày"
        price={fastPrice}
        selected={cur}
        onSelect={onSelect}
      />
    </View>
  );
}

function WalletRowComponent({
  wallet,
  selectedPayment,
}: {
  wallet: any | null;
  selectedPayment: PaymentId;
}) {
  if (!wallet || selectedPayment !== 'pilapay') return null;

  const available = Number(wallet.availableVND ?? wallet.available ?? 0);

  return (
    <View style={styles.walletRow}>
      <Ionicons name="wallet-outline" size={18} color="#8B3F2D" />
      <Text style={styles.walletText}>Số dư ví: {formatVND(available)}</Text>
    </View>
  );
}

function ProductValidationBadge({ validation }: { validation: CartValidationResult }) {
  const reason = getMainInvalidReason(validation);

  if (!reason) {
    return (
      <View style={[styles.validationBox, styles.validationOk]}>
        <Ionicons name="shield-checkmark-outline" size={14} color="#047857" />
        <Text style={[styles.validationText, { color: '#047857' }]}>
          Sản phẩm hợp lệ
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.validationBox,
        validation.canCheckout ? styles.validationWarning : styles.validationError,
      ]}
    >
      <Ionicons
        name={validation.canCheckout ? 'information-circle-outline' : 'alert-circle-outline'}
        size={14}
        color={validation.canCheckout ? '#C2410C' : '#B91C1C'}
      />

      <Text
        style={[
          styles.validationText,
          { color: validation.canCheckout ? '#C2410C' : '#B91C1C' },
        ]}
        numberOfLines={2}
      >
        {reason}
      </Text>
    </View>
  );
}

function InstallationControl({
  item,
  installSupported,
  onToggleInstallation,
}: {
  item: CartLine;
  installSupported: boolean;
  onToggleInstallation: (productId: string, value: boolean) => void;
}) {
  return (
    <View style={styles.installArea}>
      <Text style={styles.installLabel}>Lắp đặt</Text>

      <TouchableOpacity
        disabled={!installSupported}
        onPress={() => onToggleInstallation(item.product_id, !item.installationRequest)}
        style={[
          styles.installChip,
          installSupported && item.installationRequest ? styles.installChipOn : null,
          !installSupported ? styles.installChipDisabled : null,
        ]}
      >
        <Ionicons
          name={
            !installSupported
              ? 'close-circle-outline'
              : item.installationRequest
                ? 'checkmark-circle-outline'
                : 'construct-outline'
          }
          size={14}
          color={
            !installSupported
              ? '#94A3B8'
              : item.installationRequest
                ? '#047857'
                : '#64748B'
          }
        />

        <Text
          style={[
            styles.installChipText,
            installSupported && item.installationRequest ? styles.installChipTextOn : null,
            !installSupported ? styles.installChipTextDisabled : null,
          ]}
        >
          {!installSupported
            ? 'Không hỗ trợ'
            : item.installationRequest
              ? 'Đã chọn'
              : 'Thêm lắp đặt'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

function CheckoutItem({
  item,
  validation,
  selectedShipping,
  shippingFee,
  quantityInput,
  onChangeQuantityText,
  onCommitQuantityInput,
  onSelectShipping,
  onUpdateQuantity,
  onToggleInstallation,
  showModal,
}: {
  item: CartLine;
  validation: CartValidationResult;
  selectedShipping?: ShippingId;
  shippingFee?: number | null;
  quantityInput: string;
  onChangeQuantityText: (text: string) => void;
  onCommitQuantityInput: () => void;
  onSelectShipping: (id: ShippingId) => void;
  onUpdateQuantity: (productId: string, qty: number) => void;
  onToggleInstallation: (productId: string, value: boolean) => void;
  showModal: (opts: { title?: string; message: string; mode?: 'noti'|'confirm'|'toast'; onConfirm?: () => void; }) => void;
}) {
  const canIncrease =
    validation.canCheckout &&
    (validation.stock === null || Number(item.quantity) < validation.stock);

  const canDecrease = validation.canCheckout && Number(item.quantity) > 1;
  const installSupported = supportsInstallation(item);

  const increase = () => {
    if (!validation.canCheckout) {
      showModal({ title: 'Không thể cập nhật', message: validation.errors[0] ?? 'Sản phẩm không hợp lệ', mode: 'noti' });
      return;
    }

    const nextQty = Number(item.quantity || 1) + 1;

    if (validation.stock !== null && nextQty > validation.stock) {
      showModal({ title: 'Vượt tồn kho', message: `Chỉ còn ${validation.stock} sản phẩm trong kho`, mode: 'noti' });
      return;
    }

    onUpdateQuantity(item.product_id, nextQty);
  };

  const decrease = () => {
    if (!validation.canCheckout) {
      showModal({ title: 'Không thể cập nhật', message: validation.errors[0] ?? 'Sản phẩm không hợp lệ', mode: 'noti' });
      return;
    }

    const current = Number(item.quantity || 1);

    if (current <= 1) {
      showModal({ title: 'Số lượng tối thiểu', message: 'Số lượng tối thiểu là 1.', mode: 'noti' });
      return;
    }

    onUpdateQuantity(item.product_id, current - 1);
  };

  return (
    <View style={styles.itemBlock}>
      <View style={styles.itemRowInline}>
        <Image
          source={
            item.thumnail_url
              ? { uri: item.thumnail_url }
              : require('../../assets/placeholderAvatar.png')
          }
          style={styles.thumbSmall}
        />

        <View style={styles.itemInfoInline}>
          <Text style={styles.itemName} numberOfLines={2}>
            {item.product_name}
          </Text>

          <Text style={styles.itemPriceUnit}>{formatVND(Number(item.price || 0))}</Text>

          <View style={styles.badgeRow}>
            <View
              style={[
                styles.smallBadge,
                validation.isOutOfStock ? styles.badgeRed : styles.badgeGreen,
              ]}
            >
              <Text style={[
                styles.smallBadgeText,
                validation.isOutOfStock ? styles.smallBadgeTextRed : styles.smallBadgeTextGreen,
              ]}>
                {getStockLabel(validation)}
              </Text>
            </View>

            <View
              style={[
                styles.smallBadge,
                validation.isExpired || validation.isMissingExpiry
                  ? styles.badgeRed
                  : validation.isNearExpiry
                    ? styles.badgeOrange
                    : styles.badgeGreen,
              ]}
            >
              <Text
                style={[
                  styles.smallBadgeText,
                  validation.isExpired || validation.isMissingExpiry
                    ? styles.smallBadgeTextRed
                    : validation.isNearExpiry
                      ? styles.smallBadgeTextOrange
                      : styles.smallBadgeTextGreen,
                ]}
              >
                {validation.requireExpiryDate ? 'HSD' : 'Hạn'}: {getExpiryLabel(validation)}
              </Text>
            </View>
          </View>

          <ProductValidationBadge validation={validation} />

          <InstallationControl
            item={item}
            installSupported={installSupported}
            onToggleInstallation={onToggleInstallation}
          />
        </View>

        <View style={styles.itemRightInline}>
          <View style={styles.qtyRowInline}>
            <TouchableOpacity
              style={[styles.qtyBtn, !canDecrease && styles.qtyBtnDisabled]}
              onPress={decrease}
              disabled={!canDecrease}
            >
              <Text style={[styles.qtyBtnText, !canDecrease && styles.qtyTextDisabled]}>−</Text>
            </TouchableOpacity>

            <TextInput
              value={quantityInput}
              onChangeText={onChangeQuantityText}
              onBlur={onCommitQuantityInput}
              onSubmitEditing={onCommitQuantityInput}
              keyboardType="number-pad"
              returnKeyType="done"
              editable={validation.canCheckout}
              style={styles.qtyInput}
            />

            <TouchableOpacity
              style={[styles.qtyBtn, !canIncrease && styles.qtyBtnDisabled]}
              onPress={increase}
              disabled={!canIncrease}
            >
              <Text style={[styles.qtyBtnText, !canIncrease && styles.qtyTextDisabled]}>+</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.itemPriceInline}>
            {formatVND(Number(item.price || 0) * Number(item.quantity || 0))}
          </Text>
        </View>
      </View>

      <View style={styles.productShippingContainer}>
        <ProductShippingOptions
          selected={selectedShipping}
          computedVendorShipping={shippingFee}
          onSelect={onSelectShipping}
        />
      </View>
    </View>
  );
}

function VendorCheckoutGroup({
  group,
  validations,
  selectedShippingByItem,
  setSelectedShippingByItem,
  computedShippingByVendor,
  qtyInputs,
  onChangeQuantityText,
  onCommitQuantityInput,
  onUpdateQuantity,
  onToggleInstallation,
  showModal,
}: {
  group: VendorGroup;
  validations: Record<string, CartValidationResult>;
  selectedShippingByItem: Record<string, ShippingId>;
  setSelectedShippingByItem: React.Dispatch<React.SetStateAction<Record<string, ShippingId>>>;
  computedShippingByVendor: Record<string, number | null>;
  qtyInputs: Record<string, string>;
  onChangeQuantityText: (productId: string, text: string) => void;
  onCommitQuantityInput: (productId: string) => void;
  onUpdateQuantity: (productId: string, qty: number) => void;
  onToggleInstallation: (productId: string, value: boolean) => void;
  showModal: (opts: { title?: string; message: string; mode?: 'noti'|'confirm'|'toast'; onConfirm?: () => void; }) => void;
}) {
  const invalidCount = group.items.filter(item => !validations[item.product_id]?.canCheckout).length;
  const installSupportedCount = group.items.filter(item => supportsInstallation(item)).length;

  return (
    <View style={styles.vendorSection}>
      <View style={styles.card}>
        <View style={styles.vendorHeaderRow}>
          <View style={styles.flex1}>
            <Text style={styles.vendorTitle}>{group.shopName}</Text>

            <Text style={styles.vendorShippingText}>
              {computedShippingByVendor[group.shopId] != null
                ? computedShippingByVendor[group.shopId] === 0
                  ? 'Phí vận chuyển: Miễn phí'
                  : `Phí vận chuyển: ${formatVND(computedShippingByVendor[group.shopId] as number)}`
                : 'Đang tính phí vận chuyển...'}
            </Text>

            <Text style={styles.vendorInstallText}>
              {installSupportedCount}/{group.items.length} sản phẩm hỗ trợ lắp đặt
            </Text>
          </View>

          <View style={invalidCount > 0 ? styles.vendorBadgeError : styles.vendorBadgeOk}>
            <Text style={invalidCount > 0 ? styles.vendorBadgeErrorText : styles.vendorBadgeOkText}>
              {invalidCount > 0 ? `${invalidCount} lỗi` : 'Hợp lệ'}
            </Text>
          </View>
        </View>

        {group.items.map(item => (
          <CheckoutItem
            key={item.product_id}
            item={item}
            validation={validations[item.product_id]}
            selectedShipping={selectedShippingByItem[item.product_id]}
            shippingFee={computedShippingByVendor[group.shopId]}
            quantityInput={qtyInputs[item.product_id] ?? String(item.quantity ?? 1)}
            onChangeQuantityText={text => onChangeQuantityText(item.product_id, text)}
            onCommitQuantityInput={() => onCommitQuantityInput(item.product_id)}
            onSelectShipping={id =>
              setSelectedShippingByItem(prev => ({
                ...prev,
                [item.product_id]: id,
              }))
            }
            onUpdateQuantity={onUpdateQuantity}
            onToggleInstallation={onToggleInstallation}
            showModal={showModal}
          />
        ))}
      </View>
    </View>
  );
}

function SummaryCard({
  total,
  shippingCharge,
}: {
  total: number;
  shippingCharge: number;
}) {
  return (
    <View style={styles.summaryCard}>
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Tạm tính</Text>
        <Text>{formatVND(total)}</Text>
      </View>

      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Phí vận chuyển</Text>
        <Text>{shippingCharge > 0 ? formatVND(shippingCharge) : 'Miễn phí'}</Text>
      </View>

      <View style={styles.summaryDivider} />

      <View style={styles.summaryRowTop}>
        <Text style={styles.summaryLabelBold}>Tổng cộng</Text>
        <Text style={styles.summaryValueBold}>{formatVND(total + shippingCharge)}</Text>
      </View>
    </View>
  );
}

function FooterContent({
  total,
  shippingCharge,
  onConfirm,
  busy,
  disabled,
}: {
  total: number;
  shippingCharge: number;
  onConfirm: () => void;
  busy?: boolean;
  disabled?: boolean;
}) {
  return (
    <View style={styles.footerBar}>
      <View style={styles.flex1PaddingRight12}>
        <Text style={styles.footerLabel}>Tổng thanh toán</Text>
        <Text style={styles.footerTotal}>{formatVND(total + shippingCharge)}</Text>
      </View>

      <TouchableOpacity
        style={[styles.orderBtn, (busy || disabled) && styles.orderBtnBusy]}
        onPress={onConfirm}
        disabled={!!busy || !!disabled}
      >
        {busy ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.orderBtnText}>Đặt hàng</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

export default function CheckoutScreen() {
  const navigation: any = useNavigation();
  const route: any = useRoute();

  const {
    lines,
    removeFromCart,
    updateQuantity,
    setInstallationRequest,
    loadCart,
  } = useCart();

  const routeItems = route.params?.items;

  const selectedProductIds = useMemo(() => {
    if (!Array.isArray(routeItems) || routeItems.length === 0) return null;
    return routeItems.map((item: any) => item.product_id);
  }, [routeItems]);

  const checkoutLines = useMemo(() => {
    if (selectedProductIds && selectedProductIds.length > 0) {
      return lines.filter(item => selectedProductIds.includes(item.product_id));
    }

    return lines;
  }, [lines, selectedProductIds]);

  const [selectedShippingByItem, setSelectedShippingByItem] = useState<Record<string, ShippingId>>({});
  const [selectedPayment, setSelectedPayment] = useState<PaymentId>('pilapay');
  const [selectedAddress, setSelectedAddress] = useState<any | undefined>(route.params?.selectedAddress);
  const [isPlacing, setIsPlacing] = useState(false);
  const [shippingLoading, setShippingLoading] = useState(false);

  const [wallet, setWallet] = useState<any | null>(null);
  const [computedShippingByVendor, setComputedShippingByVendor] = useState<Record<string, number | null>>({});
  const [qtyInputs, setQtyInputs] = useState<Record<string, string>>({});

  // ModalPopup state for confirmations/notifications
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

  const validations = useMemo<Record<string, CartValidationResult>>(() => {
    const result: Record<string, CartValidationResult> = {};

    for (const item of checkoutLines) {
      result[item.product_id] = validateCartItem(item);
    }

    return result;
  }, [checkoutLines]);

  const invalidItems = useMemo(() => {
    return checkoutLines.filter(item => !validations[item.product_id]?.canCheckout);
  }, [checkoutLines, validations]);

  const totalPrice = useMemo(() => {
    return checkoutLines.reduce((sum, item) => {
      return sum + Number(item.price || 0) * Number(item.quantity || 0);
    }, 0);
  }, [checkoutLines]);

  const displayShippingCharge = sumShippingMap(computedShippingByVendor);

  const groups = useMemo<VendorGroup[]>(() => {
    const map: Record<string, VendorGroup> = {};

    for (const item of checkoutLines) {
      const shopId = getVendorId(item);
      const shopName = getVendorName(item);

      if (!map[shopId]) {
        map[shopId] = {
          shopId,
          shopName,
          items: [],
        };
      }

      map[shopId].items.push(item);
    }

    return Object.values(map);
  }, [checkoutLines]);

  const supportedInstallItems = useMemo(() => {
    return checkoutLines.filter(item => supportsInstallation(item));
  }, [checkoutLines]);

  const allInstallation =
    supportedInstallItems.length > 0 &&
    supportedInstallItems.every(item => item.installationRequest);

  React.useEffect(() => {
    (async () => {
      const result = await fetchMyWallet();
      if (result.ok) setWallet(result.data);
    })();
  }, []);

  React.useEffect(() => {
    setSelectedShippingByItem(prev => {
      const next = { ...prev };

      for (const item of checkoutLines) {
        if (!next[item.product_id]) {
          next[item.product_id] = 'fast';
        }
      }

      return next;
    });
  }, [checkoutLines]);

  React.useEffect(() => {
    const next: Record<string, string> = {};

    for (const item of checkoutLines) {
      next[item.product_id] = String(item.quantity ?? 1);
    }

    setQtyInputs(next);
  }, [checkoutLines]);

  React.useEffect(() => {
    (async () => {
      if (!selectedAddress) {
        setComputedShippingByVendor({});
        return;
      }

      if (!checkoutLines || checkoutLines.length === 0) {
        setComputedShippingByVendor({});
        return;
      }

      const groupByVendor: Record<string, CartLine[]> = {};

      for (const item of checkoutLines) {
        const vendorId = getVendorId(item);
        groupByVendor[vendorId] = groupByVendor[vendorId] || [];
        groupByVendor[vendorId].push(item);
      }

      const vendorIds = Object.keys(groupByVendor).filter(id => id && id !== 'unknown');

      if (vendorIds.length === 0) {
        setComputedShippingByVendor({ unknown: 0 });
        return;
      }

      const defaultDims = {
        height: 10,
        length: 20,
        width: 15,
        weight: 500,
      };

      const getNum = (obj: any, keys: string[], fallback: number) => {
        for (const key of keys) {
          const value = obj?.[key];
          if (value === undefined || value === null) continue;

          const numberValue = Number(value);
          if (!Number.isNaN(numberValue)) return numberValue;
        }

        return fallback;
      };

      const next: Record<string, number | null> = {};
      setShippingLoading(true);

      try {
        await Promise.all(
          vendorIds.map(async vendorId => {
            const vendorLines = groupByVendor[vendorId] || [];

            let totalQuantity = 0;
            let totalWeight = 0;
            let maxHeight = 0;
            let maxLength = 0;
            let maxWidth = 0;

            for (const item of vendorLines) {
              const validation = validations[item.product_id];
              if (!validation?.canCheckout) continue;

              const chosen = selectedShippingByItem[item.product_id] ?? 'fast';
              if (chosen !== 'fast') continue;

              const quantity = Math.max(1, Math.floor(Number(item.quantity) || 1));
              const raw = item.raw ?? {};

              const weight = getNum(
                raw,
                ['weight', 'packageWeight', 'weightInGrams', 'weight_g', 'grams', 'package_weight'],
                defaultDims.weight,
              );

              const height = getNum(raw, ['height', 'packageHeight', 'h'], defaultDims.height);
              const length = getNum(raw, ['length', 'packageLength', 'l'], defaultDims.length);
              const width = getNum(raw, ['width', 'packageWidth', 'w'], defaultDims.width);

              totalQuantity += quantity;
              totalWeight += weight * quantity;

              if (height > maxHeight) maxHeight = height;
              if (length > maxLength) maxLength = length;
              if (width > maxWidth) maxWidth = width;
            }

            if (totalQuantity === 0) {
              next[vendorId] = 0;
              return;
            }

            const requestPayload = {
              serviceTypeId: 2,
              vendorId,
              addressId: selectedAddress.addressId,
              height: Math.max(1, Math.floor(maxHeight) || defaultDims.height),
              length: Math.max(1, Math.floor(maxLength) || defaultDims.length),
              width: Math.max(1, Math.floor(maxWidth) || defaultDims.width),
              weight: Math.max(1, Math.floor(totalWeight) || defaultDims.weight),
              quantity: Math.max(1, Math.floor(totalQuantity)),
            };

            try {
              const response = await calculateShippingFee(requestPayload as any);
              next[vendorId] = Number(response.total ?? 0);
            } catch (err: any) {
              console.warn(
                '[Checkout] Calc shipping failed for vendor',
                vendorId,
                err?.response?.data ?? err?.message ?? err,
              );

              next[vendorId] = 0;
            }
          }),
        );
      } finally {
        setComputedShippingByVendor(next);
        setShippingLoading(false);
      }
    })();
  }, [selectedAddress, checkoutLines, selectedShippingByItem, validations]);

  const onUpdateQuantitySafe = async (productId: string, qty: number) => {
    const item = checkoutLines.find(x => x.product_id === productId);
    const validation = validations[productId];

    if (!item || !validation) return;

    if (!validation.canCheckout) {
      showModal({ title: 'Không thể cập nhật', message: validation.errors[0] ?? 'Sản phẩm không hợp lệ', mode: 'noti' });
      return;
    }

    let nextQty = Math.max(1, Math.floor(Number(qty) || 1));

    if (validation.stock !== null && nextQty > validation.stock) {
      nextQty = validation.stock;
      showModal({ title: 'Vượt tồn kho', message: `Chỉ còn ${validation.stock} sản phẩm trong kho`, mode: 'noti' });
    }

    setQtyInputs(prev => ({
      ...prev,
      [productId]: String(nextQty),
    }));

    await updateQuantity(productId, nextQty);
    await loadCart();
  };

  const onChangeQuantityText = (productId: string, text: string) => {
    const clean = text.replace(/[^0-9]/g, '');
    const validation = validations[productId];

    if (clean.length === 0) {
      setQtyInputs(prev => ({
        ...prev,
        [productId]: '',
      }));
      return;
    }

    let nextQty = parseInt(clean, 10);

    if (!Number.isFinite(nextQty) || nextQty <= 0) {
      nextQty = 1;
    }

    if (validation?.stock !== null && validation?.stock !== undefined && nextQty > validation.stock) {
      nextQty = validation.stock;
      showModal({ title: 'Vượt tồn kho', message: `Chỉ còn ${validation.stock} sản phẩm trong kho`, mode: 'noti' });
    }

    setQtyInputs(prev => ({
      ...prev,
      [productId]: String(nextQty),
    }));
  };

  const commitQuantityInput = async (productId: string) => {
    const raw = qtyInputs[productId] ?? '1';
    const validation = validations[productId];

    let nextQty = parseInt(raw || '1', 10);

    if (!Number.isFinite(nextQty) || nextQty <= 0) {
      nextQty = 1;
    }

    if (validation?.stock !== null && validation?.stock !== undefined && nextQty > validation.stock) {
      nextQty = validation.stock;
      showModal({ title: 'Vượt tồn kho', message: `Chỉ còn ${validation.stock} sản phẩm trong kho`, mode: 'noti' });
    }

    setQtyInputs(prev => ({
      ...prev,
      [productId]: String(nextQty),
    }));

    await onUpdateQuantitySafe(productId, nextQty);
  };

  const onToggleInstallationSafe = async (productId: string, value: boolean) => {
    const item = checkoutLines.find(x => x.product_id === productId);
    if (!item) return;

    if (!supportsInstallation(item)) {
      showModal({ title: 'Không hỗ trợ', message: 'Sản phẩm này không hỗ trợ lắp đặt.', mode: 'noti' });
      return;
    }

    await setInstallationRequest(productId, value);
    await loadCart();
  };

  const toggleAllInstallation = async (value: boolean) => {
    if (supportedInstallItems.length === 0) {
      showModal({ title: 'Không có sản phẩm hỗ trợ', message: 'Không có sản phẩm nào hỗ trợ lắp đặt.', mode: 'noti' });
      return;
    }

    for (const item of supportedInstallItems) {
      await setInstallationRequest(item.product_id, value);
    }

    await loadCart();
  };

  const validateBeforeOrder = () => {
    if (checkoutLines.length === 0) {
      showModal({ title: 'Giỏ hàng trống', message: 'Không có sản phẩm để thanh toán.', mode: 'noti' });
      return false;
    }

    if (invalidItems.length > 0) {
      const first = invalidItems[0];

      const reason =
        validations[first.product_id]?.errors?.[0] ??
        'Có sản phẩm không đủ điều kiện đặt hàng.';

      showModal({ title: 'Sản phẩm chưa hợp lệ', message: reason, mode: 'noti' });
      return false;
    }

    if (!selectedAddress) {
      showModal({ title: 'Thiếu địa chỉ', message: 'Vui lòng chọn địa chỉ giao hàng.', mode: 'noti' });
      return false;
    }

    if (!selectedAddress.addressId) {
      showModal({ title: 'Địa chỉ không hợp lệ', message: 'Địa chỉ giao hàng thiếu mã addressId.', mode: 'noti' });
      return false;
    }

    if (!selectedAddress.receiverName || !selectedAddress.receiverPhone || !selectedAddress.addressLine) {
      showModal({ title: 'Địa chỉ chưa đầy đủ', message: 'Vui lòng kiểm tra lại tên, số điện thoại và địa chỉ nhận hàng.', mode: 'noti' });
      return false;
    }

    if (shippingLoading) {
      showModal({ title: 'Đang tính phí vận chuyển', message: 'Vui lòng đợi hệ thống tính xong phí vận chuyển.', mode: 'noti' });
      return false;
    }

    const vendorIds = Array.from(
      new Set(
        checkoutLines
          .map(item => getVendorId(item))
          .filter(id => id && id !== 'unknown'),
      ),
    );

    if (vendorIds.length === 0) {
      showModal({ title: 'Thiếu nhà bán', message: 'Có sản phẩm thiếu thông tin nhà bán, không thể đặt hàng.', mode: 'noti' });
      return false;
    }

    const missingShipping = vendorIds.some(id => {
      return computedShippingByVendor[id] === null || computedShippingByVendor[id] === undefined;
    });

    if (missingShipping) {
      showModal({ title: 'Thiếu phí vận chuyển', message: 'Vui lòng chọn địa chỉ và chờ hệ thống tính phí vận chuyển.', mode: 'noti' });
      return false;
    }

    const grandTotal = totalPrice + displayShippingCharge;

    if (selectedPayment === 'pilapay' && wallet) {
      const available = Number(wallet.availableVND ?? wallet.available ?? 0);

      if (available < grandTotal) {
        showModal({
          title: 'Số dư không đủ',
          message: `Số dư khả dụng hiện tại là ${formatVND(available)}. Vui lòng nạp thêm.`,
          mode: 'confirm',
          onConfirm: () => navigation.navigate('Wallet'),
        });

        return false;
      }
    }

    return true;
  };

  const createOrderNow = async () => {
    const groupByVendor: Record<string, CartLine[]> = {};

    for (const item of checkoutLines) {
      const vendorId = getVendorId(item);
      groupByVendor[vendorId] = groupByVendor[vendorId] || [];
      groupByVendor[vendorId].push(item);
    }

    const vendorShippings = Object.keys(groupByVendor)
      .filter(vendorId => vendorId && vendorId !== 'unknown')
      .map(vendorId => ({
        vendorId,
        shippingFee: computedShippingByVendor[vendorId] ?? 0,
      }));

    const sanitizedItems = checkoutLines.map((item: any) => {
      const requested = Boolean(item.installationRequest) && supportsInstallation(item);

      return {
        productId: item.product_id,
        quantity: Number(item.quantity),
        discountAmount: 0,
        installationRequest: requested,
      };
    });

    const payload = {
      recipientName: selectedAddress.receiverName,
      recipientPhone: selectedAddress.receiverPhone,
      shippingAddress: selectedAddress.addressLine,
      addressId: selectedAddress.addressId,

      items: sanitizedItems,

      discountAmount: 0,
      vendorShippings,

      paymentMethod:
        selectedPayment === 'pilapay'
          ? 'WALLET'
          : selectedPayment === 'card'
            ? 'CARD'
            : 'COD',

      notes: '',
    };

    console.log('[Checkout] createOrder payload', payload);

    try {
      setIsPlacing(true);

      const created = await createOrder(payload as any);

      console.log('[Checkout] createOrder response', created);

      for (const item of checkoutLines) {
        await removeFromCart(item.product_id);
      }

      await loadCart();

      navigation.navigate('OrderSuccess' as never, { orders: created } as never);
    } catch (err: any) {
      console.warn('Order create error', err);

      const apiError = err?.response?.data;
      const message = apiError?.message || 'Không thể tạo đơn hàng';

      if (
        apiError?.errorCode === 'INSUFFICIENT_BALANCE' ||
        (err?.response?.status === 400 && String(message).toLowerCase().includes('insufficient'))
      ) {
        showModal({ title: 'Số dư không đủ', message, mode: 'confirm', onConfirm: () => navigation.navigate('Wallet') });
      } else {
        showModal({ title: 'Lỗi', message, mode: 'noti' });
      }
    } finally {
      setIsPlacing(false);
    }
  };

  const onConfirm = () => {
    if (!validateBeforeOrder()) return;

    const paymentText =
      selectedPayment === 'pilapay'
        ? 'PilaPay'
        : selectedPayment === 'cod'
          ? 'Thanh toán khi nhận hàng'
          : 'Thẻ';

    showModal({
      title: 'Xác nhận đặt hàng',
      message: `Bạn có chắc muốn đặt đơn hàng này?\n\nSố sản phẩm: ${checkoutLines.length}\nPhương thức: ${paymentText}\nTổng thanh toán: ${formatVND(totalPrice + displayShippingCharge)}`,
      mode: 'confirm',
      onConfirm: createOrderNow,
    });
  };

  if (checkoutLines.length === 0) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBackBtn}>
            <Ionicons name="arrow-back" size={22} color="#0F172A" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Thanh Toán</Text>

          <View style={styles.headerPlaceholder} />
        </View>

        <View style={styles.emptyWrap}>
          <Ionicons name="cart-outline" size={48} color="#CD853F" />

          <Text style={styles.emptyTitle}>Không có sản phẩm</Text>

          <Text style={styles.emptyDesc}>
            Vui lòng quay lại giỏ hàng và chọn sản phẩm.
          </Text>

          <TouchableOpacity style={styles.backToCartBtn} onPress={() => navigation.navigate('Cart')}>
            <Text style={styles.backToCartText}>Quay lại giỏ hàng</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBackBtn}>
          <Ionicons name="arrow-back" size={22} color="#0F172A" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Thanh Toán</Text>

        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin giao hàng</Text>

          <AddressCard
            address={selectedAddress}
            onPress={() =>
              navigation.navigate('AddressList', {
                onSelect: (address: any) => setSelectedAddress(address),
              })
            }
          />
        </View>

        <View style={styles.section}>
          <TouchableOpacity
            onPress={() => toggleAllInstallation(!allInstallation)}
            style={[
              styles.allInstallRow,
              supportedInstallItems.length === 0 ? styles.allInstallDisabled : null,
            ]}
            disabled={supportedInstallItems.length === 0}
          >
            <View style={styles.allInstallLeft}>
              <View style={[styles.allInstallBox, allInstallation ? styles.allInstallBoxOn : null]}>
                {allInstallation ? <Text style={styles.allInstallTick}>✓</Text> : null}
              </View>

              <View style={styles.flex1}>
                <Text style={styles.allInstallLabel}>
                  Chọn lắp đặt cho sản phẩm hỗ trợ
                </Text>

                <Text style={styles.allInstallSub}>
                  {supportedInstallItems.length > 0
                    ? `${supportedInstallItems.length}/${checkoutLines.length} sản phẩm hỗ trợ lắp đặt`
                    : 'Không có sản phẩm nào hỗ trợ lắp đặt'}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {invalidItems.length > 0 ? (
          <View style={styles.section}>
            <View style={styles.warningCard}>
              <Ionicons name="alert-circle-outline" size={20} color="#B91C1C" />

              <View style={styles.flex1MarginLeft8}>
                <Text style={styles.warningTitle}>Có sản phẩm cần kiểm tra</Text>

                <Text style={styles.warningDesc}>
                  Một số sản phẩm có thể hết hàng, hết hạn, vượt tồn kho, thiếu nhà bán hoặc giá không hợp lệ.
                </Text>
              </View>
            </View>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sản phẩm đã chọn</Text>

          {groups.map(group => (
            <VendorCheckoutGroup
              key={group.shopId}
              group={group}
              validations={validations}
              selectedShippingByItem={selectedShippingByItem}
              setSelectedShippingByItem={setSelectedShippingByItem}
              computedShippingByVendor={computedShippingByVendor}
              qtyInputs={qtyInputs}
              onChangeQuantityText={onChangeQuantityText}
              onCommitQuantityInput={commitQuantityInput}
              onUpdateQuantity={onUpdateQuantitySafe}
              onToggleInstallation={onToggleInstallationSafe}
              showModal={showModal}
            />
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Phương thức thanh toán</Text>

          <View style={styles.card}>
            <PaymentOption
              id="pilapay"
              title="PilaPay"
              subtitle="Thanh toán bằng số dư ví"
              icon="wallet-outline"
              selected={selectedPayment}
              onSelect={setSelectedPayment}
            />

            <PaymentOption
              id="cod"
              title="Thanh toán khi nhận hàng"
              subtitle="Trả tiền mặt khi nhận sản phẩm"
              icon="cash-outline"
              selected={selectedPayment}
              onSelect={setSelectedPayment}
            />
          </View>
        </View>

        <View style={styles.section}>
          <WalletRowComponent wallet={wallet} selectedPayment={selectedPayment} />
        </View>

        <View style={styles.footerSpacing}>
          <SummaryCard total={totalPrice} shippingCharge={displayShippingCharge} />
        </View>
      </ScrollView>

      <FooterContent
        total={totalPrice}
        shippingCharge={displayShippingCharge}
        onConfirm={onConfirm}
        busy={isPlacing}
        disabled={invalidItems.length > 0 || shippingLoading}
      />
      <ModalPopup
        {...(modalState as any)}
        titleText={modalState.title}
        contentText={modalState.message}
        onClose={closeModal}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFF9F3' },
  flex1: { flex: 1 },
  flex1PaddingRight12: { flex: 1, paddingRight: 12 },
  flex1MarginLeft8: { flex: 1, marginLeft: 8 },
  smallBadgeTextGreen: { color: '#047857' },
  smallBadgeTextRed: { color: '#B91C1C' },
  smallBadgeTextOrange: { color: '#C2410C' },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingTop: 18,
  },
  headerBackBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F1E7DC',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '800',
    color: '#8B3F2D',
  },
  headerPlaceholder: { width: 42 },

  listContent: { paddingBottom: 150 },
  section: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 },
  sectionTitle: {
    fontWeight: '800',
    fontSize: 16,
    marginBottom: 8,
    color: '#0F172A',
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#F1E7DC',
  },

  addressRow: { flexDirection: 'row', alignItems: 'center' },
  locationIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  changeText: { color: '#2563EB', fontWeight: '700' },
  addressName: { fontWeight: '800', fontSize: 15, color: '#0F172A' },
  addressText: { color: '#6B7280', marginTop: 4 },
  addressBody: { flex: 1, marginLeft: 12 },

  vendorSection: { marginBottom: 14 },
  vendorHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  vendorTitle: { fontWeight: '800', fontSize: 15, color: '#0F172A' },
  vendorShippingText: { color: '#6B7280', marginTop: 4, fontSize: 12 },
  vendorInstallText: { color: '#94A3B8', marginTop: 3, fontSize: 11, fontWeight: '700' },
  vendorBadgeOk: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
  },
  vendorBadgeOkText: { color: '#047857', fontWeight: '800', fontSize: 11 },
  vendorBadgeError: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
  },
  vendorBadgeErrorText: { color: '#B91C1C', fontWeight: '800', fontSize: 11 },

  itemBlock: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 10,
    marginTop: 10,
  },
  itemRowInline: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  thumbSmall: {
    width: 62,
    height: 62,
    borderRadius: 10,
    resizeMode: 'cover',
    backgroundColor: '#F1F5F9',
  },
  itemInfoInline: { flex: 1, marginLeft: 12 },
  itemName: { fontWeight: '800', color: '#0F172A' },
  itemPriceUnit: { color: '#F97316', fontWeight: '800', marginTop: 4 },

  itemRightInline: { width: 104, alignItems: 'flex-end' },
  qtyRowInline: { flexDirection: 'row', alignItems: 'center' },
  qtyBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  qtyBtnDisabled: { backgroundColor: '#F1F5F9' },
  qtyBtnText: { fontSize: 18, color: '#111' },
  qtyTextDisabled: { color: '#CBD5E1' },
  qtyInput: {
    marginHorizontal: 6,
    minWidth: 32,
    height: 32,
    textAlign: 'center',
    fontWeight: '800',
    color: '#0F172A',
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  itemPriceInline: { fontWeight: '800', marginTop: 8, color: '#0F172A' },

  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  smallBadge: {
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 999,
    marginRight: 6,
    marginBottom: 6,
  },
  smallBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  badgeGreen: { backgroundColor: '#ECFDF5' },
  badgeRed: { backgroundColor: '#FEE2E2' },
  badgeOrange: { backgroundColor: '#FFEDD5' },

  validationBox: {
    marginTop: 4,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 7,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  validationOk: { backgroundColor: '#ECFDF5' },
  validationWarning: { backgroundColor: '#FFF7ED' },
  validationError: { backgroundColor: '#FEE2E2' },
  validationText: {
    marginLeft: 6,
    fontSize: 11,
    fontWeight: '700',
    flex: 1,
  },

  installArea: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  installLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '700',
    marginBottom: 4,
  },
  installChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 6,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  installChipOn: {
    backgroundColor: '#ECFDF5',
    borderColor: '#BBF7D0',
  },
  installChipDisabled: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    opacity: 0.8,
  },
  installChipText: {
    marginLeft: 5,
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
  },
  installChipTextOn: {
    color: '#047857',
  },
  installChipTextDisabled: {
    color: '#94A3B8',
  },

  productShippingContainer: {
    marginLeft: 74,
    marginRight: 6,
    paddingTop: 8,
    paddingBottom: 4,
  },
  productShippingCard: {
    marginTop: 6,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 8,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    elevation: 1,
    overflow: 'hidden',
  },

  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginBottom: 6,
    backgroundColor: '#fff',
    width: '100%',
  },
  optionSelected: {
    backgroundColor: '#E6F7FF',
    borderColor: '#D1EFFF',
    borderWidth: 1,
  },
  optionLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  optionTextWrap: { marginLeft: 10, flex: 1 },
  optionTitle: { fontWeight: '700', fontSize: 14, color: '#0F172A' },
  optionSub: { color: '#6B7280', marginTop: 2, fontSize: 13 },
  optionPrice: {
    color: '#007AFF',
    fontWeight: '700',
    minWidth: 56,
    textAlign: 'right',
    flexShrink: 0,
    fontSize: 14,
  },

  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  paymentOptionSelected: {
    backgroundColor: '#FFF7ED',
    borderColor: '#CD853F',
  },
  paymentIconBox: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },

  radioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2563EB',
  },
  radioSelected: { borderColor: '#2563EB' },

  footerSpacing: { paddingHorizontal: 16, paddingBottom: 24 },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    elevation: 2,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#F1E7DC',
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  summaryRowTop: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  summaryLabel: { color: '#6B7280' },
  summaryLabelBold: { color: '#6B7280', fontWeight: '700' },
  summaryValueBold: { fontWeight: '800', fontSize: 18, color: '#8B3F2D' },
  summaryDivider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 8 },

  footerBar: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 16,
    backgroundColor: '#F6E6CF',
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 6,
  },
  footerLabel: { color: '#6B7280' },
  footerTotal: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  orderBtn: {
    backgroundColor: '#8B3F2D',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    minWidth: 108,
    alignItems: 'center',
  },
  orderBtnText: { color: '#fff', fontWeight: '800' },
  orderBtnBusy: { opacity: 0.6 },

  allInstallRow: { paddingVertical: 8 },
  allInstallLeft: { flexDirection: 'row', alignItems: 'center' },
  allInstallBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  allInstallBoxOn: { backgroundColor: '#0B8F3B', borderColor: '#0B8F3B' },
  allInstallTick: { color: '#fff', fontWeight: '700' },
  allInstallLabel: { marginLeft: 10, fontWeight: '700', color: '#0F172A' },
  allInstallSub: {
    marginLeft: 10,
    marginTop: 2,
    fontSize: 12,
    color: '#64748B',
  },
  allInstallDisabled: {
    opacity: 0.6,
  },

  warningCard: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
    padding: 12,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  warningTitle: { color: '#B91C1C', fontWeight: '800' },
  warningDesc: { color: '#991B1B', fontSize: 12, lineHeight: 18, marginTop: 3 },

  walletRow: {
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F1E7DC',
    flexDirection: 'row',
    alignItems: 'center',
  },
  walletText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
    fontWeight: '700',
  },

  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  emptyTitle: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  emptyDesc: {
    marginTop: 8,
    color: '#64748B',
    textAlign: 'center',
  },
  backToCartBtn: {
    marginTop: 18,
    backgroundColor: '#8B3F2D',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backToCartText: {
    color: '#fff',
    fontWeight: '800',
  },
});