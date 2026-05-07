import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, Modal, TouchableOpacity, TextInput } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { getProducts, ProductItem, PagedResult } from '../../services/products';
import CardProduct from '../Home/components/CardProduct';
import Ionicons from '@react-native-vector-icons/ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCart } from '../../context/CartContext';

const PAGE_SIZE = 12;

export default function ShopSearchResult() {
  const route: any = useRoute();
  const navigation: any = useNavigation();
  const { totalItems } = useCart();
  const routeQ = route.params?.q ?? route.params?.roadmapQuery ?? '';
  const routeRoadmapFilter = route.params?.roadmapFilter;

  const [query, setQuery] = useState<string>(routeQ);
  const [items, setItems] = useState<ProductItem[]>([]);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [_loadingMore, setLoadingMore] = useState(false);

  // filter / sort state
  const [filterOpen, setFilterOpen] = useState(false);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortDir, setSortDir] = useState<'desc'|'asc'>('desc');
  const [appliedFilter, setAppliedFilter] = useState<any | undefined>(undefined);

  const [activeTab, setActiveTab] = useState<'relevance'|'latest'|'bestseller'|'price'>('relevance');

  const [categories] = useState<string[]>(['Tất cả','Thực phẩm chức năng','Vitamin','Thiết bị tập','Quần áo','Phụ kiện']);
  const [category, setCategory] = useState<string>('Tất cả');
  const [minRating, setMinRating] = useState<number | null>(null);
  const [freeShipping, setFreeShipping] = useState(false);
  const [onlyMall, setOnlyMall] = useState(false);
  const [inRoadmapToggle, setInRoadmapToggle] = useState(false);

  const load = useCallback(async (p = 0, queryArg: string | undefined = query, sortDirArg: 'desc' | 'asc' = sortDir, sortFieldArg?: string, filtersArg?: any) => {
    if (p === 0) setLoading(true); else setLoadingMore(true);
    try {
      const filters = filtersArg ?? (appliedFilter ? { minPrice: appliedFilter.minPrice, maxPrice: appliedFilter.maxPrice, ...appliedFilter } : undefined);
      const r: PagedResult<ProductItem> = await getProducts(p, PAGE_SIZE, queryArg || undefined, filters as any, sortFieldArg, sortDirArg);
      let fetched = r.items || [];
      const wantsInRoadmap = (filters as any)?.inRoadmap || (appliedFilter as any)?.inRoadmap;
      if (wantsInRoadmap) {
        const roadmapFilter = routeRoadmapFilter;
        const matchesRoadmapItem = (it: ProductItem) => {
          try {
            if (it.raw?.inRoadmap === true) return true;
            if (roadmapFilter) {
              const qnames = [roadmapFilter.equipmentName, roadmapFilter.supplementName, roadmapFilter.category, roadmapFilter.brand].filter(Boolean).map((s:any) => String(s).toLowerCase());
              const hay = (String(it.name ?? it.raw?.name ?? '') + ' ' + String(it.categoryName ?? it.raw?.categoryName ?? '') + ' ' + String(it.brand ?? it.raw?.brand ?? '')).toLowerCase();
              return qnames.some((k:any) => hay.includes(String(k)));
            }
            return false;
          } catch { return false; }
        };
        fetched = (fetched || []).filter(matchesRoadmapItem);
      }

      if (p === 0) setItems(fetched); else setItems(prev => [...prev, ...fetched]);
       setTotal(r.total || 0);
       setPage(r.page ?? p);
    } catch (e) {
      console.warn('shop search load err', e);
    } finally {
      setLoading(false); setLoadingMore(false);
    }
  }, [appliedFilter, sortDir, query, routeRoadmapFilter]);

  useEffect(() => {
    if (routeRoadmapFilter) {
      setAppliedFilter(routeRoadmapFilter);
      load(0, routeQ, sortDir, undefined, routeRoadmapFilter);
      return;
    }
    load(0, routeQ);
  }, [load, routeQ, routeRoadmapFilter, sortDir]);

  const loadMore = () => { if (items.length < total) load(page + 1); };

  function applyFilter() {
    const f: any = {};
    if (minPrice) f.minPrice = Number(minPrice);
    if (maxPrice) f.maxPrice = Number(maxPrice);
    if (category && category !== 'Tất cả') f.category = category;
    if (minRating) f.minRating = minRating;
    if (freeShipping) f.freeShipping = true;
    if (onlyMall) f.onlyMall = true;
    if (inRoadmapToggle) f.inRoadmap = true;
    setAppliedFilter(Object.keys(f).length ? f : undefined);
    setFilterOpen(false);
    load(0, query, sortDir, undefined, Object.keys(f).length ? f : undefined);
  }

  function clearFilter() {
    setMinPrice('');
    setMaxPrice('');
    setCategory('Tất cả');
    setMinRating(null);
    setFreeShipping(false);
    setOnlyMall(false);
    setInRoadmapToggle(false);
    setAppliedFilter(undefined);
    setFilterOpen(false);
    load(0, query, sortDir, undefined, undefined);
  }

  function onSelectTab(tab: typeof activeTab) {
    let nextSort: 'desc' | 'asc' = 'desc';
    let sortField: string | undefined;
    if (tab === 'price') {
      nextSort = sortDir === 'desc' ? 'asc' : 'desc';
      sortField = 'price';
    } else if (tab === 'latest') {
      nextSort = 'desc';
      sortField = 'createdAt';
    } else {
      nextSort = 'desc';
      sortField = undefined;
    }
    setActiveTab(tab);
    setSortDir(nextSort);
    load(0, query, nextSort, sortField);
  }

  return (
    <SafeAreaView style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#A0522D" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tìm kiếm sản phẩm</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Cart' as any)} style={styles.cartBtn}>
          <Ionicons name="cart-outline" size={24} color="#A0522D" />
          {totalItems > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{totalItems > 99 ? '99+' : totalItems}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Search Bar - Match ShopHeader Style */}
      <View style={styles.searchSection}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color="#CD853F" />
          <TextInput
            placeholder="Tìm kiếm sản phẩm"
            placeholderTextColor="#9CA3AF"
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
            onSubmitEditing={() => load(0, query)}
          />
          {query ? (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Sort & Filter Bar */}
      <View style={styles.sortFilterBar}>
        <View style={styles.sortTabs}>
          {[
            { id: 'relevance', label: 'Liên quan', icon: 'star-outline' },
            { id: 'latest', label: 'Mới', icon: 'time-outline' },
            { id: 'bestseller', label: 'Bán chạy', icon: 'flame-outline' },
            { id: 'price', label: `Giá ${sortDir === 'desc' ? '↓' : '↑'}`, icon: 'pricetag-outline' },
          ].map(t => (
            <TouchableOpacity
              key={t.id}
              onPress={() => onSelectTab(t.id as any)}
              style={[styles.sortTab, activeTab === t.id && styles.sortTabActive]}
            >
              <Ionicons name={t.icon as any} size={14} color={activeTab === t.id ? '#A0522D' : '#9CA3AF'} />
              <Text style={[styles.sortTabText, activeTab === t.id && styles.sortTabTextActive]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          onPress={() => setFilterOpen(true)}
          style={styles.filterBtn}
        >
          <Ionicons name="options" size={18} color="#A0522D" />
        </TouchableOpacity>
      </View>

      {/* Active Filters Display */}
      {appliedFilter && Object.keys(appliedFilter).length > 0 && (
        <View style={styles.activeFiltersBar}>
          <View style={styles.activeFiltersList}>
            {appliedFilter.minPrice != null || appliedFilter.maxPrice != null ? (
              <View style={styles.filterTag}>
                <Text style={styles.filterTagText}>
                  {appliedFilter.minPrice ? `₫${(appliedFilter.minPrice / 1000).toFixed(0)}k` : ''}
                  {appliedFilter.minPrice && appliedFilter.maxPrice ? ' - ' : ''}
                  {appliedFilter.maxPrice ? `₫${(appliedFilter.maxPrice / 1000).toFixed(0)}k` : ''}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setMinPrice('');
                    setMaxPrice('');
                    setAppliedFilter((prev: any) => {
                      const p = { ...(prev || {}) };
                      delete p.minPrice;
                      delete p.maxPrice;
                      return Object.keys(p).length ? p : undefined;
                    });
                  }}
                >
                  <Ionicons name="close" size={14} color="#A0522D" />
                </TouchableOpacity>
              </View>
            ) : null}
            {appliedFilter.category ? (
              <View style={styles.filterTag}>
                <Text style={styles.filterTagText}>{appliedFilter.category}</Text>
                <TouchableOpacity
                  onPress={() => {
                    setCategory('Tất cả');
                    setAppliedFilter((prev: any) => {
                      const p = { ...(prev || {}) };
                      delete p.category;
                      return Object.keys(p).length ? p : undefined;
                    });
                  }}
                >
                  <Ionicons name="close" size={14} color="#A0522D" />
                </TouchableOpacity>
              </View>
            ) : null}
            {appliedFilter.minRating ? (
              <View style={styles.filterTag}>
                <Text style={styles.filterTagText}>★ {appliedFilter.minRating}+</Text>
                <TouchableOpacity
                  onPress={() => {
                    setMinRating(null);
                    setAppliedFilter((prev: any) => {
                      const p = { ...(prev || {}) };
                      delete p.minRating;
                      return Object.keys(p).length ? p : undefined;
                    });
                  }}
                >
                  <Ionicons name="close" size={14} color="#A0522D" />
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
          <TouchableOpacity onPress={clearFilter} style={styles.clearAllBtn}>
            <Text style={styles.clearAllText}>Xóa hết</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Products Grid */}
      <View style={styles.content}>
        {loading ? (
          <View style={styles.centerLoader}>
            <ActivityIndicator size="large" color="#A0522D" />
            <Text style={styles.loadingText}>Đang tải sản phẩm...</Text>
          </View>
        ) : items.length > 0 ? (
          <FlatList
            data={items}
            keyExtractor={(item) => item.productId}
            numColumns={2}
            renderItem={({ item }) => (
              <View style={styles.productWrapper}>
                <CardProduct
                  item={item as any}
                  onPress={() => navigation.navigate('ProductDetail' as any, { productId: item.productId })}
                />
              </View>
            )}
            onEndReached={loadMore}
            onEndReachedThreshold={0.5}
            columnWrapperStyle={styles.columnWrapper}
            showsVerticalScrollIndicator={false}
            scrollEnabled={true}
          />
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="search" size={48} color="#D1D5DB" />
            <Text style={styles.emptyText}>Không tìm thấy sản phẩm</Text>
            <Text style={styles.emptySubtext}>Hãy thử tìm kiếm từ khóa khác</Text>
          </View>
        )}
      </View>

      {/* Filter Modal */}
      <Modal visible={filterOpen} animationType="slide" transparent statusBarTranslucent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Bộ lọc tìm kiếm</Text>
              <TouchableOpacity onPress={() => setFilterOpen(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={24} color="#3F3F46" />
              </TouchableOpacity>
            </View>

            {/* Modal Body */}
            <View style={styles.modalBody}>
              {/* Price Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>💰 Mức giá</Text>
                <View style={styles.pricePresets}>
                  {[
                    { label: 'Dưới 100k', min: 0, max: 100000 },
                    { label: '100k - 200k', min: 100000, max: 200000 },
                    { label: '200k - 500k', min: 200000, max: 500000 },
                    { label: 'Trên 500k', min: 500000, max: 999999999 },
                  ].map((preset, idx) => (
                    <TouchableOpacity
                      key={idx}
                      onPress={() => {
                        setMinPrice(String(preset.min));
                        setMaxPrice(String(preset.max));
                      }}
                      style={[
                        styles.pricePreset,
                        minPrice === String(preset.min) && maxPrice === String(preset.max) && styles.pricePresetActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.pricePresetText,
                          minPrice === String(preset.min) && maxPrice === String(preset.max) && styles.pricePresetTextActive,
                        ]}
                      >
                        {preset.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={styles.customLabel}>Tùy chỉnh giá</Text>
                <View style={styles.customPriceRow}>
                  <TextInput
                    placeholder="Từ"
                    keyboardType="number-pad"
                    value={minPrice}
                    onChangeText={setMinPrice}
                    style={styles.priceInput}
                  />
                  <Text style={styles.priceSeparator}>-</Text>
                  <TextInput
                    placeholder="Đến"
                    keyboardType="number-pad"
                    value={maxPrice}
                    onChangeText={setMaxPrice}
                    style={styles.priceInput}
                  />
                </View>
              </View>

              {/* Category Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>🏷️ Danh mục</Text>
                <View style={styles.categoryGrid}>
                  {categories.map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      onPress={() => setCategory(cat)}
                      style={[styles.categoryChip, category === cat && styles.categoryChipActive]}
                    >
                      <Text style={[styles.categoryChipText, category === cat && styles.categoryChipTextActive]}>
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Other Filters */}
                </View>

            {/* Modal Footer */}
            <View style={styles.modalFooter}>
              <TouchableOpacity onPress={clearFilter} style={styles.filterBtnSecondary}>
                <Text style={styles.filterBtnSecondaryText}>Xóa bộ lọc</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={applyFilter} style={styles.filterBtnPrimary}>
                <Text style={styles.filterBtnPrimaryText}>Áp dụng</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
 
 const styles = StyleSheet.create({
   root: { flex: 1, backgroundColor: '#FFFAF0' },

   // Header
   header: {
     paddingHorizontal: 16,
     paddingVertical: 12,
     flexDirection: 'row',
     alignItems: 'center',
     justifyContent: 'space-between',
     backgroundColor: '#FFFAF0',
     borderBottomWidth: 0,
   },
   headerTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A' },
   backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
   cartBtn: { position: 'relative', width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
   badge: {
     position: 'absolute',
     right: -4,
     top: -4,
     backgroundColor: '#F59E0B',
     minWidth: 18,
     height: 18,
     borderRadius: 9,
     justifyContent: 'center',
     alignItems: 'center',
   },
   badgeText: { color: '#fff', fontSize: 9, fontWeight: '700' },

   // Search Bar - Match ShopHeader
   searchSection: { paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFFAF0' },
   searchBox: {
     flexDirection: 'row',
     alignItems: 'center',
     paddingHorizontal: 12,
     paddingVertical: 8,
     backgroundColor: '#fff',
     borderRadius: 12,
     borderWidth: 1,
     borderColor: '#E5E7EB',
   },
   searchInput: { flex: 1, marginLeft: 8, color: '#1F2937', fontSize: 14 },

   // Sort & Filter Bar
   sortFilterBar: {
     flexDirection: 'row',
     alignItems: 'center',
     paddingHorizontal: 16,
     paddingVertical: 10,
     backgroundColor: '#FFFAF0',
     borderBottomWidth: 1,
     borderBottomColor: '#E5E7EB',
   },
   sortTabs: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
   sortTab: {
     flexDirection: 'row',
     alignItems: 'center',
     paddingHorizontal: 10,
     paddingVertical: 6,
     backgroundColor: '#F9FAFB',
     borderRadius: 6,
     borderWidth: 1,
     borderColor: '#E5E7EB',
     gap: 4,
   },
   sortTabActive: { backgroundColor: '#FEE8D5', borderColor: '#A0522D' },
   sortTabText: { fontSize: 12, color: '#6B7280', fontWeight: '500' },
   sortTabTextActive: { color: '#A0522D', fontWeight: '600' },
   filterBtn: {
     width: 36,
     height: 36,
     alignItems: 'center',
     justifyContent: 'center',
     backgroundColor: '#F9FAFB',
     borderRadius: 6,
     borderWidth: 1,
     borderColor: '#E5E7EB',
   },

   // Active Filters Bar
   activeFiltersBar: {
     paddingHorizontal: 16,
     paddingVertical: 10,
     backgroundColor: '#fff',
     borderBottomWidth: 1,
     borderBottomColor: '#E5E7EB',
     flexDirection: 'row',
     alignItems: 'center',
     justifyContent: 'space-between',
   },
   activeFiltersList: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
   filterTag: {
     flexDirection: 'row',
     alignItems: 'center',
     paddingHorizontal: 10,
     paddingVertical: 6,
     backgroundColor: '#FEE8D5',
     borderRadius: 6,
     gap: 6,
   },
   filterTagText: { fontSize: 12, color: '#A0522D', fontWeight: '500' },
   clearAllBtn: { paddingHorizontal: 8 },
   clearAllText: { fontSize: 12, color: '#EF4444', fontWeight: '600' },

   // Content & Empty State
   content: { flex: 1, paddingHorizontal: 12, paddingVertical: 12 },
   centerLoader: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
   loadingText: { fontSize: 14, color: '#6B7280' },
   emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
   emptyText: { fontSize: 16, fontWeight: '600', color: '#1F2937' },
   emptySubtext: { fontSize: 13, color: '#9CA3AF' },

   // Product Grid
   columnWrapper: { justifyContent: 'space-between' },
   productWrapper: { flex: 1, marginBottom: 12, marginHorizontal: 4 },

   // Filter Modal
   modalOverlay: {
     flex: 1,
     backgroundColor: 'rgba(0, 0, 0, 0.4)',
     justifyContent: 'flex-end',
   },
   modalContent: {
     backgroundColor: '#fff',
     borderTopLeftRadius: 16,
     borderTopRightRadius: 16,
     maxHeight: '85%',
   },
   modalHeader: {
     paddingHorizontal: 16,
     paddingVertical: 14,
     flexDirection: 'row',
     alignItems: 'center',
     justifyContent: 'space-between',
     borderBottomWidth: 1,
     borderBottomColor: '#E5E7EB',
   },
   modalTitle: { fontSize: 16, fontWeight: '700', color: '#1F2937' },
   modalCloseBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
   modalBody: { paddingHorizontal: 16, paddingVertical: 14, maxHeight: '70%' },

   // Filter Sections
   filterSection: { marginBottom: 20 },
   filterSectionTitle: { fontSize: 14, fontWeight: '600', color: '#1F2937', marginBottom: 10 },

   // Price Presets
   pricePresets: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
   pricePreset: {
     paddingHorizontal: 12,
     paddingVertical: 8,
     backgroundColor: '#F9FAFB',
     borderRadius: 6,
     borderWidth: 1,
     borderColor: '#E5E7EB',
   },
   pricePresetActive: { backgroundColor: '#FEE8D5', borderColor: '#A0522D' },
   pricePresetText: { fontSize: 12, color: '#6B7280', fontWeight: '500' },
   pricePresetTextActive: { color: '#A0522D', fontWeight: '600' },

   // Custom Price
   customLabel: { fontSize: 12, fontWeight: '500', color: '#6B7280', marginBottom: 6 },
   customPriceRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
   priceInput: {
     flex: 1,
     paddingHorizontal: 10,
     paddingVertical: 8,
     backgroundColor: '#F9FAFB',
     borderRadius: 6,
     borderWidth: 1,
     borderColor: '#E5E7EB',
     fontSize: 13,
     color: '#1F2937',
   },
   priceSeparator: { color: '#9CA3AF', fontSize: 13 },

   // Category Grid
   categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
   categoryChip: {
     paddingHorizontal: 12,
     paddingVertical: 8,
     backgroundColor: '#F9FAFB',
     borderRadius: 6,
     borderWidth: 1,
     borderColor: '#E5E7EB',
   },
   categoryChipActive: { backgroundColor: '#FEE8D5', borderColor: '#A0522D' },
   categoryChipText: { fontSize: 12, color: '#6B7280', fontWeight: '500' },
   categoryChipTextActive: { color: '#A0522D', fontWeight: '600' },

   // Options Grid
   optionsGrid: { flexDirection: 'column', gap: 8 },
   optionChip: {
     flexDirection: 'row',
     alignItems: 'center',
     paddingHorizontal: 12,
     paddingVertical: 10,
     backgroundColor: '#F9FAFB',
     borderRadius: 6,
     borderWidth: 1,
     borderColor: '#E5E7EB',
     gap: 10,
   },
   optionChipActive: { backgroundColor: '#FEE8D5', borderColor: '#A0522D' },
   checkbox: {
     width: 18,
     height: 18,
     borderRadius: 4,
     borderWidth: 1,
     borderColor: '#D1D5DB',
     alignItems: 'center',
     justifyContent: 'center',
     backgroundColor: '#F9FAFB',
   },
   checkboxActive: { backgroundColor: '#A0522D', borderColor: '#A0522D' },
   optionText: { fontSize: 13, color: '#6B7280', fontWeight: '500' },
   optionTextActive: { color: '#1F2937', fontWeight: '600' },

   // Modal Footer
   modalFooter: {
     paddingHorizontal: 16,
     paddingVertical: 12,
     flexDirection: 'row',
     gap: 10,
     borderTopWidth: 1,
     borderTopColor: '#E5E7EB',
   },
   filterBtnSecondary: {
     flex: 0.4,
     paddingVertical: 10,
     backgroundColor: '#F3F4F6',
     borderRadius: 6,
     alignItems: 'center',
     borderWidth: 1,
     borderColor: '#E5E7EB',
   },
   filterBtnSecondaryText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
   filterBtnPrimary: {
     flex: 1,
     paddingVertical: 10,
     backgroundColor: '#A0522D',
     borderRadius: 6,
     alignItems: 'center',
   },
   filterBtnPrimaryText: { fontSize: 13, fontWeight: '600', color: '#fff' },
 });
