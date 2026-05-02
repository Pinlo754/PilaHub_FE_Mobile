import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { formatVND } from '../../../utils/number';

type Props = {
  total: number;
  selectedCount: number;
  disabled: boolean;
  loading?: boolean;
  invalidCount: number;
  onCheckout: () => void;
};

const CartCheckoutBar: React.FC<Props> = ({
  total,
  selectedCount,
  disabled,
  loading = false,
  invalidCount,
  onCheckout,
}) => {
  return (
    <View className="absolute left-4 right-4 bottom-4 bg-white rounded-2xl p-4 flex-row items-center justify-between shadow-lg border border-[#F1F5F9]">
      <View className="flex-1 pr-3">
        <Text className="text-[#64748B] text-xs font-semibold">
          {selectedCount} sản phẩm đã chọn
        </Text>

        <Text className="text-[#0F172A] text-xl font-extrabold mt-1">
          {formatVND(total)}
        </Text>

        {invalidCount > 0 ? (
          <Text className="text-red-600 text-xs font-semibold mt-1">
            {invalidCount} sản phẩm không đủ điều kiện
          </Text>
        ) : null}
      </View>

      <TouchableOpacity
        disabled={disabled || loading}
        onPress={onCheckout}
        className="px-5 py-3 rounded-xl"
        style={{
          backgroundColor: disabled || loading ? '#CBD5E1' : '#A0522D',
        }}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="text-white font-extrabold">
            {selectedCount === 0 ? 'Chọn sản phẩm' : 'Thanh toán'}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

export default CartCheckoutBar;