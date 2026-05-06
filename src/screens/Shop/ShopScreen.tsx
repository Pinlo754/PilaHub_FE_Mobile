import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import {
  View,
  FlatList,
  ActivityIndicator,
  Text,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { debounce } from 'lodash';

import ShopHeader from './components/ShopHeader';
import BannerCarousel from './components/BannerCarousel';
import CategoryList from './components/CategoryList';
import CardProduct from '../Home/components/CardProduct';
import ProductSkeleton from './components/ProductSkeleton';
import Toast from '../../components/Toast';

import {
  getCategories,
  ProductItem,
  getProducts,
} from '../../services/products';

import bannerImg from '../../assets/banner.png';

const PAGE_SIZE = 12;
const CARD_HEIGHT = 360;
const CARD_BOTTOM_SPACE = 20;
const ROW_HEIGHT = CARD_HEIGHT + CARD_BOTTOM_SPACE;

const COLORS = {
  bg: '#FFF8F0',
  card: '#FFFFFF',
  text: '#0F172A',
  muted: '#64748B',
  primary: '#CD853F',
  danger: '#EF4444',
  border: '#F1E7DC',
  soft: '#FFF7ED',
};

type ToastType = 'success' | 'error' | 'info';

type ListHeaderProps = {
  categories: any[];
  total: number;
  query: string;
  refreshing: boolean;
  onPressCategory: (category: any) => void;
  onClearSearch: () => void;
};

function SectionTitle({
  title,
  subtitle,
  rightText,
  onPressRight,
}: {
  title: string;
  subtitle?: string;
  rightText?: string;
  onPressRight?: () => void;
}) {
  return (
    <View className="px-4 mt-5 mb-3 flex-row items-end justify-between">
      <View className="flex-1 pr-3">
        <Text className="text-[#0F172A] font-extrabold text-[20px]">
          {title}
        </Text>

        {subtitle ? (
          <Text className="text-[#64748B] text-sm mt-1">
            {subtitle}
          </Text>
        ) : null}
      </View>

      {rightText ? (
        <TouchableOpacity onPress={onPressRight}>
          <Text className="text-[#CD853F] font-extrabold text-sm">
            {rightText}
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

function SearchSummary({
  query,
  total,
  onClearSearch,
}: {
  query: string;
  total: number;
  onClearSearch: () => void;
}) {
  if (!query.trim()) return null;

  return (
    <View className="mx-4 mt-4 rounded-2xl bg-white border border-[#F1E7DC] ">
      <View className="flex-row items-start justify-between">
        <View className="flex-1 pr-3">
          <Text className="text-[#64748B] text-xs font-semibold">
            Kết quả tìm kiếm
          </Text>

          <Text className="text-[#0F172A] font-extrabold mt-1">
            “{query}”
          </Text>

          <Text className="text-[#64748B] text-xs mt-1">
            Tìm thấy {total} sản phẩm phù hợp
          </Text>
        </View>

        <TouchableOpacity
          onPress={onClearSearch}
          className="px-3 py-2 rounded-xl bg-[#FFF7ED]"
        >
          <Text className="text-[#CD853F] text-xs font-extrabold">
            Xoá
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function ListHeader({
  categories,
  total,
  query,
  onPressCategory,
  onClearSearch,
}: ListHeaderProps) {
  return (
    <>
      <SearchSummary
        query={query}
        total={total}
        onClearSearch={onClearSearch}
      />

      <CategoryList
        data={categories}
        onPressCategory={onPressCategory}
      />

      <SectionTitle
        title={query.trim() ? 'Sản phẩm phù hợp' : 'Sản phẩm mới'}
        subtitle={
          total > 0
            ? `${total} sản phẩm đang có sẵn`
            : 'Danh sách sản phẩm hiện chưa có dữ liệu'
        }
      />
    </>
  );
}

function FooterLoader({
  loading,
  hasMore,
  productCount,
}: {
  loading: boolean;
  hasMore: boolean;
  productCount: number;
}) {
  if (loading) {
    return (
      <View className="py-5 items-center">
        <ActivityIndicator />
        <Text className="text-[#64748B] text-xs mt-2">
          Đang tải thêm sản phẩm...
        </Text>
      </View>
    );
  }

  if (!hasMore && productCount > 0) {
    return (
      <View className="py-6 items-center">
        <Text className="text-[#94A3B8] text-xs font-semibold">
          Bạn đã xem hết sản phẩm
        </Text>
      </View>
    );
  }

  return null;
}

function EmptyProducts({
  query,
  onRefresh,
}: {
  query: string;
  onRefresh: () => void;
}) {
  return (
    <View className="items-center justify-center px-8 py-16">
      <View className="w-20 h-20 rounded-full bg-[#FFF7ED] items-center justify-center mb-4">
        <Ionicons name="cube-outline" size={36} color={COLORS.primary} />
      </View>

      <Text className="text-[#0F172A] text-lg font-extrabold text-center">
        Không tìm thấy sản phẩm
      </Text>

      <Text className="text-[#64748B] text-sm text-center mt-2 leading-5">
        {query.trim()
          ? 'Không có sản phẩm nào khớp với từ khoá bạn tìm kiếm.'
          : 'Hiện tại chưa có sản phẩm nào trong cửa hàng.'}
      </Text>

      <TouchableOpacity
        onPress={onRefresh}
        className="mt-5 px-5 py-3 rounded-2xl bg-[#CD853F]"
      >
        <Text className="text-white font-extrabold">
          Tải lại
        </Text>
      </TouchableOpacity>
    </View>
  );
}

function ErrorBox({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  if (!message) return null;

  return (
    <View className="mx-4 mt-4 rounded-2xl bg-[#FEF2F2] border border-[#FECACA] p-3">
      <View className="flex-row items-start">
        <Ionicons name="alert-circle-outline" size={20} color="#B91C1C" />

        <View className="flex-1 ml-2">
          <Text className="text-[#B91C1C] font-extrabold">
            Không thể tải dữ liệu
          </Text>

          <Text className="text-[#991B1B] text-xs mt-1 leading-5">
            {message}
          </Text>

          <TouchableOpacity onPress={onRetry} className="mt-2">
            <Text className="text-[#B91C1C] text-xs font-extrabold">
              Thử lại
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const ShopScreen = () => {
  const navigation = useNavigation<NavigationProp<any>>();

  const [products, setProducts] = useState<ProductItem[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);

  const [query, setQuery] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const [toastVisible, setToastVisible] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState<ToastType>('success');

  const lastToastTimeRef = useRef(0);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback(
    (message: string, type: ToastType = 'info') => {
      const now = Date.now();

      if (now - lastToastTimeRef.current < 700) {
        return;
      }

      lastToastTimeRef.current = now;

      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }

      setToastMsg(message);
      setToastType(type);
      setToastVisible(false);

      toastTimerRef.current = setTimeout(() => {
        setToastVisible(true);
      }, 50);
    },
    [],
  );

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const hasMore = useMemo(() => {
    return products.length < total;
  }, [products.length, total]);

  const loadCategories = useCallback(async () => {
    try {
      const categoryData = await getCategories();
      setCategories(Array.isArray(categoryData) ? categoryData : []);
    } catch (err) {
      console.warn('load categories failed', err);
      setCategories([]);
    }
  }, []);

  const loadInitial = useCallback(async () => {
    setLoading(true);
    setErrorMessage('');

    try {
      const response = await getProducts(0, PAGE_SIZE);

      setProducts(response.items ?? []);
      setTotal(response.total ?? 0);
      setPage(0);
      setQuery('');
    } catch (err) {
      console.warn('loadInitial products failed', err);
      setProducts([]);
      setTotal(0);
      setPage(0);
      setErrorMessage('Vui lòng kiểm tra kết nối mạng hoặc thử lại sau.');
    } finally {
      setLoading(false);
    }

    await loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  const doSearch = useMemo(
    () =>
      debounce(async (keyword: string) => {
        const cleanKeyword = keyword.trim();

        setQuery(cleanKeyword);
        setLoading(true);
        setErrorMessage('');

        try {
          const response = await getProducts(
            0,
            PAGE_SIZE,
            cleanKeyword || undefined,
          );

          setProducts(response.items ?? []);
          setPage(0);
          setTotal(response.total ?? 0);
        } catch (err) {
          console.warn('search products failed', err);
          setProducts([]);
          setPage(0);
          setTotal(0);
          setErrorMessage('Không thể tìm kiếm sản phẩm lúc này.');
        } finally {
          setLoading(false);
        }
      }, 400),
    [],
  );

  useEffect(() => {
    return () => {
      doSearch.cancel();
    };
  }, [doSearch]);

  const loadMore = useCallback(async () => {
    if (loadingMore || loading || refreshing) return;
    if (!hasMore) return;

    const nextPage = page + 1;

    setLoadingMore(true);

    try {
      const response = await getProducts(
        nextPage,
        PAGE_SIZE,
        query.trim() || undefined,
      );

      setProducts(prev => [...prev, ...(response.items ?? [])]);
      setPage(nextPage);
      setTotal(response.total ?? total);
    } catch (err) {
      console.warn('loadMore failed', err);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, loading, refreshing, hasMore, page, query, total]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setErrorMessage('');

    try {
      const response = await getProducts(
        0,
        PAGE_SIZE,
        query.trim() || undefined,
      );

      setProducts(response.items ?? []);
      setPage(0);
      setTotal(response.total ?? 0);
    } catch (err) {
      console.warn('onRefresh failed', err);
      setErrorMessage('Không thể làm mới danh sách sản phẩm.');
    } finally {
      setRefreshing(false);
    }

    await loadCategories();
  }, [query, loadCategories]);

  const onSearch = useCallback(
    (keyword: string) => {
      doSearch(keyword);
    },
    [doSearch],
  );

  const clearSearch = useCallback(async () => {
    doSearch.cancel();

    setQuery('');
    setLoading(true);
    setErrorMessage('');

    try {
      const response = await getProducts(0, PAGE_SIZE);

      setProducts(response.items ?? []);
      setPage(0);
      setTotal(response.total ?? 0);
    } catch (err) {
      console.warn('clear search failed', err);
      setProducts([]);
      setPage(0);
      setTotal(0);
      setErrorMessage('Không thể tải lại danh sách sản phẩm.');
    } finally {
      setLoading(false);
    }
  }, [doSearch]);

  const goToCategory = useCallback(
    (category: any) => {
      navigation.navigate('ShopSearchResult' as any, {
        q: '',
        category: category?.name,
        categoryId: category?.id,
      });
    },
    [navigation],
  );

  const goToProductDetail = useCallback(
    (item: ProductItem) => {
      const productId =
        item.productId ??
        item.raw?.product_id ??
        item.raw?.id ??
        item.raw?.productId;

      if (!productId) return;

      navigation.navigate('ProductDetail' as any, { productId });
    },
    [navigation],
  );

  const renderProduct = useCallback(
    ({ item }: { item: ProductItem }) => {
      return (
        <View style={styles.itemContainer}>
          <CardProduct
            item={item as any}
            onPress={() => goToProductDetail(item)}
            onNotify={showToast}
          />
        </View>
      );
    },
    [goToProductDetail, showToast],
  );

  const keyExtractor = useCallback((item: ProductItem, index: number) => {
    const productId =
      item.productId ??
      item.raw?.product_id ??
      item.raw?.id ??
      item.raw?.productId ??
      'unknown';

    return `${String(productId)}-${index}`;
  }, []);

  const getItemLayout = useCallback(
    (_: ArrayLike<ProductItem> | null | undefined, index: number) => {
      const rowIndex = Math.floor(index / 2);

      return {
        length: ROW_HEIGHT,
        offset: ROW_HEIGHT * rowIndex,
        index,
      };
    },
    [],
  );

  if (loading) {
    return (
      <View className="flex-1 bg-[#FFF8F0]">
        <ShopHeader onSearch={onSearch} />

        <View className="px-4 pt-4">
          <View className="h-12 rounded-2xl bg-white mb-4" />
        </View>

        <ProductSkeleton count={6} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#FFF8F0]">
      <ShopHeader onSearch={onSearch} />

      <ErrorBox
        message={errorMessage}
        onRetry={query.trim() ? clearSearch : loadInitial}
      />

      <FlatList
        data={products}
        keyExtractor={keyExtractor}
        numColumns={2}
        renderItem={renderProduct}
        columnWrapperStyle={styles.columnWrapper}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={false}
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        updateCellsBatchingPeriod={40}
        windowSize={9}
        getItemLayout={getItemLayout}
        onEndReachedThreshold={0.4}
        onEndReached={loadMore}
        ListHeaderComponent={
          <ListHeader
            categories={categories}
            total={total}
            query={query}
            refreshing={refreshing}
            onPressCategory={goToCategory}
            onClearSearch={clearSearch}
          />
        }
        ListEmptyComponent={
          <EmptyProducts
            query={query}
            onRefresh={onRefresh}
          />
        }
        ListFooterComponent={
          <FooterLoader
            loading={loadingMore}
            hasMore={hasMore}
            productCount={products.length}
          />
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
          />
        }
        contentContainerStyle={styles.listContent}
      />

      <Toast
        visible={toastVisible}
        message={toastMsg}
        type={toastType}
        onHidden={() => setToastVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  listContent: {
    paddingBottom: 28,
  },
  itemContainer: {
    flex: 1,
    maxWidth: '50%',
    paddingHorizontal: 6,
    paddingBottom: 20,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
});

export default ShopScreen;