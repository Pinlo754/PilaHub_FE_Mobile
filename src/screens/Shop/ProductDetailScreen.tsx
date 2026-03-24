import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Dimensions,
  ScrollView,
  Animated,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { getProductById, ProductItem, normalizeImageUrl } from '../../services/products';
import { getProductReviews } from '../../services/productReviews';
import { formatVND } from '../../utils/number';
import Ionicons from '@react-native-vector-icons/ionicons';
import { useCart } from '../../context/CartContext';
import Toast from '../../components/Toast';
import VendorCard from './components/VendorCard';

type Props = NativeStackScreenProps<RootStackParamList, 'ProductDetail'>;

const { width } = Dimensions.get('window');
const IMAGE_HEIGHT = Math.round(width * 0.85 * 0.6);

// app palette used across this screen
const COLORS = {
  primary: '#CD853F', // teal
  accent: '#7c3aed', // violet
  warm: '#F59E0B', // amber
  text: '#0F172A',
  muted: '#6B7280',
  bg: '#FFFAF0', // very light teal background
  card: '#FFFFFF',
};

// Enhanced header with badges, chips and clear layout
const ProductHeader = ({ product, rating, reviewCount, vendor, category, _stock, quantity, setQuantity, showFullDesc, setShowFullDesc, }: { product: ProductItem; rating: number; reviewCount: number; vendor: string | null; category: string | null; _stock: number | null; quantity: number; setQuantity: (v: number) => void; showFullDesc: boolean; setShowFullDesc: (s: boolean) => void; }) => {
  const installationSupported = Boolean(product.installationSupported ?? product.raw?.installationSupported ?? product.raw?.installation_supported ?? false);

  return (
    <View className="w-full">
      <View style={localStyles.cardContainer} className="mx-4 -mt-12 rounded-xl shadow-md">
        <Text className="text-[20px] font-extrabold text-[#0F172A]" numberOfLines={2}>{product.name ?? product.productId}</Text>

        <View className="flex-row items-start justify-between mt-2">
          <View>
            <Text className="text-[26px] font-black" style={{ color: COLORS.primary }}>{formatVND(product.price ?? 0)}</Text>
            <View className="flex-row items-center mt-2">
              <View className="flex-row items-center bg-white rounded-full px-2 py-1">
                <Ionicons name="star" size={14} color={COLORS.warm} />
                <Text className="ml-2 font-bold text-[#0F172A]">{rating.toFixed(1)}</Text>
                <Text className="ml-2 text-sm text-[#6B7280]">({reviewCount})</Text>
              </View>

              {installationSupported ? (
                <View className="ml-3 px-3 py-1 rounded-full flex-row items-center" style={{ backgroundColor: COLORS.primary }}>
                  <Ionicons name="construct" size={14} color="#fff" />
                  <Text className="ml-2 font-bold text-white">Hỗ trợ lắp đặt</Text>
                </View>
              ) : null}
            </View>
          </View>

          <View className="items-end max-w-[120px]">
            {vendor ? <Text className="text-sm text-[#6B7280]">Nhà bán</Text> : null}
            {vendor ? <Text className="font-bold text-[#0F172A]">{vendor}</Text> : null}
            {category ? <Text className="text-sm text-[#6B7280] mt-2">Danh mục</Text> : null}
            {category ? <Text className="font-bold text-[#0F172A]">{category}</Text> : null}
          </View>
        </View>

        <View className="flex-row items-center justify-between mt-4">
          <View className="flex-row items-center bg-white rounded-lg px-2 py-1">
            <TouchableOpacity onPress={() => setQuantity(Math.max(1, quantity - 1))} className="px-3"><Text className="text-lg">−</Text></TouchableOpacity>
            <Text className="px-4 font-bold">{quantity}</Text>
            <TouchableOpacity onPress={() => setQuantity(quantity + 1)} className="px-3"><Text className="text-lg">+</Text></TouchableOpacity>
          </View>

          <TouchableOpacity onPress={() => setShowFullDesc(!showFullDesc)} className="px-3 py-2">
            <Text className="text-teal-500 font-bold">{showFullDesc ? 'Rút gọn' : 'Xem mô tả'}</Text>
          </TouchableOpacity>
        </View>
      </View>
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
  const REVIEWS_PAGE_SIZE = 5;
  const [activeImage, setActiveImage] = useState(0);

  const [toastVisible, setToastVisible] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState<'success'|'error'|'info'>('success');

  useEffect(() => {
    if (!productId) return;

    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const p = await getProductById(productId);
        if (!p) {
          Alert.alert('Lỗi', 'Không tìm thấy sản phẩm');
          navigation.goBack();
          return;
        }
        if (mounted) setProduct(p);
      } catch (e) {
        console.warn(e);
        Alert.alert('Lỗi', 'Không thể tải sản phẩm');
        navigation.goBack();
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, [productId, navigation]);

  // load reviews once product is set
  useEffect(() => {
    if (!product) return;
    let mounted = true;
    (async () => {
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
    })();
    return () => { mounted = false; };
  }, [product]);

  const rating = useMemo(() => Number(product?.raw?.avgRating ?? 0), [product]);
  const reviewCount = useMemo(() => Number(product?.raw?.reviewCount ?? 0), [product]);
  const category = product?.raw?.categoryName ?? null;
  const stock = product?.raw?.stockQuantity ?? null;

  const { addToCart, clearCart } = useCart();
  const [buying, setBuying] = useState(false);

  // image animation refs (unchanging order)
  const imageOpacityRef = React.useRef(new Animated.Value(0));
  const imageOpacity = imageOpacityRef.current;
  const onImageLoad = () => {
    Animated.timing(imageOpacity, { toValue: 1, duration: 350, useNativeDriver: true }).start();
  };

  const onAddToCart = async () => {
    try {
      console.log('[ProductDetail] addToCart payload', { productId: product?.productId, quantity, price: product?.price ?? 0 });
      const item = {
        product_id: product!.productId,
        product_name: product!.name,
        thumnail_url: product!.thumbnailUrl ?? product!.thumnail_url ?? product!.imageUrl ?? undefined,
        price: product!.price ?? 0,
        raw: product!.raw,
      };

      await addToCart(item, quantity);
      setToastMsg('Đã thêm vào giỏ hàng');
      setToastType('success');
      setToastVisible(true);
    } catch (e) {
      console.warn('add to cart failed', e);
      setToastMsg('Không thể thêm vào giỏ');
      setToastType('error');
      setToastVisible(true);
    }
  };

  // open cart
  const openCart = () => {
    navigation.navigate('Cart' as any);
  };

  const onBuyNow = async () => {
    if (!product) return;
    setBuying(true);
    try {
      console.log('[ProductDetail] buyNow start', { productId: product.productId, quantity, unitPrice: product.price ?? 0, total: (product.price ?? 0) * quantity });
      // Clear existing cart, add only this product, then go to Checkout
      await clearCart();
      const item = {
        product_id: product.productId,
        product_name: product.name,
        thumnail_url: product.thumbnailUrl ?? product!.thumnail_url ?? product!.imageUrl ?? undefined,
        price: product.price ?? 0,
        raw: product.raw,
      };
      console.log('[ProductDetail] buyNow add item', { item, quantity });
      await addToCart(item, quantity);
      navigation.navigate('Checkout' as any);
    } catch (e) {
      console.warn('buy now failed', e);
      Alert.alert('Lỗi', 'Không thể thực hiện mua ngay.');
    } finally {
      setBuying(false);
    }
  };

  if (loading) return (
    <View className="flex-1 items-center justify-center" style={{ backgroundColor: COLORS.bg }}>
      <ActivityIndicator />
    </View>
  );

  if (!product) return (
    <View className="flex-1 items-center justify-center" style={{ backgroundColor: COLORS.bg }}>
      <Text className="text-sm text-[#6B7280]">Không tìm thấy sản phẩm</Text>
    </View>
  );

  const images = (() => {
    const imgs: string[] = [];
    const v = product.raw;
    if (Array.isArray(v?.images) && v.images.length) imgs.push(...v.images);
    if (v?.imageUrl) imgs.push(v.imageUrl);
    if (imgs.length === 0) imgs.push('https://via.placeholder.com/800x600.png?text=No+Image');
    // normalize possible relative urls
    return imgs.map(u => normalizeImageUrl(u) || u);
  })();

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: COLORS.bg }}>
      {/* Custom header: back, centered title, actions */}
      <View className="flex-row items-center justify-between px-3 py-2" style={{ backgroundColor: COLORS.bg }}>
        <TouchableOpacity onPress={() => navigation.goBack()} className="p-2 rounded">
          <Ionicons name="arrow-back" size={20} color={COLORS.text} />
        </TouchableOpacity>

        <Text className="text-[18px] font-extrabold" style={{ color: COLORS.primary }}>Chi tiết sản phẩm</Text>

        <View className="flex-row items-center">
          <TouchableOpacity className="p-2 rounded" onPress={() => {}}>
            <Ionicons name="notifications-outline" size={20} color={COLORS.muted} />
          </TouchableOpacity>
          <TouchableOpacity className="p-2 rounded" onPress={openCart}>
            <Ionicons name="cart-outline" size={20} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={localStyles.scrollContent}>
        {/* Image carousel */}
        <View className="w-full items-center bg-white pt-3">
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const idx = Math.round(e.nativeEvent.contentOffset.x / width);
              setActiveImage(idx);
            }}
          >
            {images.map((src, i) => (
              <View key={`img_${i}`} style={localStyles.imageWrapper}>
                <Animated.Image source={{ uri: src }} style={[localStyles.mainImage, { opacity: imageOpacity }]} resizeMode="cover" onLoad={onImageLoad} />
              </View>
            ))}
          </ScrollView>

          <View className="absolute bottom-3 left-0 right-0 flex-row justify-center">
            {images.map((_, i) => (
              <View key={`dot_${i}`} className={`${i === activeImage ? 'bg-amber-400 w-4' : 'bg-white w-2'} h-2 rounded-full mx-1`} />
            ))}
          </View>
        </View>

        {/* Product info header below images */}
        <ProductHeader
          product={product}
          rating={rating}
          reviewCount={reviewCount}
          vendor={null}
          category={category}
          _stock={stock}
          quantity={quantity}
          setQuantity={setQuantity}
          showFullDesc={showFullDesc}
          setShowFullDesc={setShowFullDesc}
        />

        {/* Reviews summary + list (moved above vendor) */}
        <View className="mt-4">
          <View className="flex-row justify-between items-center px-4 mt-4">
            <Text className="text-[16px] font-extrabold text-[#0F172A]">Đánh giá sản phẩm</Text>
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
                  <Text className="ml-2 text-sm text-[#6B7280]">{reviewCount} đánh giá</Text>
                </View>
                <Text className="text-sm text-[#6B7280] mt-1">{reviewsTotal} tổng</Text>
              </View>
            </View>
          </View>

          {reviewsLoading ? (
            <ActivityIndicator />
          ) : (
            <View className="mx-4 mt-3">
              {(reviews || []).slice(0, 3).map((r, i) => (
                <View key={`rev_${r.id}_${i}`} className="bg-white p-3 rounded-xl mb-3">
                  <View className="flex-row justify-between items-center">
                    <Text className="font-bold">{r.author ?? 'Người dùng'}</Text>
                    <View className="flex-row items-center">
                      <Ionicons name="star" size={14} color={COLORS.warm} />
                      <Text className="ml-2 text-sm text-[#6B7280]">{r.rating?.toFixed?.(1) ?? r.rating}</Text>
                    </View>
                  </View>
                  {r.title ? <Text className="mt-2 font-bold">{r.title}</Text> : null}
                  {r.comment ? <Text className="mt-2 text-[#6B7280]">{r.comment}</Text> : null}
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Vendor card: fetch vendor info and suggested products (placed after reviews) */}
        {product?.raw?.vendorId ? (
          <VendorCard vendorId={product.raw.vendorId} onPressProduct={(p) => navigation.navigate('ProductDetail' as any, { productId: p.productId })} />
        ) : null}
      </ScrollView>

      <View className="absolute bottom-5 left-3 right-3 flex-row items-center rounded-xl p-3" style={localStyles.stickyBarShadow}>
        <View className="flex-1">
          <Text className="text-sm text-[#6B7280]">Tổng</Text>
          <Text className="text-[18px] font-extrabold text-[#0F172A]">{formatVND((product!.price ?? 0) * quantity)}</Text>
        </View>

        <View className="flex-row">
          <TouchableOpacity onPress={onAddToCart} className="bg-white px-4 py-3 rounded-lg mr-3 border border-gray-200">
            <Text className="font-semibold text-[#0F172A]">Thêm</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onBuyNow} className="px-5 py-3 rounded-lg" style={{ backgroundColor: COLORS.warm }} disabled={buying}>
            {buying ? <ActivityIndicator color="#fff" /> : <Text className="font-extrabold text-black">Mua ngay</Text>}
          </TouchableOpacity>
        </View>
      </View>

      <Toast visible={toastVisible} message={toastMsg} type={toastType} onHidden={() => setToastVisible(false)} />
    </SafeAreaView>
  );
};

const localStyles = StyleSheet.create({
  cardContainer: { backgroundColor: COLORS.card, padding: 18, width: width - 32 },
  scrollContent: { paddingBottom: 180 },
  imageWrapper: { width: width, height: IMAGE_HEIGHT, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.card },
  mainImage: { width: width - 32, height: IMAGE_HEIGHT - 20, borderRadius: 14, backgroundColor: COLORS.card },
  stickyBarShadow: { backgroundColor: COLORS.card, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 18, elevation: 6 },
});

export default ProductDetailScreen;
