import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, FlatList, ActivityIndicator, RefreshControl, Linking } from 'react-native';
import { getVendorById, VendorItem } from '../../services/vendors';
import { getProducts, ProductItem } from '../../services/products';
import { normalizeImageUrl } from '../../services/products';
import Ionicons from '@react-native-vector-icons/ionicons';
import CardProduct from '../Home/components/CardProduct';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

const COLORS = {
  // aligned with tailwind.config.js colors for consistency
  primary: '#A0522D', // foreground (brown)
  warm: '#CD853F', // secondaryText
  text: '#A0522D',
  muted: '#6B7280', // inactive.darker
  bg: '#FFFAF0', // background.DEFAULT
  card: '#FFFFFF',
  success: '#37C16D',
};

type Props = { route: any };

const PAGE_SIZE = 12;

const VendorShopScreen: React.FC<Props> = ({ route }) => {
  const navigation = useNavigation<any>();
  const vendorId: string = route?.params?.vendorId;
  const [vendor, setVendor] = useState<VendorItem | null>(null);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [total, setTotal] = useState(0);

  const loadVendor = useCallback(async () => {
    if (!vendorId) return;
    try {
      const v = await getVendorById(vendorId);
      setVendor(v);
    } catch (e) {
      console.warn('loadVendor failed', e);
    }
  }, [vendorId]);

  const loadProducts = useCallback(async (p = 0) => {
    if (!vendorId) return;
    try {
      if (p === 0) setLoading(true);
      const res = await getProducts(p, PAGE_SIZE, undefined, { vendorId });
      if (p === 0) {
        setProducts(res.items ?? []);
      } else {
        setProducts(prev => [...prev, ...(res.items ?? [])]);
      }
      setTotal(res.total ?? 0);
      setPage(p);
    } catch (e) {
      console.warn('loadProducts failed', e);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, [vendorId]);

  useEffect(() => { loadVendor(); loadProducts(0); }, [loadVendor, loadProducts]);

  const onRefresh = async () => { setRefreshing(true); await Promise.all([loadVendor(), loadProducts(0)]); };

  const loadMore = async () => {
    if (loadingMore) return;
    if (products.length >= total) return;
    setLoadingMore(true);
    await loadProducts(page + 1);
  };

  const openProduct = (p: ProductItem) => navigation.navigate('ProductDetail' as any, { productId: p.productId });

  if (loading && page === 0) {
    return (
      <SafeAreaView style={[localStyles.root, { backgroundColor: COLORS.bg }]}> 
        <ActivityIndicator style={localStyles.centerLoader} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[localStyles.root, { backgroundColor: COLORS.bg }]}> 
      {/* Header */}
      <View style={localStyles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={localStyles.headerButton} accessibilityLabel="Back">
          <Ionicons name="arrow-back" size={22} color={COLORS.text} />
        </TouchableOpacity>

        <Text style={localStyles.headerTitle} numberOfLines={1}>Thông tin cửa hàng</Text>

        <View style={localStyles.headerButton} />
      </View>

      {/* Vendor hero */}
      {vendor ? (
        <View style={[localStyles.vendorCard, localStyles.heroShadow]}>
          <Image
            source={vendor.logoUrl ? { uri: normalizeImageUrl(vendor.logoUrl) } : require('../../assets/placeholderAvatar.png')}
            style={localStyles.logoLarge}
          />

          <View style={localStyles.vendorInfo}>
            <View style={localStyles.nameRow}>
              <Text style={localStyles.vendorName} numberOfLines={1}>{vendor.businessName}</Text>
              <Text style={localStyles.productCount}>{total ?? 0} sản phẩm</Text>
            </View>

            <View style={localStyles.metaRow}>
              <Text style={localStyles.vendorLocation}>{vendor.city ?? ''}</Text>
              {vendor.verified ? (
                <View style={localStyles.verifiedBadge}>
                  <Ionicons name="checkmark" size={12} color="#fff" />
                </View>
              ) : null}
            </View>

            {vendor.description ? <Text style={localStyles.vendorDescription} numberOfLines={2}>{vendor.description}</Text> : null}

            <View style={localStyles.infoRowContainer}>
              {vendor.address ? (
                <View style={localStyles.infoRowFull}>
                  <Ionicons name="location-outline" size={16} color={COLORS.muted} style={localStyles.infoIcon} />
                  <Text style={localStyles.infoText} numberOfLines={2}>{vendor.address}</Text>
                </View>
              ) : null}

              {vendor.phoneNumber ? (
                <TouchableOpacity onPress={() => Linking.openURL(`tel:${vendor.phoneNumber}`)} style={localStyles.phoneWrap}>
                  <Ionicons name="call-outline" size={16} color={COLORS.primary} style={localStyles.infoIcon} />
                  <Text style={localStyles.phoneText}>{vendor.phoneNumber}</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        </View>
      ) : null}

      <View style={localStyles.contentContainer}>
        <Text style={localStyles.sectionTitle}>Sản phẩm của cửa hàng</Text>

        {(!loading && products.length === 0) ? (
          <View style={localStyles.emptyContainer}>
            <Text style={localStyles.emptyText}>Chưa có sản phẩm nào từ cửa hàng này.</Text>
          </View>
        ) : (
          <FlatList
            data={products}
            numColumns={2}
            keyExtractor={(it) => it.productId}
            renderItem={({ item }) => (
              <View style={localStyles.cardWrapper}>
                <CardProduct item={item as any} onPress={() => openProduct(item)} />
              </View>
            )}
            columnWrapperStyle={localStyles.columnWrapper}
            onEndReachedThreshold={0.6}
            onEndReached={loadMore}
            ListFooterComponent={loadingMore ? <ActivityIndicator style={localStyles.listFooterLoader} /> : null}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const localStyles = StyleSheet.create({
  root: { flex: 1 },
  centerLoader: { marginTop: 40 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 10 },
  headerButton: { width: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '800', color: COLORS.text },
  heroShadow: { shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 3 },
  vendorCard: { flexDirection: 'row', backgroundColor: COLORS.card, borderRadius: 14, padding: 16, marginHorizontal: 12, alignItems: 'flex-start', marginTop: 8 },
  logoLarge: { width: 80, height: 80, borderRadius: 12, backgroundColor: '#f1f5f9' },
  vendorInfo: { marginLeft: 14, flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  vendorName: { fontSize: 20, fontWeight: '800', color: COLORS.primary },
  productCount: { color: COLORS.warm, fontSize: 13, fontWeight: '700' },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  vendorLocation: { color: COLORS.muted, marginRight: 8 },
  verifiedBadge: { backgroundColor: COLORS.success, paddingHorizontal: 6, paddingVertical: 3, borderRadius: 12, marginLeft: 6 },
  vendorDescription: { color: COLORS.muted, marginTop: 8, fontSize: 13 },
  infoRowContainer: { marginTop: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  infoRowFull: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 12 },
  infoIcon: { marginRight: 8 },
  infoText: { color: COLORS.muted, fontSize: 13, flexShrink: 1 },
  phoneWrap: { flexDirection: 'row', alignItems: 'center' },
  phoneText: { color: COLORS.primary, textDecorationLine: 'underline', fontWeight: '600' },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: COLORS.text, marginBottom: 8 },
  emptyContainer: { alignItems: 'center', padding: 40 },
  emptyText: { color: COLORS.muted },
  contentContainer: { flex: 1, paddingHorizontal: 12, marginTop: 12 },
  cardWrapper: { flex: 1, padding: 4 },
  listFooterLoader: { margin: 12 },
  columnWrapper: { justifyContent: 'space-between' },
});

export default VendorShopScreen;
