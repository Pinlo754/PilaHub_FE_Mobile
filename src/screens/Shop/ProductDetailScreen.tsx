import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Dimensions,
  ScrollView,
  Animated,
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

type Props = NativeStackScreenProps<RootStackParamList, 'ProductDetail'>;

const { width } = Dimensions.get('window');
const IMAGE_HEIGHT = Math.round(width * 0.85 * 0.6);

// Header component moved outside main render to satisfy lint rules
const ProductHeader = ({
  product,
  rating,
  reviewCount,
  vendor,
  category,
  stock,
  quantity,
  setQuantity,
  showFullDesc,
  setShowFullDesc,
}: {
  product: ProductItem;
  rating: number;
  reviewCount: number;
  vendor: string | null;
  category: string | null;
  stock: number | null;
  quantity: number;
  setQuantity: (v: number) => void;
  showFullDesc: boolean;
  setShowFullDesc: (s: boolean) => void;
}) => {
  return (
    <SafeAreaView style={styles.headerWrap}>
      <Text style={styles.productTitle}>{product.product_name}</Text>

      <View style={styles.priceRow}>
        <Text style={styles.priceText}>{formatVND(product.price)}</Text>
        <View style={styles.ratingBadge}>
          <Ionicons name="star" size={16} color="#F59E0B" />
          <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
          <Text style={styles.reviewCount}>({reviewCount})</Text>
        </View>
      </View>

      <View style={styles.metaRow}>
        <View>
          {vendor ? <Text style={styles.metaLabel}>Nhà bán: <Text style={styles.metaValue}>{vendor}</Text></Text> : null}
          {category ? <Text style={[styles.metaLabel, { marginTop: 6 }]}>Danh mục: <Text style={styles.metaValue}>{category}</Text></Text> : null}
        </View>
        <View style={styles.stockWrap}>
          <Text style={styles.metaLabel}>Kho:</Text>
          <Text style={styles.metaValue}>{stock ?? '-'}</Text>
        </View>
      </View>

      <View style={styles.qtyRow}>
        <Text style={styles.qtyLabel}>Số lượng</Text>
        <View style={styles.qtyControl}>
          <TouchableOpacity onPress={() => setQuantity(Math.max(1, quantity - 1))} style={styles.qtyBtn}><Text style={styles.qtyBtnText}>−</Text></TouchableOpacity>
          <Text style={styles.qtyCount}>{quantity}</Text>
          <TouchableOpacity onPress={() => setQuantity(quantity + 1)} style={styles.qtyBtn}><Text style={styles.qtyBtnText}>+</Text></TouchableOpacity>
        </View>
      </View>

      <View style={styles.sectionWrap}>
        <Text style={styles.sectionTitle}>Mô tả sản phẩm</Text>
        <Text style={styles.sectionBody} numberOfLines={showFullDesc ? undefined : 4}>{product.raw?.description ?? '-'}</Text>
        <TouchableOpacity style={styles.showMoreWrap} onPress={() => setShowFullDesc(!showFullDesc)}>
          <Text style={styles.showMore}>{showFullDesc ? 'Rút gọn' : 'Xem thêm'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
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
        const r = await getProductReviews(product.product_id, 0, REVIEWS_PAGE_SIZE);
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
  const vendor = product?.raw?.vendorBusinessName ?? null;
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
      console.log('[ProductDetail] addToCart payload', { productId: product?.product_id, quantity, price: product?.price });
      const item = {
        product_id: product!.product_id,
        product_name: product!.product_name,
        thumnail_url: product!.thumnail_url,
        price: product!.price,
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
      console.log('[ProductDetail] buyNow start', { productId: product.product_id, quantity, unitPrice: product.price, total: product.price * quantity });
      // Clear existing cart, add only this product, then go to Checkout
      await clearCart();
      const item = {
        product_id: product.product_id,
        product_name: product.product_name,
        thumnail_url: product.thumnail_url,
        price: product.price,
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
    <View style={styles.center}>
      <ActivityIndicator />
    </View>
  );

  if (!product) return (
    <View style={styles.center}>
      <Text style={styles.emptyText}>Không tìm thấy sản phẩm</Text>
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
    <SafeAreaView style={styles.root}>
      {/* Custom header: back, centered title, actions */}
      <View className="flex-row items-center justify-between px-3 py-2">
        <TouchableOpacity onPress={() => navigation.goBack()} className="p-2">
          <Ionicons name="arrow-back" size={20} color="#111" />
        </TouchableOpacity>

        <Text className="text-lg font-bold text-amber-700">Chi tiết sản phẩm</Text>

        <View className="flex-row items-center">
          <TouchableOpacity className="p-2" onPress={() => { /* TODO: notifications */ }}>
            <Ionicons name="notifications-outline" size={20} color="#A0522D" />
          </TouchableOpacity>
          <TouchableOpacity className="p-2" onPress={openCart}>
            <Ionicons name="cart-outline" size={20} color="#A0522D" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView>
        {/* Main product image (single) */}
        <View style={styles.imageWrap}>
          <Animated.Image source={{ uri: images[0] }} style={[styles.mainImage, { opacity: imageOpacity }]} resizeMode="cover" onLoad={onImageLoad} />
        </View>

        {/* Product info header below images */}
        <ProductHeader
          product={product}
          rating={rating}
          reviewCount={reviewCount}
          vendor={vendor}
          category={category}
          stock={stock}
          quantity={quantity}
          setQuantity={setQuantity}
          showFullDesc={showFullDesc}
          setShowFullDesc={setShowFullDesc}
        />

        {/* Reviews summary + list */}
        <View className="px-4 ">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-lg font-bold">Đánh giá sản phẩm</Text>
            <TouchableOpacity onPress={() => {/* TODO: navigate to all reviews */}}>
              <Text className="text-blue-600">Xem tất cả</Text>
            </TouchableOpacity>
          </View>

          <View className="bg-white rounded-lg p-4 shadow-sm mb-4">
            <View className="flex-row items-center">
              <Text className="text-3xl font-extrabold mr-4">{rating.toFixed(1)}</Text>
              <View>
                <View className="flex-row items-center mb-1">
                  <Ionicons name="star" size={18} color="#F59E0B" />
                  <Text className="ml-2 text-sm">{reviewCount} đánh giá</Text>
                </View>
                <Text className="text-sm text-gray-600">{reviewsTotal} tổng</Text>
              </View>
            </View>
          </View>

          {reviewsLoading ? (
            <ActivityIndicator />
          ) : (
            <View>
              {(reviews || []).slice(0, 3).map((r, i) => (
                <View key={`rev_${r.id}_${i}`} className="bg-white p-3 rounded-lg mb-3">
                  <View className="flex-row items-center justify-between">
                    <View>
                      <View className="flex-row items-center">
                        <Text className="font-semibold mr-2">{r.author ?? 'Người dùng'}</Text>
                        <View className="flex-row items-center">
                          <Ionicons name="star" size={14} color="#F59E0B" />
                          <Text className="ml-1 text-sm">{r.rating?.toFixed?.(1) ?? r.rating}</Text>
                        </View>
                      </View>
                      {r.title ? <Text className="text-sm text-gray-800 mt-1">{r.title}</Text> : null}
                    </View>
                  </View>
                  {r.comment ? <Text className="text-gray-700 mt-2">{r.comment}</Text> : null}
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
 
      <View style={styles.stickyBarContainer}>
           <View style={styles.flex1}>
             <Text style={styles.totalLabel}>Tổng</Text>
             <Text style={styles.totalAmount}>{formatVND(product!.price * quantity)}</Text>
           </View>

           <View style={styles.actionsRow}>
          <TouchableOpacity onPress={onAddToCart} style={[styles.addBtn, styles.addOutlineBtn]}>
            <Text style={[styles.addBtnText, styles.addOutlineText]}>Thêm</Text>
          </TouchableOpacity>
            <TouchableOpacity onPress={onBuyNow} style={styles.buyBtn} disabled={buying}>
              {buying ? <ActivityIndicator color="#fff" /> : <Text style={styles.buyBtnText}>Mua ngay</Text>}
            </TouchableOpacity>
          </View>
       </View>

       <Toast visible={toastVisible} message={toastMsg} type={toastType} onHidden={() => setToastVisible(false)} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  imageIndicatorWrap: { alignItems: 'center' },
  imageIndicatorAbsolute: { position: 'absolute', top: IMAGE_HEIGHT - 24, left: 0, right: 0 },
  imageIndicatorRow: { flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.6)', marginHorizontal: 4 },
  dotActive: { backgroundColor: '#F59E0B', width: 18 },
  stickyBar: { position: 'absolute', bottom: 12, left: 12, right: 12, flexDirection: 'row', alignItems: 'center' },
  stickyBarContainer: { position: 'absolute', bottom: 12, left: 12, right: 12, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 10, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8 },
  flex1: { flex: 1 },
  totalLabel: { color: '#6B7280', fontSize: 12 },
  totalAmount: { fontSize: 18, fontWeight: '800', color: '#111' },
  actionsRow: { flexDirection: 'row' },
  addBtn: { backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 10, marginRight: 10 },
  addBtnText: { fontWeight: '600', color: '#111' },
  addOutlineBtn: { borderWidth: 1, borderColor: '#F59E0B', backgroundColor: '#fff' },
  addOutlineText: { color: '#F59E0B' },
  buyBtn: { backgroundColor: '#F59E0B', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10 },
  buyBtnText: { color: '#fff', fontWeight: '800' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF8F0' },
  emptyText: { color: '#6B7280' },
  mt6: { marginTop: 6 },
  mt12: { marginTop: 12 },
  mt14: { marginTop: 14 },
  mt8: { marginTop: 8 },

  /* new header styles */
  headerWrap: { paddingHorizontal: 16, backgroundColor: '#FFF8F0' },
  productTitle: { fontSize: 22, fontWeight: '800', color: '#0F172A' },
  priceRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  priceText: { fontSize: 20, fontWeight: '900', color: '#D97706' },
  ratingBadge: { marginLeft: 12, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF8F0', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  ratingText: { marginLeft: 8, fontWeight: '700', color: '#334155' },
  reviewCount: { marginLeft: 8, color: '#64748B' },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  metaLabel: { fontSize: 13, color: '#6B7280' },
  metaValue: { fontWeight: '700', color: '#0F172A' },
  stockWrap: { flexDirection: 'row', alignItems: 'center' },
  qtyRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  qtyLabel: { fontSize: 14, color: '#334155', marginRight: 12 },
  qtyControl: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 6 },
  qtyBtn: { paddingHorizontal: 10 },
  qtyBtnText: { fontSize: 18 },
  qtyCount: { paddingHorizontal: 16, fontWeight: '700' },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  sectionBody: { fontSize: 14, color: '#334155', lineHeight: 20, marginTop: 8 },
  showMore: { color: '#D97706', fontWeight: '700' },
  sectionWrap: { marginTop: 12 },
  showMoreWrap: { marginTop: 8 },
  imageWrap: { width: '100%', justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  mainImage: { width: width, height: IMAGE_HEIGHT },
  root: { flex: 1, backgroundColor: '#FFF8F0' },
});

export default ProductDetailScreen;
