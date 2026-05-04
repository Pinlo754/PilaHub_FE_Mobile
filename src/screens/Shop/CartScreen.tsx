import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import Ionicons from '@react-native-vector-icons/ionicons';

import { CartLine } from '../../services/cart';
import { useCart } from '../../context/CartContext';
import Toast from '../../components/Toast';
import ModalPopup from '../../components/ModalPopup';

import CartShopGroup from './components/CartShopGroup';
import CartCheckoutBar from './components/CartCheckoutBar';

import {
  getVendorId,
  getVendorName,
  validateCartItem,
  CartValidationResult,
} from './utils/cartValidation';

type CartGroup = {
  shopId: string;
  shopName: string;
  items: CartLine[];
};

const EmptyComponent = () => (
  <View className="mt-24 items-center px-6">
    <View className="w-20 h-20 rounded-full bg-[#FFF7ED] items-center justify-center mb-4">
      <Ionicons name="cart-outline" size={38} color="#CD853F" />
    </View>

    <Text className="text-[#0F172A] text-lg font-extrabold">
      Giỏ hàng trống
    </Text>

    <Text className="text-[#64748B] text-sm text-center mt-2 leading-5">
      Bạn chưa có sản phẩm nào trong giỏ. Hãy thêm sản phẩm để tiếp tục mua hàng.
    </Text>
  </View>
);

const getCartProductId = (item: CartLine | any) => {
  return String(
    item?.product_id ??
      item?.productId ??
      item?.raw?.productId ??
      item?.raw?.product_id ??
      item?.raw?.id ??
      '',
  );
};

const isSupplementItem = (item: CartLine | any) => {
  const raw = item?.raw ?? {};

  return (
    String(
      raw.categoryType ??
        raw.category_type ??
        raw.productCategoryType ??
        raw.product_category_type ??
        item?.categoryType ??
        item?.category_type ??
        '',
    ).toUpperCase() === 'SUPPLEMENT'
  );
};

export default function CartScreen() {
  const focused = useIsFocused();
  const navigation: any = useNavigation();

  const {
    lines,
    totalItems,
    loadCart,
    userId,
    updateQuantity: ctxUpdateQuantity,
    removeFromCart: ctxRemoveFromCart,
    clearCart: ctxClearCart,
  } = useCart();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [qtyInputs, setQtyInputs] = useState<Record<string, string>>({});
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const selectMode = true;

  const [toastVisible, setToastVisible] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>(
    'info',
  );

  const [modalState, setModalState] = useState<any>({
    visible: false,
    mode: 'noti',
    message: '',
  });

  const showToast = useCallback(
    (message: string, type: 'success' | 'error' | 'info' = 'info') => {
      setToastMsg(message);
      setToastType(type);
      setToastVisible(true);
    },
    [],
  );

  const showModal = useCallback(
    (opts: {
      title?: string;
      message: string;
      mode?: 'noti' | 'confirm' | 'toast';
      onConfirm?: () => void;
    }) => {
      setModalState({
        visible: true,
        mode: opts.mode ?? 'noti',
        title: opts.title,
        message: opts.message,
        onConfirm: () => {
          setModalState((s: any) => ({
            ...s,
            visible: false,
          }));

          if (opts.onConfirm) {
            opts.onConfirm();
          }
        },
      });
    },
    [],
  );

  const closeModal = () =>
    setModalState((s: any) => ({
      ...s,
      visible: false,
    }));

  const validations = useMemo<Record<string, CartValidationResult>>(() => {
    const result: Record<string, CartValidationResult> = {};

    for (const item of lines || []) {
      result[item.product_id] = validateCartItem(item);
    }

    return result;
  }, [lines]);

  const grouped = useMemo<CartGroup[]>(() => {
    const map: Record<string, CartGroup> = {};

    for (const item of lines || []) {
      const vendorId = getVendorId(item);
      const shopId = vendorId ? String(vendorId) : `unknown_${item.product_id}`;
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
  }, [lines]);

  const selectedItems = useMemo(() => {
    return (lines || []).filter(item => selectedIds.includes(item.product_id));
  }, [lines, selectedIds]);

  const selectedValidItems = useMemo(() => {
    return selectedItems.filter(
      item => validations[item.product_id]?.canCheckout,
    );
  }, [selectedItems, validations]);

  const selectedSupplementItems = useMemo(() => {
    return selectedValidItems.filter(item => isSupplementItem(item));
  }, [selectedValidItems]);

  const invalidItems = useMemo(() => {
    return (lines || []).filter(
      item => !validations[item.product_id]?.canCheckout,
    );
  }, [lines, validations]);

  const selectedInvalidItems = useMemo(() => {
    return selectedItems.filter(
      item => !validations[item.product_id]?.canCheckout,
    );
  }, [selectedItems, validations]);

  const totalSelectedPrice = useMemo(() => {
    return selectedValidItems.reduce((sum, item) => {
      return sum + Number(item.price || 0) * Number(item.quantity || 0);
    }, 0);
  }, [selectedValidItems]);

  const checkoutDisabled =
    selectedIds.length === 0 ||
    selectedInvalidItems.length > 0 ||
    selectedValidItems.length === 0 ||
    checkoutLoading;

  useEffect(() => {
    if (focused) {
      loadCart();
    }
  }, [focused, loadCart]);

  useEffect(() => {
    if (userId) {
      loadCart();
    }
  }, [userId, loadCart]);

  useEffect(() => {
    const next: Record<string, string> = {};

    for (const item of lines || []) {
      next[item.product_id] = String(item.quantity ?? 1);
    }

    setQtyInputs(next);
  }, [lines]);

  useEffect(() => {
    setSelectedIds(prev => {
      const availableIds = new Set((lines || []).map(item => item.product_id));
      return prev.filter(id => availableIds.has(id));
    });
  }, [lines]);

  const goToProductDetail = useCallback(
    (item: CartLine) => {
      const id = getCartProductId(item);

      if (!id) {
        showToast('Không tìm thấy mã sản phẩm', 'error');
        return;
      }

      navigation.navigate('ProductDetail' as never, { productId: id } as never);
    },
    [navigation, showToast],
  );

  const toggleSelectItem = useCallback(
    (productId: string) => {
      const validation = validations[productId];

      if (!validation?.canSelect) {
        const reason =
          validation?.errors?.[0] ?? 'Sản phẩm không đủ điều kiện thanh toán';
        showToast(reason, 'error');
        return;
      }

      setSelectedIds(prev => {
        if (prev.includes(productId)) {
          return prev.filter(id => id !== productId);
        }

        return [...prev, productId];
      });
    },
    [showToast, validations],
  );

  const toggleSelectShop = useCallback(
    (shopId: string) => {
      const group = grouped.find(g => g.shopId === shopId);
      if (!group) return;

      const selectableIds = group.items
        .filter(item => validations[item.product_id]?.canSelect)
        .map(item => item.product_id);

      if (selectableIds.length === 0) {
        showToast('Không có sản phẩm hợp lệ để chọn trong cửa hàng này', 'error');
        return;
      }

      const allSelected = selectableIds.every(id => selectedIds.includes(id));

      setSelectedIds(prev => {
        if (allSelected) {
          return prev.filter(id => !selectableIds.includes(id));
        }

        const next = [...prev];

        for (const id of selectableIds) {
          if (!next.includes(id)) {
            next.push(id);
          }
        }

        return next;
      });
    },
    [grouped, selectedIds, showToast, validations],
  );

  const selectAllValidItems = () => {
    const validIds = (lines || [])
      .filter(item => validations[item.product_id]?.canSelect)
      .map(item => item.product_id);

    if (validIds.length === 0) {
      showToast('Không có sản phẩm hợp lệ để chọn', 'error');
      return;
    }

    const allSelected = validIds.every(id => selectedIds.includes(id));

    setSelectedIds(allSelected ? [] : validIds);
  };

  const onChangeQuantityText = (productId: string, text: string) => {
    const clean = text.replace(/[^0-9]/g, '');

    if (clean.length === 0) {
      setQtyInputs(prev => ({
        ...prev,
        [productId]: '',
      }));
      return;
    }

    const validation = validations[productId];
    let nextQty = parseInt(clean, 10);

    if (!Number.isFinite(nextQty) || nextQty <= 0) {
      nextQty = 1;
    }

    if (
      validation?.stock !== null &&
      validation?.stock !== undefined &&
      nextQty > validation.stock
    ) {
      nextQty = validation.stock;
      showToast(`Chỉ còn ${validation.stock} sản phẩm trong kho`, 'error');
    }

    setQtyInputs(prev => ({
      ...prev,
      [productId]: String(nextQty),
    }));
  };

  const commitQuantity = async (item: CartLine) => {
    const validation = validations[item.product_id];

    if (
      !validation?.canCheckout &&
      validation?.stock !== null &&
      validation?.stock <= 0
    ) {
      showToast('Sản phẩm đã hết hàng, không thể cập nhật số lượng', 'error');
      return;
    }

    const raw = qtyInputs[item.product_id] ?? String(item.quantity ?? 1);
    let nextQuantity = parseInt(raw || '1', 10);

    if (!Number.isFinite(nextQuantity) || nextQuantity <= 0) {
      nextQuantity = 1;
    }

    if (
      validation?.stock !== null &&
      validation?.stock !== undefined &&
      nextQuantity > validation.stock
    ) {
      nextQuantity = validation.stock;
      showToast(`Chỉ còn ${validation.stock} sản phẩm trong kho`, 'error');
    }

    try {
      await ctxUpdateQuantity(item.product_id, nextQuantity);
      await loadCart();
    } catch (e) {
      console.warn('commit quantity failed', e);
      showToast('Không thể cập nhật số lượng', 'error');
    }
  };

  const onIncrease = async (item: CartLine) => {
    const validation = validations[item.product_id];

    if (!validation?.canCheckout) {
      showToast(validation?.errors?.[0] ?? 'Sản phẩm không hợp lệ', 'error');
      return;
    }

    const current = Number(item.quantity || 1);
    const nextQuantity = current + 1;

    if (validation.stock !== null && nextQuantity > validation.stock) {
      showToast(`Chỉ còn ${validation.stock} sản phẩm trong kho`, 'error');
      return;
    }

    try {
      await ctxUpdateQuantity(item.product_id, nextQuantity);
      await loadCart();
    } catch (e) {
      console.warn('increase quantity failed', e);
      showToast('Không thể cập nhật số lượng', 'error');
    }
  };

  const onDecrease = async (item: CartLine) => {
    const validation = validations[item.product_id];

    if (!validation?.canCheckout) {
      showToast(validation?.errors?.[0] ?? 'Sản phẩm không hợp lệ', 'error');
      return;
    }

    const current = Number(item.quantity || 1);

    if (current <= 1) {
      showToast('Số lượng tối thiểu là 1. Nếu không mua, hãy xoá sản phẩm.', 'info');
      return;
    }

    const nextQuantity = current - 1;

    try {
      await ctxUpdateQuantity(item.product_id, nextQuantity);
      await loadCart();
    } catch (e) {
      console.warn('decrease quantity failed', e);
      showToast('Không thể cập nhật số lượng', 'error');
    }
  };

  const onRemove = (item: CartLine) => {
    showModal({
      title: 'Xoá sản phẩm',
      message: 'Bạn có muốn xoá sản phẩm này khỏi giỏ hàng?',
      mode: 'confirm',
      onConfirm: async () => {
        try {
          await ctxRemoveFromCart(item.product_id);
          await loadCart();

          setSelectedIds(prev => prev.filter(id => id !== item.product_id));
          showToast('Đã xoá sản phẩm khỏi giỏ hàng', 'info');
        } catch (e) {
          console.warn('remove item failed', e);
          showToast('Không thể xoá sản phẩm', 'error');
        }
      },
    });
  };

  const clearAllConfirm = () => {
    if (!lines.length) {
      showToast('Giỏ hàng đang trống', 'info');
      return;
    }

    showModal({
      title: 'Xóa tất cả',
      message: 'Bạn có chắc muốn xóa toàn bộ sản phẩm trong giỏ?',
      mode: 'confirm',
      onConfirm: async () => {
        try {
          await ctxClearCart();
          await loadCart();

          setSelectedIds([]);
          showToast('Đã xóa tất cả sản phẩm', 'info');
        } catch (e) {
          console.warn('clear cart failed', e);
          showToast('Xoá không thành công', 'error');
        }
      },
    });
  };

  const removeInvalidItemsConfirm = () => {
    if (invalidItems.length === 0) {
      showToast('Không có sản phẩm lỗi trong giỏ hàng', 'info');
      return;
    }

    showModal({
      title: 'Xoá sản phẩm lỗi',
      message: `Có ${invalidItems.length} sản phẩm không đủ điều kiện. Bạn có muốn xoá khỏi giỏ hàng không?`,
      mode: 'confirm',
      onConfirm: async () => {
        try {
          for (const item of invalidItems) {
            await ctxRemoveFromCart(item.product_id);
          }

          await loadCart();

          const invalidIds = invalidItems.map(item => item.product_id);
          setSelectedIds(prev => prev.filter(id => !invalidIds.includes(id)));

          showToast('Đã xoá sản phẩm không hợp lệ', 'info');
        } catch (e) {
          console.warn('remove invalid items failed', e);
          showToast('Không thể xoá sản phẩm lỗi', 'error');
        }
      },
    });
  };

  const handleCheckout = useCallback(async () => {
    if (!selectedIds.length) {
      showToast('Vui lòng chọn sản phẩm để thanh toán', 'info');
      return;
    }

    const items = (lines || []).filter(item =>
      selectedIds.includes(item.product_id),
    );

    const invalidSelected = items.filter(
      item => !validations[item.product_id]?.canCheckout,
    );

    if (invalidSelected.length > 0) {
      const firstInvalid = invalidSelected[0];
      const reason =
        validations[firstInvalid.product_id]?.errors?.[0] ??
        'Có sản phẩm không đủ điều kiện thanh toán';

      showToast(reason, 'error');
      return;
    }

    const goToCheckout = async () => {
      setCheckoutLoading(true);

      try {
        const checkoutItems = items.map(item => ({
          ...item,
          validation: validations[item.product_id],
        }));

        navigation.navigate('Checkout' as never, { items: checkoutItems } as never);
      } catch (e) {
        console.warn('checkout failed', e);
        showToast('Không thể chuyển sang thanh toán', 'error');
      } finally {
        setCheckoutLoading(false);
      }
    };

    if (selectedSupplementItems.length > 0) {
      showModal({
        title: 'Kiểm tra thực phẩm bổ sung',
        message:
          `Bạn đang chọn ${selectedSupplementItems.length} sản phẩm thực phẩm bổ sung.\n\n` +
          'Vui lòng bấm vào sản phẩm trong giỏ hàng để xem lại chi tiết, cảnh báo, hạn sử dụng, hướng dẫn sử dụng và chống chỉ định trước khi thanh toán.\n\n' +
          'Nếu đã kiểm tra xong, bạn có thể bấm Tiếp tục để sang thanh toán.',
        mode: 'confirm',
        onConfirm: goToCheckout,
      });

      return;
    }

    await goToCheckout();
  }, [
    lines,
    navigation,
    selectedIds,
    selectedSupplementItems,
    showModal,
    showToast,
    validations,
  ]);

  return (
    <SafeAreaView className="flex-1 bg-[#FFF8F0]">
      <View className="px-4 pt-3 pb-4 bg-[#FFF8F0] border-b border-[#F1E7DC]">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="w-10 h-10 rounded-full bg-white items-center justify-center"
          >
            <Ionicons name="arrow-back" size={20} color="#0F172A" />
          </TouchableOpacity>

          <View className="flex-1 ml-3">
            <Text className="text-2xl font-extrabold text-[#0F172A]">
              Giỏ hàng
            </Text>

            <Text className="text-[#64748B] text-sm mt-1">
              {totalItems} sản phẩm • {invalidItems.length} cần kiểm tra
            </Text>
          </View>

          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={selectAllValidItems}
              className="w-10 h-10 rounded-full bg-white items-center justify-center mr-2"
            >
              <Ionicons name="checkmark-done-outline" size={20} color="#0F172A" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={clearAllConfirm}
              className="w-10 h-10 rounded-full bg-white items-center justify-center"
            >
              <Ionicons name="trash-outline" size={20} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>

        {invalidItems.length > 0 ? (
          <View className="mt-4 bg-[#FEF2F2] border border-[#FECACA] rounded-2xl p-3">
            <View className="flex-row items-start">
              <Ionicons name="alert-circle-outline" size={20} color="#B91C1C" />

              <View className="flex-1 ml-2">
                <Text className="text-[#B91C1C] font-extrabold">
                  Có sản phẩm chưa đủ điều kiện
                </Text>

                <Text className="text-[#991B1B] text-xs mt-1 leading-5">
                  Một số sản phẩm có thể đã hết hàng, hết hạn, thiếu hạn sử dụng
                  hoặc thiếu thông tin nhà bán.
                </Text>

                <TouchableOpacity onPress={removeInvalidItemsConfirm} className="mt-2">
                  <Text className="text-[#B91C1C] text-xs font-extrabold">
                    Xoá sản phẩm lỗi
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : (
          <View className="mt-4 bg-[#ECFDF5] border border-[#BBF7D0] rounded-2xl p-3">
            <View className="flex-row items-start">
              <Ionicons name="shield-checkmark-outline" size={20} color="#047857" />

              <Text className="text-[#047857] text-xs leading-5 font-semibold flex-1 ml-2">
                Giỏ hàng đang hợp lệ. Với thực phẩm chức năng, hệ thống sẽ kiểm tra
                tồn kho, hạn sử dụng và trạng thái sản phẩm trước khi thanh toán.
              </Text>
            </View>
          </View>
        )}
      </View>

      <ScrollView
        className="px-3"
        contentContainerStyle={{
          paddingTop: 12,
          paddingBottom: 150,
        }}
        showsVerticalScrollIndicator={false}
      >
        {!grouped || grouped.length === 0 ? (
          <EmptyComponent />
        ) : (
          grouped.map(group => (
            <CartShopGroup
              key={group.shopId}
              group={group}
              selectMode={selectMode}
              selectedIds={selectedIds}
              qtyInputs={qtyInputs}
              validations={validations}
              onToggleShop={toggleSelectShop}
              onToggleItem={toggleSelectItem}
              onIncrease={onIncrease}
              onDecrease={onDecrease}
              onChangeQuantityText={onChangeQuantityText}
              onCommitQuantity={commitQuantity}
              onRemove={onRemove}
              onPressItemDetail={goToProductDetail}
            />
          ))
        )}
      </ScrollView>

      <CartCheckoutBar
        total={totalSelectedPrice}
        selectedCount={selectedValidItems.length}
        invalidCount={selectedInvalidItems.length}
        disabled={checkoutDisabled}
        loading={checkoutLoading}
        onCheckout={handleCheckout}
      />

      <Toast
        visible={toastVisible}
        message={toastMsg}
        type={toastType}
        onHidden={() => setToastVisible(false)}
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