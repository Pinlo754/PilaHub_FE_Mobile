import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
} from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { ProductItem } from '../../../services/products';
import { formatVND } from '../../../utils/number';
import { CartValidationResult, getExpiryLabel, getMainInvalidReason, getStockLabel } from '../utils/cartValidation';



const COLORS = {
  primary: '#CD853F',
  warm: '#F59E0B',
  text: '#0F172A',
  muted: '#6B7280',
  card: '#FFFFFF',
};

type Props = {
  product: ProductItem;
  rating: number;
  reviewCount: number;
  vendor: string | null;
  category: string | null;
  quantity: number;
  setQuantity: (value: number) => void;
  showFullDesc: boolean;
  setShowFullDesc: (value: boolean) => void;
  validation: CartValidationResult;
};

const ProductPurchaseInfo: React.FC<Props> = ({
  product,
  rating,
  reviewCount,
  vendor,
  category,
  quantity,
  setQuantity,
  showFullDesc,
  setShowFullDesc,
  validation,
}) => {
  const installationSupported = Boolean(
    product.installationSupported ??
      product.raw?.installationSupported ??
      product.raw?.installation_supported ??
      false,
  );

  const invalidReason = getMainInvalidReason(validation);
  const canBuy = validation.canCheckout;
  const canIncrease =
    canBuy && (validation.stock === null || quantity < validation.stock);

  const decreaseQuantity = () => {
    if (!canBuy) return;
    setQuantity(Math.max(1, quantity - 1));
  };

  const increaseQuantity = () => {
    if (!canBuy) return;

    if (validation.stock !== null) {
      setQuantity(Math.min(validation.stock, quantity + 1));
      return;
    }

    setQuantity(quantity + 1);
  };

  const onChangeQuantity = (text: string) => {    
    const digits = text.replace(/[^0-9]/g, '');
    
    if (digits.length === 0) {
      setQuantity(1);
      return;
    }

    let n = parseInt(digits, 10);

    if (!Number.isFinite(n) || n <= 0) n = 1;

    if (validation.stock !== null && n > validation.stock) {
      n = Math.floor(n / 10);
    }

    setQuantity(n);
  };

  const statusBg = canBuy ? '#D1FAE5' : '#FEE2E2';
  const statusColor = canBuy ? '#047857' : '#B91C1C';

  const stockBg = validation.isOutOfStock ? '#FEE2E2' : validation.stock !== null && validation.stock <= 5 ? '#FFEDD5' : '#ECFDF5';
  const stockColor = validation.isOutOfStock ? '#B91C1C' : validation.stock !== null && validation.stock <= 5 ? '#C2410C' : '#047857';

  const expiryBg =
    validation.isExpired || validation.isMissingExpiry
      ? '#FEE2E2'
      : validation.isNearExpiry
        ? '#FFEDD5'
        : '#ECFDF5';

  const expiryColor =
    validation.isExpired || validation.isMissingExpiry
      ? '#B91C1C'
      : validation.isNearExpiry
        ? '#C2410C'
        : '#047857';

  return (
    <View className="w-full">
      <View style={styles.cardContainer} className="mx-4 -mt-10 rounded-2xl shadow-md">
        <View className="flex-row items-start justify-between">
          <View className="flex-1 pr-3">
            <Text className="text-[20px] font-extrabold text-[#0F172A]" numberOfLines={2}>
              {product.name ?? product.productId}
            </Text>

            <Text className="text-[26px] font-black mt-2" style={{ color: COLORS.primary }}>
              {formatVND(product.price ?? 0)}
            </Text>
          </View>

          <View
            className="px-3 py-2 rounded-full flex-row items-center"
            style={{ backgroundColor: statusBg }}
          >
            <Ionicons
              name={canBuy ? 'checkmark-circle-outline' : 'close-circle-outline'}
              size={16}
              color={statusColor}
            />
            <Text className="ml-1 text-xs font-extrabold" style={{ color: statusColor }}>
              {canBuy ? 'Có thể mua' : 'Tạm ngưng bán'}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center mt-3 flex-wrap">
          <View className="flex-row items-center bg-[#FFF7ED] rounded-full px-3 py-1 mr-2 mb-2">
            <Ionicons name="star" size={14} color={COLORS.warm} />
            <Text className="ml-1 font-bold text-[#0F172A]">{rating.toFixed(1)}</Text>
            <Text className="ml-1 text-sm text-[#6B7280]">({reviewCount})</Text>
          </View>

          {category ? (
            <View className="bg-[#F1F5F9] rounded-full px-3 py-1 mr-2 mb-2">
              <Text className="text-xs font-bold text-[#334155]">{category}</Text>
            </View>
          ) : null}

          {installationSupported ? (
            <View className="px-3 py-1 rounded-full flex-row items-center mb-2" style={{ backgroundColor: COLORS.primary }}>
              <Ionicons name="construct-outline" size={13} color="#fff" />
              <Text className="ml-1 text-xs font-bold text-white">Lắp đặt</Text>
            </View>
          ) : null}
        </View>

        <View className="mt-3 flex-row">
          <View className="flex-1 rounded-2xl p-3 mr-2" style={{ backgroundColor: stockBg }}>
            <View className="flex-row items-center">
              <Ionicons
                name={validation.isOutOfStock ? 'close-circle-outline' : 'cube-outline'}
                size={18}
                color={stockColor}
              />
              <Text className="ml-2 text-xs font-bold" style={{ color: stockColor }}>
                Tồn kho
              </Text>
            </View>

            <Text className="mt-2 text-[15px] font-extrabold" style={{ color: stockColor }}>
              {getStockLabel(validation)}
            </Text>
          </View>

          <View className="flex-1 rounded-2xl p-3 ml-2" style={{ backgroundColor: expiryBg }}>
            <View className="flex-row items-center">
              <Ionicons
                name={
                  validation.isExpired || validation.isMissingExpiry
                    ? 'warning-outline'
                    : 'time-outline'
                }
                size={18}
                color={expiryColor}
              />
              <Text className="ml-2 text-xs font-bold" style={{ color: expiryColor }}>
                {validation.requireExpiryDate ? 'Hạn sử dụng' : 'Hạn dùng'}
              </Text>
            </View>

            <Text className="mt-2 text-[15px] font-extrabold" style={{ color: expiryColor }}>
              {getExpiryLabel(validation)}
            </Text>

            <Text className="mt-1 text-xs font-semibold" style={{ color: expiryColor }}>
              {validation.requireExpiryDate ? 'Bắt buộc kiểm tra' : 'Không bắt buộc'}
            </Text>
          </View>
        </View>

        {invalidReason ? (
          <View className="mt-3 rounded-2xl bg-[#FFF7ED] p-3 border border-[#FED7AA]">
            <View className="flex-row items-start">
              <Ionicons
                name={validation.canCheckout ? 'information-circle-outline' : 'alert-circle-outline'}
                size={18}
                color={validation.canCheckout ? '#C2410C' : '#B91C1C'}
              />
              <Text
                className="ml-2 flex-1 text-xs leading-5 font-semibold"
                style={{ color: validation.canCheckout ? '#C2410C' : '#B91C1C' }}
              >
                {invalidReason}
              </Text>
            </View>
          </View>
        ) : null}

        <View className="mt-4 flex-row items-center justify-between">
          <View>
            <Text className="text-xs font-bold text-[#64748B] mb-2">Số lượng</Text>

            <View className="flex-row items-center bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0]">
              <TouchableOpacity
                onPress={decreaseQuantity}
                className="px-4 py-3"
                disabled={quantity <= 1 || !canBuy}
              >
                <Text
                  className="text-xl font-bold"
                  style={{ color: quantity <= 1 || !canBuy ? '#CBD5E1' : '#0F172A' }}
                >
                  −
                </Text>
              </TouchableOpacity>

              <TextInput
                value={String(quantity)}
                onChangeText={onChangeQuantity}
                keyboardType="number-pad"
                returnKeyType="done"
                className="font-extrabold text-center text-[#0F172A]"
                style={{ minWidth: 52, paddingVertical: 0 }}
                editable={canBuy}
              />

              <TouchableOpacity
                onPress={increaseQuantity}
                className="px-4 py-3"
                disabled={!canIncrease}
              >
                <Text
                  className="text-xl font-bold"
                  style={{ color: !canIncrease ? '#CBD5E1' : '#0F172A' }}
                >
                  +
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => setShowFullDesc(!showFullDesc)}
            className="px-4 py-3 rounded-2xl bg-[#F1F5F9]"
          >
            <Text className="text-[#0F172A] font-extrabold">
              {showFullDesc ? 'Rút gọn' : 'Xem mô tả'}
            </Text>
          </TouchableOpacity>
        </View>

        {vendor ? (
          <View className="mt-4 pt-4 border-t border-[#E5E7EB]">
            <Text className="text-xs text-[#64748B]">Nhà bán</Text>
            <Text className="font-extrabold text-[#0F172A] mt-1">{vendor}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: COLORS.card,
    padding: 18,
  },
});

export default ProductPurchaseInfo;