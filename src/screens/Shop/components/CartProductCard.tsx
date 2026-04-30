import React from 'react';
import { View, Text, Image, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { CartLine } from '../../../services/cart';
import { formatVND } from '../../../utils/number';
import {
  CartValidationResult,
  getExpiryLabel,
  getMainInvalidReason,
  getStockLabel,
} from '../utils/cartValidation';

type Props = {
  item: CartLine;
  selected: boolean;
  selectMode: boolean;
  quantityInput: string;
  validation: CartValidationResult;

  onToggleSelect: () => void;
  onIncrease: () => void;
  onDecrease: () => void;
  onChangeQuantityText: (text: string) => void;
  onCommitQuantity: () => void;
  onRemove: () => void;
};

const CartProductCard: React.FC<Props> = ({
  item,
  selected,
  selectMode,
  quantityInput,
  validation,
  onToggleSelect,
  onIncrease,
  onDecrease,
  onChangeQuantityText,
  onCommitQuantity,
  onRemove,
}) => {
  const invalidReason = getMainInvalidReason(validation);

  const canIncrease =
    validation.canCheckout &&
    (validation.stock === null || Number(item.quantity) < validation.stock);

  const canDecrease = validation.canCheckout && Number(item.quantity) > 1;

  const borderColor = !validation.canCheckout
    ? '#FCA5A5'
    : selected
      ? '#86EFAC'
      : '#E5E7EB';

  const cardBg = !validation.canCheckout
    ? '#FFF1F2'
    : selected
      ? '#F0FDF4'
      : '#FFFFFF';

  return (
    <View
      className="rounded-2xl p-3 mb-3 border"
      style={{
        backgroundColor: cardBg,
        borderColor,
      }}
    >
      <View className="flex-row">
        {selectMode ? (
          <TouchableOpacity
            onPress={onToggleSelect}
            disabled={!validation.canSelect}
            className="mr-2 pt-7"
          >
            <Ionicons
              name={selected ? 'checkmark-circle' : 'ellipse-outline'}
              size={23}
              color={
                !validation.canSelect
                  ? '#CBD5E1'
                  : selected
                    ? '#10B981'
                    : '#94A3B8'
              }
            />
          </TouchableOpacity>
        ) : null}

        <Image
          source={{
            uri:
              item.thumnail_url ||
              item.raw?.thumbnailUrl ||
              item.raw?.imageUrl ||
              'https://via.placeholder.com/160',
          }}
          className="w-20 h-20 rounded-xl bg-[#F1F5F9]"
        />

        <View className="flex-1 ml-3">
          <View className="flex-row items-start justify-between">
            <View className="flex-1 pr-2">
              <Text className="text-[#64748B] text-xs mb-1" numberOfLines={1}>
                {validation.vendorName}
              </Text>

              <Text className="font-extrabold text-[#0F172A]" numberOfLines={2}>
                {item.product_name}
              </Text>
            </View>

            {!selectMode ? (
              <TouchableOpacity onPress={onRemove} className="w-8 h-8 items-center justify-center">
                <Ionicons name="trash-outline" size={18} color="#EF4444" />
              </TouchableOpacity>
            ) : null}
          </View>

          <Text className="text-orange-600 font-extrabold mt-2">
            {formatVND(item.price)}
          </Text>

          <View className="flex-row flex-wrap mt-2">
            <View
              className="px-2 py-1 rounded-full mr-2 mb-2 flex-row items-center"
              style={{
                backgroundColor: validation.isOutOfStock ? '#FEE2E2' : '#ECFDF5',
              }}
            >
              <Ionicons
                name={validation.isOutOfStock ? 'close-circle-outline' : 'cube-outline'}
                size={13}
                color={validation.isOutOfStock ? '#B91C1C' : '#047857'}
              />
              <Text
                className="ml-1 text-[11px] font-bold"
                style={{ color: validation.isOutOfStock ? '#B91C1C' : '#047857' }}
              >
                {getStockLabel(validation)}
              </Text>
            </View>

            <View
              className="px-2 py-1 rounded-full mr-2 mb-2 flex-row items-center"
              style={{
                backgroundColor:
                  validation.isExpired || validation.isMissingExpiry
                    ? '#FEE2E2'
                    : validation.isNearExpiry
                      ? '#FFEDD5'
                      : '#ECFDF5',
              }}
            >
              <Ionicons
                name={
                  validation.isExpired || validation.isMissingExpiry
                    ? 'warning-outline'
                    : 'time-outline'
                }
                size={13}
                color={
                  validation.isExpired || validation.isMissingExpiry
                    ? '#B91C1C'
                    : validation.isNearExpiry
                      ? '#C2410C'
                      : '#047857'
                }
              />
              <Text
                className="ml-1 text-[11px] font-bold"
                style={{
                  color:
                    validation.isExpired || validation.isMissingExpiry
                      ? '#B91C1C'
                      : validation.isNearExpiry
                        ? '#C2410C'
                        : '#047857',
                }}
              >
                HSD: {getExpiryLabel(validation)}
              </Text>
            </View>

            {validation.isInactive ? (
              <View className="px-2 py-1 rounded-full mr-2 mb-2 bg-[#FEE2E2]">
                <Text className="text-[11px] font-bold text-[#B91C1C]">
                  Ngừng bán
                </Text>
              </View>
            ) : null}
          </View>

          {invalidReason ? (
            <View className="bg-white/70 rounded-xl p-2 mt-1 border border-[#FED7AA]">
              <View className="flex-row items-start">
                <Ionicons
                  name={validation.canCheckout ? 'information-circle-outline' : 'alert-circle-outline'}
                  size={15}
                  color={validation.canCheckout ? '#C2410C' : '#B91C1C'}
                />
                <Text
                  className="ml-1 flex-1 text-[11px] leading-4 font-semibold"
                  style={{ color: validation.canCheckout ? '#C2410C' : '#B91C1C' }}
                >
                  {invalidReason}
                </Text>
              </View>
            </View>
          ) : null}

          <View className="flex-row items-center justify-between mt-3">
            <View className="flex-row items-center bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
              <TouchableOpacity
                onPress={onDecrease}
                disabled={!canDecrease}
                className="px-3 py-2"
              >
                <Text
                  className="text-lg font-extrabold"
                  style={{ color: canDecrease ? '#0F172A' : '#CBD5E1' }}
                >
                  −
                </Text>
              </TouchableOpacity>

             <TextInput
  value={quantityInput}
  onChangeText={(text) => {
    const digits = text.replace(/[^0-9]/g, '');

    if (digits.length === 0) {
      onChangeQuantityText('');
      return;
    }

    let nextQty = parseInt(digits, 10);

    if (!Number.isFinite(nextQty) || nextQty <= 0) {
      nextQty = 1;
    }

    if (validation.stock !== null && nextQty > validation.stock) {
      nextQty = validation.stock;
    }

    onChangeQuantityText(String(nextQty));
  }}
  onBlur={onCommitQuantity}
  onSubmitEditing={onCommitQuantity}
  keyboardType="number-pad"
  returnKeyType="done"
  editable={validation.canCheckout}
  className="font-extrabold text-center text-[#0F172A]"
  style={styles.qtyInput}
/>

              <TouchableOpacity
                onPress={onIncrease}
                disabled={!canIncrease}
                className="px-3 py-2"
              >
                <Text
                  className="text-lg font-extrabold"
                  style={{ color: canIncrease ? '#0F172A' : '#CBD5E1' }}
                >
                  +
                </Text>
              </TouchableOpacity>
            </View>

            <Text className="text-xs font-semibold text-[#64748B]">
              Tạm tính:{' '}
              <Text className="text-[#0F172A] font-extrabold">
                {formatVND(Number(item.price || 0) * Number(item.quantity || 0))}
              </Text>
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  qtyInput: {
    minWidth: 46,
    paddingVertical: 0,
    textAlign: 'center',
  },
});

export default CartProductCard;