import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';

import { CartLine } from '../../../services/cart';
import CartProductCard from './CartProductCard';
import { CartValidationResult } from '../utils/cartValidation';

type CartGroup = {
  shopId: string;
  shopName: string;
  items: CartLine[];
};

type Props = {
  group: CartGroup;
  selectMode: boolean;
  selectedIds: string[];
  qtyInputs: Record<string, string>;
  validations: Record<string, CartValidationResult>;

  onToggleShop: (shopId: string) => void;
  onToggleItem: (productId: string) => void;
  onIncrease: (item: CartLine) => void;
  onDecrease: (item: CartLine) => void;
  onChangeQuantityText: (productId: string, text: string) => void;
  onCommitQuantity: (item: CartLine) => void;
  onRemove: (item: CartLine) => void;
  onPressItemDetail: (item: CartLine) => void;
};

const CartShopGroup: React.FC<Props> = ({
  group,
  selectMode,
  selectedIds,
  qtyInputs,
  validations,
  onToggleShop,
  onToggleItem,
  onIncrease,
  onDecrease,
  onChangeQuantityText,
  onCommitQuantity,
  onRemove,
  onPressItemDetail,
}) => {
  const selectableItems = group.items.filter(
    item => validations[item.product_id]?.canSelect,
  );

  const invalidItems = group.items.length - selectableItems.length;

  const allSelectableSelected =
    selectableItems.length > 0 &&
    selectableItems.every(item => selectedIds.includes(item.product_id));

  const selectedInShop = group.items.filter(item =>
    selectedIds.includes(item.product_id),
  ).length;

  return (
    <View className="mb-4">
      <View className="p-3 bg-white rounded-2xl mb-2 border border-[#F1E7DC]">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center flex-1 pr-2">
            {selectMode ? (
              <TouchableOpacity
                onPress={() => onToggleShop(group.shopId)}
                disabled={selectableItems.length === 0}
                className="mr-2"
              >
                <Ionicons
                  name={allSelectableSelected ? 'checkmark-circle' : 'ellipse-outline'}
                  size={23}
                  color={
                    selectableItems.length === 0
                      ? '#CBD5E1'
                      : allSelectableSelected
                        ? '#10B981'
                        : '#94A3B8'
                  }
                />
              </TouchableOpacity>
            ) : null}

            <View className="w-10 h-10 rounded-2xl bg-[#FFF7ED] items-center justify-center mr-3">
              <Ionicons name="storefront-outline" size={19} color="#CD853F" />
            </View>

            <View className="flex-1">
              <Text className="font-extrabold text-[#0F172A]" numberOfLines={1}>
                {group.shopName}
              </Text>

              <Text className="text-xs text-[#64748B] mt-1">
                {group.items.length} sản phẩm
                {selectedInShop > 0 ? ` • Đã chọn ${selectedInShop}` : ''}
              </Text>
            </View>
          </View>

          {invalidItems > 0 ? (
            <View className="px-2.5 py-1 rounded-full bg-[#FEE2E2]">
              <Text className="text-[11px] font-bold text-[#B91C1C]">
                {invalidItems} lỗi
              </Text>
            </View>
          ) : (
            <View className="px-2.5 py-1 rounded-full bg-[#ECFDF5]">
              <Text className="text-[11px] font-bold text-[#047857]">
                Hợp lệ
              </Text>
            </View>
          )}
        </View>

        {invalidItems > 0 ? (
          <View className="mt-3 bg-[#FEF2F2] rounded-2xl p-3 border border-[#FECACA]">
            <View className="flex-row items-start">
              <Ionicons name="alert-circle-outline" size={17} color="#B91C1C" />
              <Text className="text-[#991B1B] text-xs leading-5 ml-2 flex-1">
                Cửa hàng này có sản phẩm hết hàng, hết hạn, thiếu HSD hoặc thiếu thông tin nhà bán.
              </Text>
            </View>
          </View>
        ) : null}
      </View>

      {group.items.map(item => {
        const validation = validations[item.product_id];

        return (
          <CartProductCard
            key={item.product_id}
            item={item}
            selected={selectedIds.includes(item.product_id)}
            selectMode={selectMode}
            quantityInput={qtyInputs[item.product_id] ?? String(item.quantity ?? 1)}
            validation={validation}
            onToggleSelect={() => onToggleItem(item.product_id)}
            onIncrease={() => onIncrease(item)}
            onDecrease={() => onDecrease(item)}
            onChangeQuantityText={text => onChangeQuantityText(item.product_id, text)}
            onCommitQuantity={() => onCommitQuantity(item)}
            onRemove={() => onRemove(item)}
            onPressDetail={() => onPressItemDetail(item)}
          />
        );
      })}
    </View>
  );
};

export default CartShopGroup;