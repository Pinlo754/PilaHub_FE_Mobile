import React, { useMemo, useState } from 'react';
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
import Toast from '../../../components/Toast';
import { getExpiryLabel, getMainInvalidReason, getStockLabel, validateCartItem } from '../../Shop/utils/cartValidation';



type Props = {
  item: ProductType | any;
  onPress: () => void;
};

const COLORS = {
  primary: '#CD853F',
  orange: '#F97316',
  amber: '#F59E0B',
  text: '#0F172A',
  muted: '#64748B',
  border: '#E5E7EB',
  soft: '#FFF7ED',
  danger: '#EF4444',
  success: '#10B981',
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

const CardProduct = ({ item, onPress }: Props) => {
  const { addToCart } = useCart();

  const [adding, setAdding] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');

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
    !adding;

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastMsg(message);
    setToastType(type);
    setToastVisible(true);
  };

  const onBuy = async () => {
    if (!productId) {
      showToast('Sản phẩm thiếu mã định danh', 'error');
      return;
    }

    if (!validation.canCheckout) {
      showToast(validation.errors[0] ?? 'Sản phẩm không đủ điều kiện thêm vào giỏ', 'error');
      return;
    }

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
    <>
      <Pressable
        className="bg-white rounded-2xl overflow-hidden"
        onPress={onPress}
        style={({ pressed }) => [
          localStyles.card,
          {
            opacity: pressed ? 0.92 : 1,
            borderColor: validation.canCheckout ? '#F1E7DC' : '#FCA5A5',
          },
        ]}
      >
        <View className="relative">
          {installationSupported ? (
            <View style={localStyles.installBadge} className="bg-green-700 rounded-full px-2 py-1">
              <Text className="text-white text-[10px] font-bold">
                Lắp đặt
              </Text>
            </View>
          ) : null}

          {!validation.canCheckout ? (
            <View style={localStyles.warningBadge} className="bg-red-600 rounded-full px-2 py-1">
              <Text className="text-white text-[10px] font-bold">
                Cần kiểm tra
              </Text>
            </View>
          ) : null}

          <View className="h-[165px] bg-[#F8FAFC]">
            <Image
              source={imageUrl ? { uri: imageUrl } : (placeholderThumb as any)}
              style={localStyles.thumb}
              resizeMode="cover"
            />
          </View>

          {validation.isOutOfStock ? (
            <View style={localStyles.soldOutOverlay}>
              <View className="bg-black/70 px-3 py-2 rounded-full">
                <Text className="text-white text-xs font-extrabold">
                  Hết hàng
                </Text>
              </View>
            </View>
          ) : null}
        </View>

        <View className="p-3 flex-1">
          <Text className="text-[#0F172A] font-extrabold text-[14px] leading-5" numberOfLines={2}>
            {productName}
          </Text>

          <View className="flex-row items-center mt-2">
            <Ionicons name="star" size={14} color={COLORS.amber} />
            <Text className="ml-1 text-xs font-bold text-[#0F172A]">
              {rating.toFixed(1)}
            </Text>
            <Text className="ml-1 text-xs text-[#64748B]">
              ({reviewCount})
            </Text>
          </View>

          <Text className="text-orange-600 text-[17px] font-extrabold mt-2" numberOfLines={1}>
            {formatVND(price)}
          </Text>

          <View className="flex-row flex-wrap mt-2">
            <View
              className="px-2 py-1 rounded-full mr-1 mb-1 flex-row items-center"
              style={{ backgroundColor: stockBadgeBg }}
            >
              <Ionicons
                name={validation.isOutOfStock ? 'close-circle-outline' : 'cube-outline'}
                size={12}
                color={stockBadgeColor}
              />
              <Text
                className="ml-1 text-[10px] font-bold"
                style={{ color: stockBadgeColor }}
                numberOfLines={1}
              >
                {getStockLabel(validation)}
              </Text>
            </View>

            <View
              className="px-2 py-1 rounded-full mr-1 mb-1 flex-row items-center"
              style={{ backgroundColor: expiryBadgeBg }}
            >
              <Ionicons
                name={
                  validation.isExpired || validation.isMissingExpiry
                    ? 'warning-outline'
                    : 'time-outline'
                }
                size={12}
                color={expiryBadgeColor}
              />
             
            </View>
          </View>

        

          <View className="flex-row items-center justify-between mt-auto pt-3">
            <Text className="text-[11px] text-[#64748B]" numberOfLines={1}>
              {validation.vendorName}
            </Text>

            <Pressable
              onPress={onBuy}
              disabled={!canAddToCart}
              className="px-3 py-2 rounded-xl flex-row items-center"
              style={{
                backgroundColor: canAddToCart ? COLORS.orange : '#CBD5E1',
              }}
            >
              {adding ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="cart-outline" size={14} color="#fff" />
                  <Text className="text-white font-extrabold text-xs ml-1">
                    Thêm
                  </Text>
                </>
              )}
            </Pressable>
          </View>
        </View>
      </Pressable>

      <Toast
        visible={toastVisible}
        message={toastMsg}
        type={toastType}
        onHidden={() => setToastVisible(false)}
      />
    </>
  );
};

const localStyles = StyleSheet.create({
  card: {
    width: '100%',
    minHeight: 385,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  thumb: {
    width: '100%',
    height: 165,
    backgroundColor: '#F1F5F9',
  },
  installBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    zIndex: 10,
  },
  warningBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 10,
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
});

export default CardProduct;