import React, { useMemo, useRef, useState } from 'react';
import {
  Image,
  Pressable,
  Text,
  View,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';

import { ProductType } from '../../../utils/ProductType';
import { formatVND } from '../../../utils/number';
import placeholderThumb from '../../../assets/placeholderAvatar.png';
import { useCart } from '../../../context/CartContext';
import { normalizeImageUrl } from '../../../services/products';
import {
  getStockLabel,
  validateCartItem,
} from '../../Shop/utils/cartValidation';

type ToastType = 'success' | 'error' | 'info';

type Props = {
  item: ProductType | any;
  onPress: () => void;
  onNotify?: (message: string, type?: ToastType) => void;
};

const COLORS = {
  orange: '#F97316',
  amber: '#F59E0B',
};

const getProductId = (item: any): string => {
  return String(
    item.productId ??
      item.product_id ??
      item.raw?.productId ??
      item.raw?.product_id ??
      item.raw?.id ??
      '',
  );
};

const getProductName = (item: any): string => {
  return String(
    item.name ??
      item.product_name ??
      item.raw?.name ??
      item.raw?.productName ??
      item.raw?.product_name ??
      'Sản phẩm',
  );
};

const getProductImage = (item: any): string | undefined => {
  return normalizeImageUrl(
    item.thumbnailUrl ??
      item.thumnail_url ??
      item.imageUrl ??
      item.raw?.thumbnailUrl ??
      item.raw?.thumnail_url ??
      item.raw?.imageUrl,
  );
};

const buildRawForCart = (item: any) => {
  return {
    ...(item.raw ?? {}),

    categoryName:
      item.raw?.categoryName ??
      item.raw?.category_name ??
      item.categoryName ??
      item.category_name ??
      item.category,

    stockQuantity:
      item.raw?.stockQuantity ??
      item.raw?.stock_quantity ??
      item.stockQuantity ??
      item.stock_quantity ??
      item.stock,

    expiryDate:
      item.raw?.expiryDate ??
      item.raw?.expiry_date ??
      item.expiryDate ??
      item.expiry_date ??
      item.expirationDate ??
      item.expiration_date,

    vendorId:
      item.raw?.vendorId ??
      item.raw?.vendor_id ??
      item.vendorId ??
      item.vendor_id ??
      item.shopId ??
      item.shop_id,

    vendorBusinessName:
      item.raw?.vendorBusinessName ??
      item.raw?.vendor_business_name ??
      item.vendorBusinessName ??
      item.vendor_business_name ??
      item.shopName ??
      item.shop_name,

    status:
      item.raw?.status ??
      item.raw?.productStatus ??
      item.status ??
      item.productStatus,

    installationSupported:
      item.raw?.installationSupported ??
      item.raw?.installation_supported ??
      item.installationSupported ??
      item.installation_supported,
  };
};

const CardProduct = ({ item, onPress, onNotify }: Props) => {
  const { addToCart } = useCart();

  const addingRef = useRef(false);
  const [adding, setAdding] = useState(false);

  const productId = getProductId(item);
  const productName = getProductName(item);
  const imageUrl = getProductImage(item);
  const price = Number(item.price ?? item.raw?.price ?? 0);

  const rating = Number(item.raw?.avgRating ?? item.avgRating ?? 0);
  const reviewCount = Number(item.raw?.reviewCount ?? item.reviewCount ?? 0);

  const rawForCart = useMemo(() => buildRawForCart(item), [item]);

  const cartLikeItem = useMemo(
    () => ({
      product_id: productId,
      product_name: productName,
      thumnail_url: imageUrl,
      price,
      quantity: 1,
      raw: rawForCart,
    }),
    [productId, productName, imageUrl, price, rawForCart],
  );

  const validation = useMemo(() => {
    return validateCartItem(cartLikeItem as any);
  }, [cartLikeItem]);

  const installationSupported = Boolean(
    rawForCart.installationSupported ??
      rawForCart.installation_supported ??
      item.installationSupported ??
      item.installation_supported,
  );

  const canAddToCart =
    Boolean(productId) &&
    validation.canCheckout &&
    !adding &&
    !addingRef.current;

  const showToast = (message: string, type: ToastType = 'info') => {
    onNotify?.(message, type);
  };

  const onBuy = async () => {
    if (addingRef.current || adding) return;

    if (!productId) {
      showToast('Sản phẩm thiếu mã định danh', 'error');
      return;
    }

    if (!validation.canCheckout) {
      showToast(
        validation.errors?.[0] ?? 'Sản phẩm không đủ điều kiện thêm vào giỏ',
        'error',
      );
      return;
    }

    addingRef.current = true;
    setAdding(true);

    try {
      await addToCart(
        {
          product_id: productId,
          product_name: productName,
          thumnail_url: imageUrl,
          price,
          raw: rawForCart,
        },
        1,
      );

      showToast('Đã thêm vào giỏ hàng', 'success');
    } catch (e) {
      console.warn('addToCart from CardProduct failed', e);
      showToast('Không thể thêm vào giỏ', 'error');
    } finally {
      addingRef.current = false;
      setAdding(false);
    }
  };

  const stockBadgeBg = validation.isOutOfStock ? '#FEE2E2' : '#ECFDF5';
  const stockBadgeColor = validation.isOutOfStock ? '#B91C1C' : '#047857';

  const expiryBadgeBg =
    validation.isExpired || validation.isMissingExpiry
      ? '#FEE2E2'
      : validation.isNearExpiry
        ? '#FFEDD5'
        : '#ECFDF5';

  const expiryBadgeColor =
    validation.isExpired || validation.isMissingExpiry
      ? '#B91C1C'
      : validation.isNearExpiry
        ? '#C2410C'
        : '#047857';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        localStyles.card,
        {
          opacity: pressed ? 0.94 : 1,
          borderColor: validation.canCheckout ? '#F1E7DC' : '#FCA5A5',
        },
      ]}
    >
      <View style={localStyles.imageBox}>
        <Image
          source={imageUrl ? { uri: imageUrl } : (placeholderThumb as any)}
          style={localStyles.thumb}
          resizeMode="contain"
        />

        {installationSupported ? (
          <View style={[localStyles.badge, localStyles.installBadge]}>
            <Text style={localStyles.badgeText}>Lắp đặt</Text>
          </View>
        ) : null}

        {!validation.canCheckout ? (
          <View style={[localStyles.badge, localStyles.warningBadge]}>
            <Text style={localStyles.badgeText}>Cần kiểm tra</Text>
          </View>
        ) : null}

        {validation.isOutOfStock ? (
          <View style={localStyles.soldOutOverlay}>
            <View style={localStyles.soldOutPill}>
              <Text style={localStyles.soldOutText}>Hết hàng</Text>
            </View>
          </View>
        ) : null}
      </View>

      <View style={localStyles.content}>
        <Text style={localStyles.name} numberOfLines={2}>
          {productName}
        </Text>

        <View style={localStyles.ratingRow}>
          <Ionicons name="star" size={15} color={COLORS.amber} />
          <Text style={localStyles.ratingText}>{rating.toFixed(1)}</Text>
          <Text style={localStyles.reviewText}>({reviewCount})</Text>
        </View>

        <Text style={localStyles.price} numberOfLines={1}>
          {formatVND(price)}
        </Text>

        <View style={localStyles.badgeRow}>
          <View
            style={[
              localStyles.smallBadge,
              { backgroundColor: stockBadgeBg },
            ]}
          >
            <Ionicons
              name={
                validation.isOutOfStock
                  ? 'close-circle-outline'
                  : 'cube-outline'
              }
              size={13}
              color={stockBadgeColor}
            />
            <Text
              style={[
                localStyles.smallBadgeText,
                { color: stockBadgeColor },
              ]}
              numberOfLines={1}
            >
              {getStockLabel(validation)}
            </Text>
          </View>

          <View
            style={[
              localStyles.iconBadge,
              { backgroundColor: expiryBadgeBg },
            ]}
          >
            <Ionicons
              name={
                validation.isExpired || validation.isMissingExpiry
                  ? 'warning-outline'
                  : 'time-outline'
              }
              size={14}
              color={expiryBadgeColor}
            />
          </View>
        </View>

        <View style={localStyles.bottomRow}>
          <Text style={localStyles.vendorName} numberOfLines={1}>
            {validation.vendorName}
          </Text>

          <Pressable
            onPress={onBuy}
            disabled={!canAddToCart}
            style={[
              localStyles.cartButton,
              {
                backgroundColor: canAddToCart ? COLORS.orange : '#CBD5E1',
              },
            ]}
          >
            {adding ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="cart-outline" size={16} color="#fff" />
                <Text style={localStyles.cartText}>Thêm</Text>
              </>
            )}
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
};

const localStyles = StyleSheet.create({
  card: {
    width: '100%',
    height: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    elevation: 3,
  },

  imageBox: {
    height: 155,
    width: '100%',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },

  thumb: {
    width: '100%',
    height: '100%',
    backgroundColor: '#FFFFFF',
  },

  badge: {
    position: 'absolute',
    top: 10,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    zIndex: 10,
  },

  installBadge: {
    left: 10,
    backgroundColor: '#059669',
  },

  warningBadge: {
    right: 8,
    backgroundColor: '#EF0000',
  },

  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },

  soldOutOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  soldOutPill: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },

  soldOutText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },

  content: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
  },

  name: {
    color: '#0F172A',
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '800',
    minHeight: 40,
  },

  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },

  ratingText: {
    marginLeft: 5,
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '800',
  },

  reviewText: {
    marginLeft: 4,
    color: '#64748B',
    fontSize: 13,
  },

  price: {
    marginTop: 8,
    color: '#FF4B00',
    fontSize: 21,
    fontWeight: '900',
  },

  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },

  smallBadge: {
    height: 34,
    maxWidth: 96,
    paddingHorizontal: 9,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },

  smallBadgeText: {
    marginLeft: 5,
    fontSize: 12,
    fontWeight: '800',
  },

  iconBadge: {
    width: 38,
    height: 34,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },

  bottomRow: {
    marginTop: 'auto',
    paddingTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  vendorName: {
    flex: 1,
    color: '#64748B',
    fontSize: 13,
    marginRight: 8,
  },

  cartButton: {
    height: 42,
    minWidth: 82,
    borderRadius: 16,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  cartText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    marginLeft: 5,
  },
});

export default React.memo(CardProduct);