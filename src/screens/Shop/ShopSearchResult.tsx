import React, { useEffect, useState, useCallback } from 'react';
import {  View, Text, FlatList, ActivityIndicator, StyleSheet, Modal, TouchableOpacity, TextInput } from 'react-native';
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

  // make query editable here so user can refine search inside this screen
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

  // sort tab state for segmented control
  const [activeTab, setActiveTab] = useState<'relevance'|'latest'|'bestseller'|'price'>('relevance');

  // extra filter options
  const [categories] = useState<string[]>(['Tất cả','Thực phẩm chức năng','Vitamin','Thiết bị tập','Quần áo','Phụ kiện']);
  const [category, setCategory] = useState<string>('Tất cả');
  const [minRating, setMinRating] = useState<number | null>(null);
  const [freeShipping, setFreeShipping] = useState(false);
  const [onlyMall, setOnlyMall] = useState(false);
  const [inRoadmapToggle, setInRoadmapToggle] = useState(false);

  // load accepts explicit queryArg, sortDirArg and sortFieldArg so callers can control sorting immediately
  const load = useCallback(async (p = 0, queryArg: string | undefined = query, sortDirArg: 'desc' | 'asc' = sortDir, sortFieldArg?: string, filtersArg?: any) => {
    if (p === 0) setLoading(true); else setLoadingMore(true);
    try {
      const filters = filtersArg ?? (appliedFilter ? { minPrice: appliedFilter.minPrice, maxPrice: appliedFilter.maxPrice, ...appliedFilter } : undefined);
      const r: PagedResult<ProductItem> = await getProducts(p, PAGE_SIZE, queryArg || undefined, filters as any, sortFieldArg, sortDirArg);
      let fetched = r.items || [];
      // client-side fallback for inRoadmap filter: if API doesn't support it, filter locally
      const wantsInRoadmap = (filters as any)?.inRoadmap || (appliedFilter as any)?.inRoadmap;
      if (wantsInRoadmap) {
        const roadmapFilter = routeRoadmapFilter;
        const matchesRoadmapItem = (it: ProductItem) => {
          try {
            // server may mark items with raw.inRoadmap flag
            if (it.raw?.inRoadmap === true) return true;
            // if roadmapFilter passed (from RoadMap navigation), try matching by names/category/brand
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

  // initial load using the initial query param
  useEffect(() => {
    // if roadmapFilter passed from RoadMap navigation, preapply as filters
    if (routeRoadmapFilter) {
      setAppliedFilter(routeRoadmapFilter);
      // call load with explicit filtersArg so we don't race with setState
      load(0, routeQ, sortDir, undefined, routeRoadmapFilter);
      return;
    }
    load(0, routeQ);
  }, [load, routeQ, routeRoadmapFilter, sortDir]);

  const loadMore = () => { if (items.length < total) load(page + 1); };

  // include category/rating flags into appliedFilter
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
  }

  function clearFilter() {
    setMinPrice(''); setMaxPrice(''); setAppliedFilter(undefined);
    setCategory('Tất cả'); setMinRating(null); setFreeShipping(false); setOnlyMall(false);
  }

  function onSelectTab(tab: typeof activeTab) {
    // compute next sort direction and trigger load immediately with it to avoid stale state
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
    // call load with explicit sortField and sortDir so server sorts accordingly
    load(0, query, nextSort, sortField);
  }

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.headerRowWithBack}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.title}>Tìm kiếm sản phẩm</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Cart' as any)} style={styles.cartBtn}>
          <View style={styles.cartWrap}>
            <Ionicons name="cart-outline" size={20} color="#0F172A" />
            {totalItems > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{totalItems > 99 ? '99+' : String(totalItems)}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>

      {/* inline search input inside results so user can refine without going back */}
      <View style={styles.headerSearchWrap}>
        <View style={styles.headerSearch}>
          <Ionicons name="search-outline" size={16} color="#9CA3AF" />
          <TextInput
            placeholder="Tìm kiếm trong kết quả"
            style={styles.headerSearchInput}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
            onSubmitEditing={() => load(0, query)}
          />
          <TouchableOpacity onPress={() => load(0, query)} style={styles.searchBtn}>
            <Ionicons name="search" size={18} color={'#E07A4D'} />
          </TouchableOpacity>
        </View>
      </View>

      {/* tabs: relevance / latest / bestseller / price + filter */}
      <View style={styles.tabsRow}>
        <View style={styles.tabsLeft}>
          {[
            { id: 'relevance', label: 'Liên quan' },
            { id: 'latest', label: 'Mới nhất' },
            { id: 'bestseller', label: 'Bán chạy' },
          ].map(t => (
            <TouchableOpacity key={t.id} onPress={() => onSelectTab(t.id as any)} style={[styles.tabBtn, activeTab === t.id ? styles.tabBtnActive : null]}>
              <Text style={[styles.tabText, activeTab === t.id ? styles.tabTextActive : null]}>{t.label}</Text>
            </TouchableOpacity>
          ))}

          <TouchableOpacity onPress={() => onSelectTab('price')} style={[styles.tabBtn, activeTab === 'price' ? styles.tabBtnActive : null]}>
            <Text style={[styles.tabText, activeTab === 'price' ? styles.tabTextActive : null]}>Giá {sortDir === 'desc' ? '▾' : '▴'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.tabsRight}>
          <TouchableOpacity style={styles.filterChip} onPress={() => setFilterOpen(true)}>
            <Ionicons name="filter" size={16} color="#E07A4D" />
            <Text style={styles.filterChipText}>Lọc</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.content}>
        {/* active filter chips */}
        {appliedFilter ? (
          <View style={styles.activeChipsRow}>
            {appliedFilter.minPrice != null || appliedFilter.maxPrice != null ? (
              <View style={styles.filterChipActive}>
                <Text style={styles.filterChipActiveText}>{appliedFilter.minPrice ? `≥ ${appliedFilter.minPrice}` : ''}{appliedFilter.minPrice && appliedFilter.maxPrice ? ' - ' : ''}{appliedFilter.maxPrice ? `≤ ${appliedFilter.maxPrice}` : ''}</Text>
                <TouchableOpacity onPress={() => { clearFilter(); load(0); }}><Text style={styles.removeChip}>✕</Text></TouchableOpacity>
              </View>
            ) : null}
            {appliedFilter?.category ? (
              <View style={styles.filterChipActive}>
                <Text style={styles.filterChipActiveText}>{appliedFilter.category}</Text>
                <TouchableOpacity onPress={() => { setAppliedFilter((prev: any) => { const p = { ...(prev||{}) }; delete p.category; return Object.keys(p).length ? p : undefined; }); load(0); }}><Text style={styles.removeChip}>✕</Text></TouchableOpacity>
              </View>
            ) : null}
            {appliedFilter?.minRating ? (
              <View style={styles.filterChipActive}>
                <Text style={styles.filterChipActiveText}>{`★ ${appliedFilter.minRating}+`}</Text>
                <TouchableOpacity onPress={() => { setAppliedFilter((prev: any) => { const p = { ...(prev||{}) }; delete p.minRating; return Object.keys(p).length ? p : undefined; }); load(0); }}><Text style={styles.removeChip}>✕</Text></TouchableOpacity>
              </View>
            ) : null}
            {appliedFilter?.freeShipping ? (
              <View style={styles.filterChipActive}>
                <Text style={styles.filterChipActiveText}>Miễn phí vận chuyển</Text>
                <TouchableOpacity onPress={() => { setAppliedFilter((prev: any) => { const p = { ...(prev||{}) }; delete p.freeShipping; return Object.keys(p).length ? p : undefined; }); load(0); }}><Text style={styles.removeChip}>✕</Text></TouchableOpacity>
              </View>
            ) : null}
            {appliedFilter?.onlyMall ? (
              <View style={styles.filterChipActive}>
                <Text style={styles.filterChipActiveText}>Mall</Text>
                <TouchableOpacity onPress={() => { setAppliedFilter((prev: any) => { const p = { ...(prev||{}) }; delete p.onlyMall; return Object.keys(p).length ? p : undefined; }); load(0); }}><Text style={styles.removeChip}>✕</Text></TouchableOpacity>
              </View>
            ) : null}
            {appliedFilter?.inRoadmap ? (
              <View style={styles.filterChipActive}>
                <Text style={styles.filterChipActiveText}>Trong roadmap</Text>
                <TouchableOpacity onPress={() => { setAppliedFilter((prev: any) => { const p = { ...(prev||{}) }; delete p.inRoadmap; return Object.keys(p).length ? p : undefined; }); load(0); }}><Text style={styles.removeChip}>✕</Text></TouchableOpacity>
              </View>
            ) : null}
          </View>
        ) : null}

        {loading ? <ActivityIndicator /> : (
           <FlatList
             data={items}
             keyExtractor={i => i.productId}
             numColumns={2}
             renderItem={({ item }) => (
               <View style={styles.cardWrap}>
                 <CardProduct item={item as any} onPress={() => navigation.navigate('ProductDetail' as any, { productId: item.productId })} />
               </View>
             )}
             onEndReached={loadMore}
             onEndReachedThreshold={0.6}
             columnWrapperStyle={styles.columnWrapper}
             showsVerticalScrollIndicator={false}
           />
        )}
      </View>

      <Modal visible={filterOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Bộ lọc</Text>
              <TouchableOpacity onPress={() => setFilterOpen(false)}><Ionicons name="close" size={20} /></TouchableOpacity>
            </View>

            <Text style={styles.sectionTitle}>Mức giá</Text>
            <View style={styles.presetRow}>
              <TouchableOpacity onPress={() => { setMinPrice('0'); setMaxPrice('100000'); }} style={styles.presetBtn}><Text style={styles.presetText}>Dưới 100k</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => { setMinPrice('100000'); setMaxPrice('200000'); }} style={styles.presetBtn}><Text style={styles.presetText}>100k - 200k</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => { setMinPrice('200000'); setMaxPrice('500000'); }} style={styles.presetBtn}><Text style={styles.presetText}>200k - 500k</Text></TouchableOpacity>
            </View>

            <Text style={styles.sectionTitle}>Tùy chỉnh</Text>
            <View style={styles.customRow}>
              <TextInput placeholder="Giá từ" keyboardType="number-pad" value={minPrice} onChangeText={setMinPrice} style={styles.input} />
              <TextInput placeholder="Giá đến" keyboardType="number-pad" value={maxPrice} onChangeText={setMaxPrice} style={styles.input} />
            </View>

            <Text style={styles.sectionTitle}>Danh mục</Text>
            <View style={styles.flexRowWrap}>
              {categories.map(c => (
                <TouchableOpacity key={c} onPress={() => setCategory(c)} style={[styles.presetBtn, category === c ? styles.presetBtnActive : null]}>
                  <Text style={styles.presetText}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.sectionTitle}>Thêm lựa chọn</Text>
            <View style={styles.smallRow}>
              <TouchableOpacity onPress={() => setMinRating(prev => prev === 4 ? null : 4)} style={[styles.smallToggle, minRating === 4 ? styles.smallToggleActive : null]}>
                <Text style={minRating === 4 ? styles.smallToggleTextActive : styles.smallToggleText}>★4+</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setFreeShipping(prev => !prev)} style={[styles.smallToggle, freeShipping ? styles.smallToggleActive : null]}>
                <Text style={freeShipping ? styles.smallToggleTextActive : styles.smallToggleText}>Miễn phí</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setOnlyMall(prev => !prev)} style={[styles.smallToggle, onlyMall ? styles.smallToggleActive : null]}>
                <Text style={onlyMall ? styles.smallToggleTextActive : styles.smallToggleText}>Mall</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setInRoadmapToggle(prev => !prev)} style={[styles.smallToggle, inRoadmapToggle ? styles.smallToggleActive : null]}>
                <Text style={inRoadmapToggle ? styles.smallToggleTextActive : styles.smallToggleText}>Trong roadmap</Text>
              </TouchableOpacity>
            </View>

             <View style={styles.modalActions}>
               <TouchableOpacity onPress={clearFilter} style={styles.clearBtn}><Text>Xóa</Text></TouchableOpacity>
               <TouchableOpacity onPress={applyFilter} style={styles.applyBtn}><Text style={styles.applyBtnText}>Áp dụng</Text></TouchableOpacity>
             </View>
           </View>
         </View>
       </Modal>

     </SafeAreaView>
   );
 }
 
 const styles = StyleSheet.create({
   root: { flex: 1, backgroundColor: '#FFF8F0' },
   headerRowWithBack: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
   backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
   title: { fontSize: 18, fontWeight: '700', color: '#0F172A' },
   spacer: { width: 36 },
   cartWrap: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
   cartBadge: { position: 'absolute', right: -6, top: -6, backgroundColor: '#F59E0B', minWidth: 16, height: 16, borderRadius: 8, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 3 },
   cartBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },

   tabsRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#FFF8F0', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
   tabsLeft: { flexDirection: 'row', alignItems: 'center' },
   tabsRight: { marginLeft: 8 },
   tabBtn: { paddingHorizontal: 10, paddingVertical: 6, marginRight: 6, borderRadius: 8 },
   tabBtnActive: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#F3F4F6' },
   tabText: { color: '#6b7280', fontWeight: '600' },
   tabTextActive: { color: '#E07A4D' },
   filterChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#F3F4F6' },
   filterChipText: { marginLeft: 6, color: '#E07A4D', fontWeight: '700' },

   content: { flex: 1, paddingHorizontal: 12, paddingTop: 12 },
   columnWrapper: { justifyContent: 'space-between', marginBottom: 12 },
   cardWrap: { flex: 1, paddingHorizontal: 6, paddingBottom: 12 },

   modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
   modalSheet: { backgroundColor: '#fff', padding: 16, borderTopLeftRadius: 14, borderTopRightRadius: 14 },
   modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
   modalTitle: { fontSize: 16, fontWeight: '700' },
   sectionTitle: { marginTop: 8, marginBottom: 8, fontWeight: '600' },
   presetRow: { flexDirection: 'row', flexWrap: 'wrap' },
   presetBtn: { backgroundColor: '#FFF8F0', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, marginRight: 8, marginBottom: 8, borderWidth: 1, borderColor: '#FDE68A' },
   presetText: { color: '#A16207' },
   customRow: { flexDirection: 'row', gap: 8 },
   input: { flex: 1, borderWidth: 1, borderColor: '#E5E7EB', padding: 8, borderRadius: 8, marginRight: 8 },
   modalActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
   clearBtn: { padding: 12 },
   applyBtn: { backgroundColor: '#F59E0B', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10 },
   applyBtnText: { color: '#fff' },
   resultHeader: { paddingVertical: 10, paddingHorizontal: 12 },
   resultCount: { color: '#6b7280', fontSize: 13 },
   resultQuery: { fontSize: 14, fontWeight: '600', marginTop: 4 },
   headerSearchWrap: { paddingHorizontal: 12, paddingTop: 8, paddingBottom: 4, backgroundColor: '#FFF8F0' },
   headerSearch: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 8, borderRadius: 10, borderWidth: 1, borderColor: '#F3F4F6' },
   headerSearchInput: { flex: 1, marginLeft: 8, paddingVertical: 4 },
   searchBtn: { paddingLeft: 10 },
   categoryRowWrap: { paddingVertical: 8, paddingLeft: 12, backgroundColor: '#FFF8F0' },
   categoryRow: { paddingRight: 12, alignItems: 'center' },
   categoryChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: '#fff', marginRight: 8, borderWidth: 1, borderColor: '#F3F4F6' },
   categoryChipActive: { backgroundColor: '#E07A4D' },
   categoryChipText: { color: '#6b7280' },
   categoryChipTextActive: { color: '#fff', fontWeight: '700' },
   activeChipsRow: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, paddingVertical: 8 },
   filterChipActive: { backgroundColor: '#fff', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, marginRight: 8, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#f3f4f6' },
   filterChipActiveText: { marginRight: 6, color: '#374151' },
   removeChip: { color: '#9ca3af', fontSize: 12 },
   smallToggle: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB', marginRight: 8 },
   smallToggleActive: { backgroundColor: '#E07A4D', borderColor: '#E07A4D' },
   smallToggleText: { color: '#374151' },
   smallToggleTextActive: { color: '#fff' },
  flexRowWrap: { flexDirection: 'row', flexWrap: 'wrap' },
  presetBtnActive: { borderColor: '#E07A4D' },
  smallRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  cartBtn: { marginLeft: 'auto', padding: 8 },
 });
