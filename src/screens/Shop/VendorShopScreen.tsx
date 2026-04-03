import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, SafeAreaView, StyleSheet, Image, TouchableOpacity, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { getVendorById, VendorItem } from '../../services/vendors';
import { getProducts, ProductItem } from '../../services/products';
import { normalizeImageUrl } from '../../services/products';
import Ionicons from '@react-native-vector-icons/ionicons';
import CardProduct from '../Home/components/CardProduct';
import { useNavigation } from '@react-navigation/native';

const COLORS = {
  primary: '#0ea5a4',
  warm: '#F59E0B',
  text: '#0F172A',
  muted: '#6B7280',
  bg: '#FFFAF0',
  card: '#FFFFFF',
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
    <SafeAreaView className="flex-1" style={{ backgroundColor: COLORS.bg }}>
      <View className="flex-row items-center justify-between px-3 py-2">
        <TouchableOpacity onPress={() => navigation.goBack()} className="p-2">
          <Ionicons name="arrow-back" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <Text className="text-[18px] font-extrabold">{vendor?.businessName ?? 'Cửa hàng'}</Text>
        <View style={localStyles.topRightPlaceholder} />
      </View>

      {vendor ? (
        <View className="mx-4 mt-3 bg-white rounded-xl p-3" style={localStyles.heroShadow}>
          <Image source={vendor.logoUrl ? { uri: normalizeImageUrl(vendor.logoUrl) } : require('../../assets/placeholderAvatar.png')} style={localStyles.logo} />
          <View className="ml-3 flex-1">
            <View className="flex-row items-center">
              <Text className="text-[18px] font-extrabold text-[#0F172A]">{vendor.businessName}</Text>
              {vendor.verified ? <Ionicons name="checkmark-circle" size={18} color="#10B981" className="ml-2" /> : null}
            </View>
            <Text className="text-sm text-[#6B7280] mt-1">{vendor.city ?? ''}</Text>
            <View className="flex-row mt-3">
              <TouchableOpacity className="border border-teal-500 px-3 py-2 rounded-lg mr-2"><Text className="text-teal-500 font-bold">Theo dõi</Text></TouchableOpacity>
              <TouchableOpacity className="bg-teal-500 px-3 py-2 rounded-lg"><Text className="text-white font-bold">Liên hệ</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      ) : null}

      <View className="flex-1 px-3 mt-3">
        <Text className="font-extrabold text-[16px] text-[#0F172A] mb-3">Sản phẩm của cửa hàng</Text>

        <FlatList
          data={products}
          numColumns={2}
          keyExtractor={(it) => it.productId}
          renderItem={({ item }) => (
            <View className="flex-1 p-1">
              <CardProduct item={item as any} onPress={() => openProduct(item)} />
            </View>
          )}
          columnWrapperStyle={localStyles.columnWrapper}
          onEndReachedThreshold={0.6}
          onEndReached={loadMore}
          ListFooterComponent={loadingMore ? <ActivityIndicator style={localStyles.listFooterLoader} /> : null}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      </View>
    </SafeAreaView>
  );
};

const localStyles = StyleSheet.create({
  root: { flex: 1 },
  centerLoader: { marginTop: 40 },
  topRightPlaceholder: { width: 40 },
  heroShadow: { shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 3 },
  logo: { width: 72, height: 72, borderRadius: 12, backgroundColor: '#f1f5f9' },
  listFooterLoader: { margin: 12 },
  columnWrapper: { justifyContent: 'space-between' },
});

export default VendorShopScreen;
