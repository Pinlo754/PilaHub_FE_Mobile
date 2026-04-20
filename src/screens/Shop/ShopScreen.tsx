import React, { useEffect, useState, useCallback } from 'react';
import { View, FlatList, ActivityIndicator, Text, RefreshControl, StyleSheet } from 'react-native';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import ShopHeader from './components/ShopHeader';
import BannerCarousel from './components/BannerCarousel';
import CategoryList from './components/CategoryList';
import CardProduct from '../Home/components/CardProduct';
import ProductSkeleton from './components/ProductSkeleton';
import { getCategories, ProductItem, getProducts } from '../../services/products';
import bannerImg from '../../assets/banner.png';
import { debounce } from 'lodash';



function ListHeader({ categories, onPressCategory }: { categories: any[]; onPressCategory?: (c: any) => void }) {
  return (
    <>
      <BannerCarousel data={[{ id: 'b1', image: bannerImg }]} />
      <CategoryList data={categories} onPressCategory={onPressCategory} />
      <View className="px-4 mt-4 mb-2">
        <Text className="color-foreground font-semibold text-lg">Sản phẩm mới</Text>
      </View>
    </>
  );
}

function FooterLoader({ loading }: { loading: boolean }) {
  if (!loading) return null;
  return (
    <View className="py-4">
      <ActivityIndicator />
    </View>
  );
}

const PAGE_SIZE = 12;

const ShopScreen = () => {
  const navigation = useNavigation<NavigationProp<any>>();
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState('');
  // query is handled by the main header component

  useEffect(() => {
    loadInitial();
  }, []);

  async function loadInitial() {
    setLoading(true);
    try {
      const p = await getProducts(0, PAGE_SIZE);
      setProducts(p.items ?? []);
      setTotal(p.total ?? 0);
      setPage(0);
    } catch (err) {
      console.warn('loadInitial products failed', err);
      // keep products empty so UI shows empty state instead of mock
      setProducts([]);
      setTotal(0);
      setPage(0);
    } finally {
      setLoading(false);
    }

    // fetch categories in background
    try {
      const c = await getCategories();
      setCategories(c);
    } catch (err) {
      console.warn('loadInitial categories failed', err);
    }
  }

  const loadMore = async () => {
    if (loadingMore) return;
    const nextPage = page + 1;
    // stop if already loaded all
    if (products.length >= total) return;
    setLoadingMore(true);
    try {
      const p = await getProducts(nextPage, PAGE_SIZE, query || undefined);
      setProducts(prev => [...prev, ...p.items]);
      setPage(nextPage);
      setTotal(p.total);
    } catch (err) {
      console.warn('loadMore failed', err);
    } finally {
      setLoadingMore(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const p = await getProducts(0, PAGE_SIZE, query || undefined);
      setProducts(p.items ?? []);
      setPage(0);
      setTotal(p.total ?? 0);
    } catch (err) {
      console.warn('onRefresh failed', err);
    } finally {
      setRefreshing(false);
    }
  };

  // debounced search that resets pagination
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const doSearch = useCallback(debounce(async (q: string) => {
    setQuery(q);
    setLoading(true);
    const p = await getProducts(0, PAGE_SIZE, q || undefined);
    setProducts(p.items);
    setPage(0);
    setTotal(p.total);
    setLoading(false);
  }, 400), []);

  function onSearch(q: string) {
    doSearch(q);
  }

  // search handled by Header; no local onSearch required

  if (loading) {
    return (
      <View className="flex-1 bg-amber-50">
        <ShopHeader onSearch={onSearch} />
        <ProductSkeleton count={6} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-amber-50">
      <ShopHeader onSearch={onSearch} />

      <FlatList
        data={products}
        ListHeaderComponent={<ListHeader categories={categories} onPressCategory={(c:any) => navigation.navigate('ShopSearchResult' as any, { q: '', category: c.name, categoryId: c.id })} />}
        keyExtractor={(item, index) => String(item.product ?? `${item.raw?.product_id ?? item.raw?.id ?? index}`)}
        numColumns={2}
        renderItem={({ item }) => (
          <View style={styles.itemContainer} className="px-3 pb-6">
            <CardProduct item={item as any} onPress={() => navigation.navigate('ProductDetail' as any, { productId: item.productId ?? item.raw?.product_id ?? item.raw?.id })} />
          </View>
        )}
        columnWrapperStyle={styles.columnWrapper}
        showsVerticalScrollIndicator={false}
        onEndReachedThreshold={0.6}
        onEndReached={loadMore}
        ListFooterComponent={<FooterLoader loading={loadingMore} />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      />

      {/* show skeleton while searching */}
      {loadingMore && products.length === 0 && <ProductSkeleton count={4} />}
    </View>
  );
};

const styles = StyleSheet.create({
  itemContainer: { flex: 1, paddingHorizontal: 6, maxWidth: '50%' },
  columnWrapper: { justifyContent: 'space-between', paddingHorizontal: 12, paddingBottom: 6 },
});

export default ShopScreen;
