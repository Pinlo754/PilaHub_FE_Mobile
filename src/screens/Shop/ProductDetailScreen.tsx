import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  Animated,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useIsFocused } from '@react-navigation/native';
import Ionicons from '@react-native-vector-icons/ionicons';

import { RootStackParamList } from '../../navigation/AppNavigator';
import { getProductById, ProductItem, normalizeImageUrl } from '../../services/products';
import { getProductReviews } from '../../services/productReviews';
import { formatVND } from '../../utils/number';
import { colors } from '../../theme/colors';
import { useCart } from '../../context/CartContext';
import Toast from '../../components/Toast';
import ModalPopup from '../../components/ModalPopup';
import VendorCard from './components/VendorCard';
import ProductPurchaseInfo from './components/ProductPurchaseInfo';
import { validateCartItem } from './utils/cartValidation';
import { getSupplementById, SupplementDetail } from '../../hooks/supplement';

type Props = NativeStackScreenProps<RootStackParamList, 'ProductDetail'>;

const { width } = Dimensions.get('window');
const IMAGE_HEIGHT = Math.round(width * 0.85 * 0.6);

const COLORS = {
  default: '#A0522D',
  primary: '#CD853F',
  accent: '#7c3aed',
  warm: '#F59E0B',
  text: '#0F172A',
  muted: '#6B7280',
  bg: '#FFFAF0',
  card: '#FFFFFF',
  danger: '#B91C1C',
  dangerBg: '#FEF2F2',
  warning: '#C2410C',
  warningBg: '#FFF7ED',
};

const getProductId = (product: ProductItem | any): string => {
  return String(
    product?.productId ??
      product?.product_id ??
      product?.id ??
      product?.raw?.productId ??
      product?.raw?.product_id ??
      product?.raw?.id ??
      '',
  );
};

const getProductName = (product: ProductItem | any): string => {
  return String(
    product?.name ??
      product?.product_name ??
      product?.productName ??
      product?.raw?.name ??
      product?.raw?.productName ??
      product?.raw?.product_name ??
      'Sản phẩm',
  );
};

const getCategoryType = (product: ProductItem | any): string => {
  return String(
    product?.categoryType ??
      product?.category_type ??
      product?.raw?.categoryType ??
      product?.raw?.category_type ??
      product?.category?.categoryType ??
      product?.category?.category_type ??
      '',
  ).toUpperCase();
};

const isSupplementProduct = (product: ProductItem | any): boolean => {
  return getCategoryType(product) === 'SUPPLEMENT';
};

const getSupplementId = (product: ProductItem | any): string => {
  return String(
    product?.supplementId ??
      product?.supplement_id ??
      product?.raw?.supplementId ??
      product?.raw?.supplement_id ??
      product?.raw?.supplement?.supplementId ??
      product?.raw?.supplement?.supplement_id ??
      getProductId(product) ??
      '',
  );
};

const buildSupplementWarningMessage = (supplement: SupplementDetail | null) => {
  if (!supplement) {
    return 'Đây là thực phẩm bổ sung. Vui lòng đọc kỹ hướng dẫn sử dụng, cảnh báo và tham khảo chuyên gia nếu cần trước khi dùng.';
  }

  const parts: string[] = [];

  if (supplement.warnings) {
    parts.push(`Cảnh báo:\n${supplement.warnings}`);
  }

  if (supplement.contraindications) {
    parts.push(`Chống chỉ định:\n${supplement.contraindications}`);
  }

  if (supplement.sideEffects) {
    parts.push(`Tác dụng phụ:\n${supplement.sideEffects}`);
  }

  if (supplement.usageInstructions) {
    parts.push(`Hướng dẫn sử dụng:\n${supplement.usageInstructions}`);
  }

  if (parts.length === 0) {
    return 'Đây là thực phẩm bổ sung. Vui lòng đọc kỹ thông tin sản phẩm và tham khảo chuyên gia nếu cần trước khi dùng.';
  }

  return parts.join('\n\n');
};

const buildRawForCart = (product: ProductItem | any) => {
  const categoryType =
    product?.raw?.categoryType ??
    product?.raw?.category_type ??
    product?.categoryType ??
    product?.category_type ??
    product?.category?.categoryType ??
    product?.category?.category_type;

  return {
    ...(product?.raw ?? {}),

    productId: getProductId(product),
    product_id: getProductId(product),

    categoryType,
    category_type: categoryType,

    categoryName:
      product?.raw?.categoryName ??
      product?.raw?.category_name ??
      product?.categoryName ??
      product?.category_name ??
      product?.category,

    stockQuantity:
      product?.raw?.stockQuantity ??
      product?.raw?.stock_quantity ??
      product?.raw?.stock ??
      product?.stockQuantity ??
      product?.stock_quantity ??
      product?.stock,

    expiryDate:
      product?.raw?.expiryDate ??
      product?.raw?.expiry_date ??
      product?.raw?.expirationDate ??
      product?.raw?.expiration_date ??
      product?.expiryDate ??
      product?.expiry_date ??
      product?.expirationDate ??
      product?.expiration_date,

    vendorId:
      product?.raw?.vendorId ??
      product?.raw?.vendor_id ??
      product?.raw?.merchantId ??
      product?.raw?.merchant_id ??
      product?.raw?.shopId ??
      product?.raw?.shop_id ??
      product?.vendorId ??
      product?.vendor_id ??
      product?.shopId ??
      product?.shop_id,

    vendorBusinessName:
      product?.raw?.vendorBusinessName ??
      product?.raw?.vendor_business_name ??
      product?.raw?.businessName ??
      product?.raw?.business_name ??
      product?.raw?.shopName ??
      product?.raw?.shop_name ??
      product?.raw?.merchantName ??
      product?.raw?.merchant_name ??
      product?.vendorBusinessName ??
      product?.vendor_business_name ??
      product?.shopName ??
      product?.shop_name,

    status:
      product?.raw?.status ??
      product?.raw?.productStatus ??
      product?.raw?.product_status ??
      product?.raw?.state ??
      product?.raw?.isActive ??
      product?.raw?.is_active ??
      product?.raw?.allowSale ??
      product?.raw?.allow_sale ??
      product?.raw?.isAvailable ??
      product?.raw?.is_available ??
      product?.status ??
      product?.productStatus,

    installationSupported:
      product?.raw?.installationSupported ??
      product?.raw?.installation_supported ??
      product?.raw?.isInstallationSupported ??
      product?.raw?.supportsInstallation ??
      product?.installationSupported ??
      product?.installation_supported ??
      product?.isInstallationSupported ??
      product?.supportsInstallation,

    supplementId:
      product?.supplementId ??
      product?.supplement_id ??
      product?.raw?.supplementId ??
      product?.raw?.supplement_id,
  };
};

const InfoLine = ({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) => {
  if (value === undefined || value === null || value === '') return null;

  return (
    <View className="mb-3">
      <Text className="text-xs font-bold text-[#64748B] mb-1">{label}</Text>
      <Text className="text-sm leading-5 text-[#334155]">{String(value)}</Text>
    </View>
  );
};

const ProductDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { productId } = (route.params as any) ?? {};

  const [product, setProduct] = useState<ProductItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [showFullDesc, setShowFullDesc] = useState(false);

  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewsTotal, setReviewsTotal] = useState(0);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  const [activeImage, setActiveImage] = useState(0);
  const [buying, setBuying] = useState(false);

  const [supplementDetail, setSupplementDetail] = useState<SupplementDetail | null>(null);
  const [supplementLoading, setSupplementLoading] = useState(false);

  const [toastVisible, setToastVisible] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');

  const [modalState, setModalState] = useState<any>({
    visible: false,
    mode: 'noti',
    message: '',
  });

  const showModal = (opts: {
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
        try {
          setModalState((s: any) => ({ ...s, visible: false }));
        } catch {}

        if (opts.onConfirm) opts.onConfirm();
      },
    });
  };

  const closeModal = () => setModalState((s: any) => ({ ...s, visible: false }));

  const REVIEWS_PAGE_SIZE = 5;

  const { addToCart, clearCart, totalItems, loadCart } = useCart();
  const isFocused = useIsFocused();

  const imageOpacityRef = React.useRef(new Animated.Value(0));
  const imageOpacity = imageOpacityRef.current;

  const rawForCart = useMemo(() => {
    if (!product) return {};
    return buildRawForCart(product);
  }, [product]);

  const productIdValue = useMemo(() => {
    if (!product) return '';
    return getProductId(product);
  }, [product]);

  const productNameValue = useMemo(() => {
    if (!product) return 'Sản phẩm';
    return getProductName(product);
  }, [product]);

  const isSupplement = useMemo(() => {
    if (!product) return false;
    return isSupplementProduct(product);
  }, [product]);

  const cartLikeItem = useMemo(() => {
    if (!product) return null;

    return {
      product_id: productIdValue,
      product_name: productNameValue,
      thumnail_url:
        product.thumbnailUrl ??
        product.thumnail_url ??
        product.imageUrl ??
        (rawForCart as any).thumbnailUrl ??
        (rawForCart as any).thumnail_url ??
        (rawForCart as any).imageUrl ??
        undefined,
      price: Number(product.price ?? (rawForCart as any).price ?? 0),
      quantity,
      raw: rawForCart,
    };
  }, [product, productIdValue, productNameValue, rawForCart, quantity]);

  const validation = useMemo(() => {
    if (!cartLikeItem) {
      return validateCartItem({
        product_id: '',
        product_name: '',
        price: 0,
        quantity: 0,
        raw: {},
      });
    }

    return validateCartItem(cartLikeItem as any);
  }, [cartLikeItem]);

  const stock = validation.stock;

  const rating = useMemo(
    () => Number(product?.raw?.avgRating ?? product?.avgRating ?? 0),
    [product],
  );

  const reviewCount = useMemo(
    () => Number(product?.raw?.reviewCount ?? product?.reviewCount ?? 0),
    [product],
  );

  const category =
    (rawForCart as any).categoryName ??
    product?.raw?.categoryName ??
    product?.raw?.category_name ??
    product?.categoryName ??
    null;

  const cannotPurchase = !validation.canCheckout;

  const showToast = (
    message: string,
    type: 'success' | 'error' | 'info' = 'info',
  ) => {
    setToastMsg(message);
    setToastType(type);
    setToastVisible(true);
  };

  useEffect(() => {
    if (!productId) return;

    let mounted = true;

    const loadProduct = async () => {
      setLoading(true);

      try {
        const p = await getProductById(productId);

        if (!p) {
          showModal({
            title: 'Lỗi',
            message: 'Không tìm thấy sản phẩm',
            mode: 'noti',
            onConfirm: () => navigation.goBack(),
          });
          return;
        }

        if (mounted) {
          setProduct(p);

          const raw = buildRawForCart(p);
          const tempValidation = validateCartItem({
            product_id: getProductId(p),
            product_name: getProductName(p),
            price: Number(p.price ?? raw.price ?? 0),
            quantity: 1,
            raw,
          } as any);

          if (tempValidation.stock !== null && tempValidation.stock > 0) {
            setQuantity(1);
          }
        }
      } catch (e) {
        console.warn('load product error', e);
        showModal({
          title: 'Lỗi',
          message: 'Không thể tải sản phẩm',
          mode: 'noti',
          onConfirm: () => navigation.goBack(),
        });
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadProduct();

    return () => {
      mounted = false;
    };
  }, [productId, navigation]);

  useEffect(() => {
    if (!product) return;

    let mounted = true;

    const loadSupplementDetail = async () => {
      if (!isSupplementProduct(product)) {
        setSupplementDetail(null);
        return;
      }

      const supplementId = getSupplementId(product);

      if (!supplementId) {
        setSupplementDetail(null);
        return;
      }

      try {
        setSupplementLoading(true);

        const data = await getSupplementById(supplementId);

        if (mounted) {
          setSupplementDetail(data);
        }
      } catch (error) {
        console.warn('getSupplementById failed', error);

        if (mounted) {
          setSupplementDetail(null);
        }
      } finally {
        if (mounted) setSupplementLoading(false);
      }
    };

    loadSupplementDetail();

    return () => {
      mounted = false;
    };
  }, [product]);

  useEffect(() => {
    if (!product) return;

    let mounted = true;

    const loadReviews = async () => {
      setReviewsLoading(true);

      try {
        const r = await getProductReviews(product.productId, 0, REVIEWS_PAGE_SIZE);

        if (mounted) {
          setReviews(r.items || []);
          setReviewsTotal(r.total || 0);
        }
      } catch (e) {
        console.warn('load reviews error', e);
      } finally {
        if (mounted) setReviewsLoading(false);
      }
    };

    loadReviews();

    return () => {
      mounted = false;
    };
  }, [product]);

  useEffect(() => {
    if (!isFocused) return;

    const refreshCart = async () => {
      try {
        await loadCart();
      } catch (e) {
        console.warn('load cart error', e);
      }
    };

    refreshCart();
  }, [isFocused, loadCart]);

  useEffect(() => {
    if (stock !== null && stock > 0 && quantity > stock) {
      setQuantity(stock);
    }
  }, [stock, quantity]);

  const onImageLoad = () => {
    Animated.timing(imageOpacity, {
      toValue: 1,
      duration: 350,
      useNativeDriver: true,
    }).start();
  };

  const openCart = () => {
    navigation.navigate('Cart' as any);
  };

  const validateBeforePurchase = () => {
    if (!product) return false;

    if (!productIdValue) {
      showToast('Sản phẩm thiếu mã định danh', 'error');
      return false;
    }

    if (!validation.canCheckout) {
      showToast(validation.errors[0] ?? 'Sản phẩm không đủ điều kiện mua', 'error');
      return false;
    }

    if (stock !== null && quantity > stock) {
      showToast(`Chỉ còn ${stock} sản phẩm trong kho`, 'error');
      setQuantity(stock);
      return false;
    }

    if (quantity <= 0) {
      showToast('Số lượng mua phải lớn hơn 0', 'error');
      setQuantity(1);
      return false;
    }

    return true;
  };

  const buildCartItem = () => {
    if (!product) return null;

    return {
      product_id: productIdValue,
      product_name: productNameValue,
      thumnail_url:
        product.thumbnailUrl ??
        product.thumnail_url ??
        product.imageUrl ??
        (rawForCart as any).thumbnailUrl ??
        (rawForCart as any).thumnail_url ??
        (rawForCart as any).imageUrl ??
        undefined,
      price: Number(product.price ?? (rawForCart as any).price ?? 0),
      raw: rawForCart,
    };
  };

  const confirmSupplementBeforeAction = (action: () => void | Promise<void>) => {
    if (!isSupplement) {
      action();
      return;
    }

    const message = buildSupplementWarningMessage(supplementDetail);

    showModal({
      title: 'Lưu ý khi sử dụng thực phẩm bổ sung',
      message,
      mode: 'confirm',
      onConfirm: () => {
        action();
      },
    });
  };

  const onAddToCart = async () => {
    if (!validateBeforePurchase()) return;

    const item = buildCartItem();
    if (!item) return;

    confirmSupplementBeforeAction(async () => {
      try {
        await addToCart(item, quantity);
        showToast('Đã thêm vào giỏ hàng', 'success');
      } catch (e) {
        console.warn('add to cart failed', e);
        showToast('Không thể thêm vào giỏ', 'error');
      }
    });
  };

  const onBuyNow = async () => {
    if (!validateBeforePurchase()) return;

    const item = buildCartItem();
    if (!item) return;

    confirmSupplementBeforeAction(() => {
      const total = Number(product?.price ?? (rawForCart as any).price ?? 0) * quantity;

      showModal({
        title: 'Xác nhận thanh toán',
        message: `Vui lòng kiểm tra kỹ thông tin trước khi tiếp tục.\n\nSản phẩm: ${productNameValue}\nSố lượng: ${quantity}\nTổng tiền: ${formatVND(total)}\n\nBạn có muốn chuyển đến trang thanh toán không?`,
        mode: 'confirm',
        onConfirm: async () => {
          setBuying(true);

          try {
            await clearCart();
            await addToCart(item, quantity);
            navigation.navigate('Checkout' as any);
          } catch (e) {
            console.warn('buy now failed', e);
            showToast('Không thể thực hiện mua ngay', 'error');
          } finally {
            setBuying(false);
          }
        },
      });
    });
  };

  const images = useMemo(() => {
    if (!product) return [];

    const imgs: string[] = [];
    const raw = product.raw;

    if (Array.isArray(raw?.images) && raw.images.length) {
      imgs.push(...raw.images);
    }

    if (raw?.imageUrl) {
      imgs.push(raw.imageUrl);
    }

    if (product.imageUrl) {
      imgs.push(product.imageUrl);
    }

    if (product.thumbnailUrl) {
      imgs.push(product.thumbnailUrl);
    }

    if (imgs.length === 0) {
      imgs.push('https://via.placeholder.com/800x600.png?text=No+Image');
    }

    const uniqueImages = Array.from(new Set(imgs));

    return uniqueImages.map(u => normalizeImageUrl(u) || u);
  }, [product]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: COLORS.bg }}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!product) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: COLORS.bg }}>
        <Text className="text-sm text-[#6B7280]">Không tìm thấy sản phẩm</Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: COLORS.bg }}>
      <View className="px-4 pt-6 pb-3">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity onPress={() => navigation.goBack()} className="p-2 rounded">
            <Ionicons name="arrow-back" size={22} color={colors.foreground} />
          </TouchableOpacity>

          <Text className="text-[18px] font-extrabold" style={{ color: colors.foreground }}>
            Chi tiết sản phẩm
          </Text>

          <View className="flex-row items-center">
            <TouchableOpacity className="p-2 rounded" onPress={() => {}}>
              <Ionicons name="notifications-outline" size={22} color={colors.foreground} />
            </TouchableOpacity>

            <View style={localStyles.cartWrap} className="relative">
              <TouchableOpacity onPress={openCart} className="rounded">
                <Ionicons name="cart-outline" size={22} color={colors.foreground} />
              </TouchableOpacity>

              {totalItems > 0 ? (
                <View style={localStyles.badgeWrap}>
                  <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>
                    {totalItems > 99 ? '99+' : totalItems}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={localStyles.scrollContent}>
        <View className="w-full items-center bg-white pt-3">
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={e => {
              const idx = Math.round(e.nativeEvent.contentOffset.x / width);
              setActiveImage(idx);
            }}
          >
            {images.map((src, i) => (
              <View key={`img_${i}`} style={localStyles.imageWrapper}>
                <Animated.Image
                  source={{ uri: src }}
                  style={[localStyles.mainImage, { opacity: imageOpacity }]}
                  resizeMode="cover"
                  onLoad={onImageLoad}
                />
              </View>
            ))}
          </ScrollView>

          <View className="absolute bottom-3 left-0 right-0 flex-row justify-center">
            {images.map((_, i) => (
              <View
                key={`dot_${i}`}
                className={`${i === activeImage ? 'bg-amber-400 w-4' : 'bg-white w-2'} h-2 rounded-full mx-1`}
              />
            ))}
          </View>
        </View>

        <ProductPurchaseInfo
          product={product}
          rating={rating}
          reviewCount={reviewCount}
          vendor={validation.vendorName}
          category={category}
          quantity={quantity}
          setQuantity={setQuantity}
          showFullDesc={showFullDesc}
          setShowFullDesc={setShowFullDesc}
          validation={validation}
        />

        {isSupplement ? (
          <View className="bg-white rounded-2xl p-4 mx-4 mt-4 border border-red-100">
            <View className="flex-row items-center mb-3">
              <View className="w-10 h-10 rounded-2xl bg-red-50 items-center justify-center mr-3">
                <Ionicons name="medical-outline" size={20} color={COLORS.danger} />
              </View>

              <View className="flex-1">
                <Text className="text-[16px] font-extrabold text-[#0F172A]">
                  Thông tin thực phẩm bổ sung
                </Text>
                <Text className="text-xs text-[#64748B] mt-1">
                  Vui lòng đọc kỹ trước khi mua và sử dụng
                </Text>
              </View>
            </View>

            {supplementLoading ? (
              <View className="py-4 items-center">
                <ActivityIndicator />
                <Text className="text-xs text-[#64748B] mt-2">
                  Đang tải thông tin supplement...
                </Text>
              </View>
            ) : supplementDetail ? (
              <View>
                <InfoLine label="Dạng sản phẩm" value={supplementDetail.form} />
                <InfoLine label="Thương hiệu" value={supplementDetail.brand} />
                <InfoLine label="Hướng dẫn sử dụng" value={supplementDetail.usageInstructions} />
                <InfoLine label="Lợi ích" value={supplementDetail.benefits} />
                <InfoLine label="Tác dụng phụ" value={supplementDetail.sideEffects} />

                {supplementDetail.warnings ? (
                  <View className="bg-[#FEF2F2] rounded-2xl p-3 mt-2 border border-[#FECACA]">
                    <Text className="text-[#B91C1C] font-extrabold mb-1">
                      Cảnh báo
                    </Text>
                    <Text className="text-[#991B1B] text-sm leading-5">
                      {supplementDetail.warnings}
                    </Text>
                  </View>
                ) : null}

                {supplementDetail.contraindications ? (
                  <View className="bg-[#FFF7ED] rounded-2xl p-3 mt-3 border border-[#FED7AA]">
                    <Text className="text-[#C2410C] font-extrabold mb-1">
                      Chống chỉ định
                    </Text>
                    <Text className="text-[#9A3412] text-sm leading-5">
                      {supplementDetail.contraindications}
                    </Text>
                  </View>
                ) : null}
              </View>
            ) : (
              <View className="bg-[#FFF7ED] rounded-2xl p-3">
                <Text className="text-sm text-[#64748B] leading-5">
                  Chưa có thông tin supplement chi tiết.
                </Text>
              </View>
            )}
          </View>
        ) : null}

        {showFullDesc ? (
          <View className="bg-white rounded-2xl p-4 mx-4 mt-4">
            <Text className="text-[16px] font-extrabold text-[#0F172A] mb-2">
              Mô tả sản phẩm
            </Text>

            <Text className="text-sm leading-6 text-[#475569]">
              {product.description ??
                product.raw?.description ??
                product.raw?.shortDescription ??
                'Sản phẩm chưa có mô tả.'}
            </Text>
          </View>
        ) : null}

        <View className="mt-4">
          <View className="flex-row justify-between items-center px-4 mt-4">
            <Text className="text-[16px] font-extrabold text-[#0F172A]">
              Đánh giá sản phẩm
            </Text>

            <TouchableOpacity onPress={() => {}}>
              <Text className="text-teal-500 font-bold">Xem tất cả</Text>
            </TouchableOpacity>
          </View>

          <View className="bg-white rounded-xl p-4 mx-4 mt-2">
            <View className="flex-row items-center">
              <Text className="text-[28px] font-black mr-3">{rating.toFixed(1)}</Text>

              <View>
                <View className="flex-row items-center">
                  <Ionicons name="star" size={18} color={COLORS.warm} />
                  <Text className="ml-2 text-sm text-[#6B7280]">
                    {reviewCount} đánh giá
                  </Text>
                </View>

                <Text className="text-sm text-[#6B7280] mt-1">
                  {reviewsTotal} tổng
                </Text>
              </View>
            </View>
          </View>

          {reviewsLoading ? (
            <ActivityIndicator style={{ marginTop: 16 }} />
          ) : (
            <View className="mx-4 mt-3">
              {(reviews || []).slice(0, 3).map((r, i) => (
                <View key={`rev_${r.id}_${i}`} className="bg-white p-3 rounded-xl mb-3">
                  <View className="flex-row justify-between items-center">
                    <Text className="font-bold">{r.author ?? 'Người dùng'}</Text>

                    <View className="flex-row items-center">
                      <Ionicons name="star" size={14} color={COLORS.warm} />
                      <Text className="ml-2 text-sm text-[#6B7280]">
                        {r.rating?.toFixed?.(1) ?? r.rating}
                      </Text>
                    </View>
                  </View>

                  {r.title ? <Text className="mt-2 font-bold">{r.title}</Text> : null}

                  {r.comment ? (
                    <Text className="mt-2 text-[#6B7280]">{r.comment}</Text>
                  ) : null}
                </View>
              ))}

              {!reviewsLoading && reviews.length === 0 ? (
                <View className="bg-white p-4 rounded-xl mb-3">
                  <Text className="text-center text-[#64748B]">
                    Chưa có đánh giá nào
                  </Text>
                </View>
              ) : null}
            </View>
          )}
        </View>

        {(rawForCart as any)?.vendorId ? (
          <VendorCard
            vendorId={(rawForCart as any).vendorId}
            onPressProduct={p =>
              navigation.navigate('ProductDetail' as any, { productId: p.productId })
            }
          />
        ) : null}
      </ScrollView>

      <View
        className="absolute bottom-5 left-3 right-3 flex-row items-center rounded-xl p-3"
        style={localStyles.stickyBarShadow}
      >
        <View className="flex-1">
          <Text className="text-sm text-[#6B7280]">Tổng</Text>
          <Text className="text-[18px] font-extrabold text-[#0F172A]">
            {formatVND(Number(product.price ?? (rawForCart as any).price ?? 0) * quantity)}
          </Text>

          {cannotPurchase ? (
            <Text className="text-xs text-red-600 font-semibold mt-1" numberOfLines={1}>
              {validation.errors[0] ?? 'Sản phẩm không đủ điều kiện'}
            </Text>
          ) : null}
        </View>

        <View className="flex-row">
          <TouchableOpacity
            onPress={onAddToCart}
            className="bg-white px-4 py-3 rounded-lg mr-3 border border-gray-200"
            disabled={cannotPurchase}
            style={{ opacity: cannotPurchase ? 0.5 : 1 }}
          >
            <Text className="font-semibold text-[#0F172A]">Thêm</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onBuyNow}
            className="px-5 py-3 rounded-lg"
            style={{
              backgroundColor: COLORS.default,
              opacity: buying || cannotPurchase ? 0.6 : 1,
            }}
            disabled={buying || cannotPurchase}
          >
            {buying ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="font-extrabold text-white  ">Mua ngay</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

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
};

const localStyles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 180,
  },
  imageWrapper: {
    width,
    height: IMAGE_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.card,
  },
  mainImage: {
    width: width - 32,
    height: IMAGE_HEIGHT - 20,
    borderRadius: 14,
    backgroundColor: COLORS.card,
  },
  stickyBarShadow: {
    backgroundColor: COLORS.card,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 6,
  },
  cartWrap: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeWrap: {
    position: 'absolute',
    right: -2,
    top: -4,
    backgroundColor: '#F59E0B',
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ProductDetailScreen;